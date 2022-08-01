const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const axios = require('axios').default;
const sharp = require('sharp');
const iptc = require('iptc-reader');
const exif = require('exif-reader');

exports.handler = async (event) => {
    
    // this function handles processing a new or updated image from the source bucket.

    const srcBucket = event.detail.bucket.name;
    const objectKey = event.detail.object.key;

    // first we need to look up the image by its S3 key to see if it already exists

    var params = {
        TableName: 'photos',
        IndexName: 'originalFileObjectKeyIndex',
        KeyConditionExpression: 'originalFileObjectKey = :originalFileObjectKey',
        ExpressionAttributeValues: {
          ':originalFileObjectKey': objectKey,
        }
    }
    
    const existingImage = await dynamo.query(params).promise()
    
    
    // if it doesn't exist, mint a new Brooklyn Int
    var brooklynInt = null;
    
    if (existingImage.Items.length == 0) {
        const bk = await axios.post('https://api.brooklynintegers.com/rest/?method=brooklyn.integers.create')
            .then(function (response) {
                brooklynInt = response.data.integer;
            })
            .catch(function (error) {
                console.log(error);
            });
    } else {
        brooklynInt = existingImage.Items[0].id
    }
    
    // download the image from s3
    try {
        const params = {
            Bucket: srcBucket,
            Key: objectKey
        };
        var origimage = await s3.getObject(params).promise();

    } catch (error) {
        console.log(error);
        return;
    }
    
    // extract metadata & stats
    var metadata = await sharp(origimage.Body).metadata();
    metadata.iptc = iptc(metadata.iptc);
    metadata.exif = exif(metadata.exif);

    const stats = await sharp(origimage.Body).stats();
    
    // next use sharp to do image processing
    //const baseName = objectKey.replace(/\.[^/.]+$/, "")
    const baseName = brooklynInt;

    const sizes = [
        {
            "width": 300,
            "height": 300,
            "extension": "t",
            "key": baseName + "/" + baseName + "_t.jpg"  
        },
        {
            "width": 1200,
            "height": 1200,
            "extension": "m",
            "key": baseName + "/" + baseName + "_m.jpg"  
        },
        {
            "width": 2400,
            "height": 2400,
            "extension": "l",
            "key": baseName + "/" + baseName + "_l.jpg"  
        },
        {
            "width": metadata.width,
            "height": metadata.height,
            "extension": "o",
            "key": baseName + "/" + baseName + "_o.jpg"  
        },
    ]

    let images = {}
    
    for (let size of sizes) {
        
        images[size.extension] = size;
        
        const {data, info} = await sharp(origimage.Body)
                            .resize(size.width, size.height, {
                                fit: 'inside',
                             })
                            .jpeg()
                            .toBuffer({ resolveWithObject: true })

        const { width, height, channels } = info;
        
        images[size.extension].width = width;
        images[size.extension].height = height;

        
        var destparams = {
                Bucket: process.env.targetBucket,
                Key: size.key,
                Body: data,
                ContentType: "image"
            };

        const putResult = await s3.putObject(destparams).promise();

    }
    
    // store metadata and stats in DynamoDB with Brooklyn Int as id

    var params = {
        TableName: 'photos',
        Item: {
            'id': brooklynInt,
            'originalFileObjectKey': objectKey,
            'createdAt': Math.floor(new Date().getTime() / 1000),
            'updatedAt': null,
            'images': images,
            'metadata': metadata,
            'stats': stats
        }
    };

    if (existingImage.Items.length > 0) {
        params.Item.createdAt = existingImage.Items[0].createdAt;
        params.Item.updatedAt = Math.floor(new Date().getTime() / 1000)
    }
      
    const rsp = await dynamo.put(params).promise();

    return rsp

};