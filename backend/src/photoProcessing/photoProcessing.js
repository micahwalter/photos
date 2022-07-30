const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const axios = require('axios').default;
const sharp = require('sharp');

exports.handler = async (event) => {
    
    // this function handles processing a new or updated image from the source bucket.

    // first we need to look up the image by its S3 key to see if it already exists

    const objectKey = event.detail.object.key;
    const srcBucket = event.detail.bucket.name;
    
    var params = {
        TableName: 'photos',
        IndexName: 'originalFileObjectKeyIndex',
        KeyConditionExpression: 'originalFileObjectKey = :originalFileObjectKey',
        ExpressionAttributeValues: {
          ':originalFileObjectKey': objectKey,
        }
    }
    
    const data = await dynamo.query(params).promise()
    
    // if it doesn't exist, mint a new Brooklyn Int
    var brooklynInt = null;
    
    if (data.Items.length == 0) {
        const bk = await axios.post('https://api.brooklynintegers.com/rest/?method=brooklyn.integers.create')
            .then(function (response) {
                brooklynInt = response.data.integer;
            })
            .catch(function (error) {
                console.log(error);
            });
    } else {
        brooklynInt = data.Items[0].id
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
    
    // next use sharp to do image processing
    
    // create a thumbnail
    var width  = 300;
    
    try {
      var buffer = await sharp(origimage.Body).resize(width).jpeg().toBuffer();

    } catch (error) {
        console.log(error);
        return;
    }
    
    // save result on destination bucket
    const baseName = objectKey.replace(/\.[^/.]+$/, "")
    
    const thumbnailKey = baseName + "/" + baseName + "_t.jpg";
    
    try {
      const destparams = {
          Bucket: process.env.targetBucket,
          Key: thumbnailKey,
          Body: buffer,
          ContentType: "image"
      };

      const putResult = await s3.putObject(destparams).promise();

    } catch (error) {
        console.log(error);
        return;
    }


    // create derivitive sizes and store in target bucket

    // medium
    width  = 1200;
    
    try {
      var buffer = await sharp(origimage.Body).resize(width).jpeg().toBuffer();

    } catch (error) {
        console.log(error);
        return;
    }
    
    // save result on destination bucket    
    const mediumKey = baseName + "/" + baseName + "_m.jpg";
    
    try {
      const destparams = {
          Bucket: process.env.targetBucket,
          Key: mediumKey,
          Body: buffer,
          ContentType: "image"
      };

      const putResult = await s3.putObject(destparams).promise();

    } catch (error) {
        console.log(error);
        return;
    }

    // large
    width  = 2400;
    
    try {
      var buffer = await sharp(origimage.Body).resize(width).jpeg().toBuffer();

    } catch (error) {
        console.log(error);
        return;
    }
    
    // save result on destination bucket    
    const largeKey = baseName + "/" + baseName + "_l.jpg";
    
    try {
      const destparams = {
          Bucket: process.env.targetBucket,
          Key: largeKey,
          Body: buffer,
          ContentType: "image"
      };

      const putResult = await s3.putObject(destparams).promise();

    } catch (error) {
        console.log(error);
        return;
    }    

    // original ..
    
    try {
        var buffer = await sharp(origimage.Body).toFormat('jpeg').toBuffer();
  
    } catch (error) {
        console.log(error);
        return;
    }

    const originalKey = baseName + "/" + baseName + "_o.jpg";
    
    try {
      const destparams = {
          Bucket: process.env.targetBucket,
          Key: originalKey,
          Body: buffer,
          ContentType: "image"
      };

      const putResult = await s3.putObject(destparams).promise();

    } catch (error) {
        console.log(error);
        return;
    }

    // extract metadata
    const metadata = await sharp(origimage.Body).metadata();
    
    // extract stats
    const stats = await sharp(origimage.Body).stats();

    // store metadata and stats in DynamoDB with Brooklyn Int as id
    // if a new record use put, otherwise use update
    if (data.Items.length == 0) {
        var params = {
            TableName: 'photos',
            Item: {
                'id': brooklynInt,
                'originalFileObjectKey': objectKey,
                'createdAt': Math.floor(new Date().getTime() / 1000),
                'updatedAt': null,
                'images': {
                    'o': originalKey,
                    'l': largeKey,
                    'm': mediumKey,
                    't': thumbnailKey,
                },
                'metadata': metadata,
                'stats': stats
            }
        };
      
        const rsp = await dynamo.put(params).promise();

    } else {
        var params = {
            TableName: 'photos',
            Key: {
                'id' : brooklynInt,
            },
            UpdateExpression: 'set updatedAt = :u',
            ExpressionAttributeValues: {
                ':u' : Math.floor(new Date().getTime() / 1000),
            }
        };
        
        const rsp = await dynamo.update(params).promise();
        
    }

    return data

};