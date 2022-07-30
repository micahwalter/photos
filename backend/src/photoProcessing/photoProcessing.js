const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

const axios = require('axios').default;

exports.handler = async (event) => {
    
    // this function handles processing a new or updated image from the source bucket.

    // first we need to look up the image by its S3 key to see if it already exists

    const objectKey = event.detail.object.key;
    
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
    
    // next use sharp to do image processing

    // create derivitive sizes and store in target bucket

    // with naming conventions like
    // <Brooklyn Int>/<Brooklyn Int>_<size>.jpg

    // extract metadata

    // extract stats

    // store metadata and stats in DynamoDB with Brooklyn Int as id
    // if a new record use put, otherwise use update
    if (data.Items.length == 0) {
        var params = {
            TableName: 'photos',
            Item: {
                'id': brooklynInt,
                'originalFileObjectKey': objectKey,
                'createdAt': Math.floor(new Date().getTime() / 1000),
                'updatedAt': null
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