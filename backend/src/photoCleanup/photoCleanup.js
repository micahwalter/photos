const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {

    // this function deletes files from the targetBucket and corresponding DynamoDB record

    // look up record by s3 key
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

    if (data.Items.length == 0) {
        console.log("Do nothing");
    } else {
        // delete files on the bucket

        // delete record in DynamoDB
        var params = {
            Key: {
              'id': data.Items[0].id
            },
            TableName: 'photos'
        };

        const rsp = await dynamo.delete(params).promise();

    }

    return data; 
};
