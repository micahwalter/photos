import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

import * as path from 'path';


export class PhotosStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1 - source bucket where original photos will be uploaded
    // this will be configured with S3 EventBridge enabled
    // block public access

    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      eventBridgeEnabled: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });

    // 2 - Lambda - Image Processing
    // This will use Sharp to create derivitive versions of images and store them in Target bucket
    // This will also extract metadata and IPTC data via Sharp and store that in DynamoDB
    // should update or create new record and not overwrite entirely if exists

    const photoProcessingFunction = new lambda.Function(this, 'PhotoProcessingFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'photoProcessing.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/photoProcessing')),
    });

    // EventBridge Rule for new or updated objects
    const putObjectRule = new events.Rule(this, 'putObjectRule', {
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["Object Created"],
        detail: {
          bucket: {
            name: [sourceBucket.bucketName]
          }
        }
      },
    });

    // EventBridge Target for new and updated objects
    putObjectRule.addTarget(new targets.LambdaFunction(photoProcessingFunction));

    // 5 - Lambda - Cleanup
    // This will delete derivitive image files from target bucket
    // This will also delete database entry for image

    const photoCleanupFunction = new lambda.Function(this, 'PhotoCleanupFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'photoCleanup.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/photoCleanup')),
    });

    // EventBridge Rule for deleted objects
    const deleteObjectRule = new events.Rule(this, 'deleteObjectRule', {
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["Object Deleted"],
        detail: {
          bucket: {
            name: [sourceBucket.bucketName]
          }
        }
      },
    });

    // EventBridge Target for deleted objects
    deleteObjectRule.addTarget(new targets.LambdaFunction(photoCleanupFunction));


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

    new cloudfront.Distribution(this, 'photosDist', {
      defaultBehavior: { origin: new origins.S3Origin(targetBucket) },
    });

    // 8 - DynamoDB
    // Single DynamoDB table to hold metadata for each image
    // Image document will also beused to store data generated elswhere about each photo

    // dynamodb table for photos
    const photosTable = new dynamodb.Table(this, 'PhotosTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
      tableName: "photos",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Global Secondary Index so we can look an item up by it's original S3 key
    photosTable.addGlobalSecondaryIndex({
      indexName: 'originalFileObjectKeyIndex',
      partitionKey: {name: 'originalFileObjectKey', type: dynamodb.AttributeType.STRING},
    });

    // Photos lambda function - fetch info about photos via the API
    const photosFunction = new lambda.Function(this, 'PhotosFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'photos.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/photos')),
    });

    // grant lambdas permission to read/write to the dynamodb table
    photosTable.grantReadWriteData(photosFunction);
    photosTable.grantReadWriteData(photoProcessingFunction);
    photosTable.grantReadWriteData(photoCleanupFunction);

    // grant lambdas permission to read/write to S3
    sourceBucket.grantRead(photoProcessingFunction);
    targetBucket.grantReadWrite(photoProcessingFunction);
    targetBucket.grantReadWrite(photoCleanupFunction);

    // 9 - API Gateway
    // REST API endpoint to fetch info about an image from DynamoDB
    // endpoint to allow updating of metadata

    new apigateway.LambdaRestApi(this, 'photos-apigw', {
      handler: photosFunction,
    });

  }
}
