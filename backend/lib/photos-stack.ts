import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

import * as path from 'path';


export class PhotosStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // rough out the components here

    // 1 - source bucket where original photos will be uploaded
    // this will be configured with S3 Event notifications for put events
    // this will also need S3 Event Notifications for delete events
    // block public access

    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      eventBridgeEnabled: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });

    // 2 - SNS Topic - PUT Events
    // this will receive PUT events from source bucket and send messages to:
    // Lambda for image processing and metadata extraction

    // 3 - SNS Topic - Delete Events
    // this will send events to Lambda to cleanup target images and DB entries

    // 4 - Lambda - Image Processing
    // This will use Sharp to create derivitive versions of images and store them in Target bucket
    // This will also extract metadata and IPTC data via Sharp and store that in DynamoDB
    // should update or create new record and not overwrite entirely if exists

    // 5 - Lambda - Cleanup
    // This will delete derivitive image files from target bucket
    // This will also delete database entry for image

    // 6 - Target bucket
    // Bucket will be used to hold all derivitive images
    // block public access

    const targetBucket = new s3.Bucket(this, 'TargetBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // 7 - CloudFront Distro
    // This will use the Target bucket as origin
    // use origin access identity config

    // 8 - DynamoDB
    // Single DynamoDB table to hold metadata for each image
    // Image document will also beused to store data generated elswhere about each photo

    // dynamodb table for photos
    const photosTable = new dynamodb.Table(this, 'PhotosTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
      tableName: "photos",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    photosTable.addGlobalSecondaryIndex({
      indexName: 'originalFileObjectKeyIndex',
      partitionKey: {name: 'originalFileObjectKey', type: dynamodb.AttributeType.STRING},
    });

    // photos lambda function
    const photosFunction = new lambda.Function(this, 'PhotosFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'photos.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/photos')),
    });

    // grant lambda permission to read/write to the dynamodb table
    photosTable.grantReadWriteData(photosFunction);

    // 9 - API Gateway
    // REST API endpoint to fetch info about an image from DynamoDB
    // endpoint to allow updating of metadata

    new apigateway.LambdaRestApi(this, 'photos-apigw', {
      handler: photosFunction,
    });

  }
}
