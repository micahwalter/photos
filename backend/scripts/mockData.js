// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({ region: 'us-east-1' });

// Create DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

var paramsA = {
    RequestItems: {
        "photos": [
            {
                PutRequest: {
                    Item: {
                        "id": { "N": "1234" },
                        "title": { "S": "Another Sunset." },
                        "createdAt": {"N": "1659106281"},
                        "originalFileObjectKey": {"S": "/path/to/my/object/IMG_1234.jpg"},
                        "status": {"S": "published"}
                    }
                }
            },
            {
                PutRequest: {
                    Item: {
                        "id": { "N": "5678" },
                        "title": { "S": "Another Amazing Sunset." },
                        "createdAt": {"N": "1659106291"},
                        "originalFileObjectKey": {"S": "/path/to/my/object/IMG_5678.jpg"},
                        "status": {"S": "published"}
                    }
                }
            },
            {
                PutRequest: {
                    Item: {
                        "id": { "N": "9876" },
                        "title": { "S": "Another Stupid Sunset." },
                        "createdAt": {"N": "1659106123"},
                        "originalFileObjectKey": {"S": "/path/to/my/object/IMG_9876.jpg"},
                        "status": {"S": "draft"}
                    }
                }
            },
            {
                PutRequest: {
                    Item: {
                        "id": { "N": "5432" },
                        "title": { "S": "Not Another Sunset." },
                        "createdAt": {"N": "1659106299"},
                        "originalFileObjectKey": {"S": "/path/to/my/object/IMG_5432.jpg"},
                        "status": {"S": "published"}
                    }
                }
            },
            {
                PutRequest: {
                    Item: {
                        "id": { "N": "111111" },
                        "title": { "S": "Another Sunset." },
                        "createdAt": {"N": "1659106286"},
                        "originalFileObjectKey": {"S": "/path/to/my/object/IMG_111111.jpg"},
                        "status": {"S": "draft"}
                    }
                }
            },

        ]
    },
}

ddb.batchWriteItem(paramsA, function (err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data);
    }
});