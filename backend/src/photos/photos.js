const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {

    let body;
    let statusCode = '200';
    
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.pathParameters) {
                    let id = event.pathParameters.proxy;
                    body = await dynamo.get({
                        TableName: "photos",
                        Key: {
                          id: parseInt(id)
                        }
                    }).promise();
                } else {
                    body = await dynamo.scan({ 
                        TableName: "photos" 
                    }).promise();
                }
                break;
            default:
                throw new Error(`Unsupported route "${event.httpMethod}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        if (Object.keys(body).length === 0) {
            statusCode = '404';
            body = `Item matching "${event.pathParameters.proxy}" not found`;
        } 
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};