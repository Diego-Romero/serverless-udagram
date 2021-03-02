import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';
import getGroups from '@functions/getGroups';
import createGroups from '@functions/createGroups';
import getImages from '@functions/getImages';
import getImage from '@functions/getImage';
import createImage from '@functions/createImage';

const serverlessConfiguration: AWS = {
  service: 'service-10-udagram-app',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
  },
  plugins: ['serverless-webpack', 'serverless-offline', 'serverless-dynamodb-local'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: "${opt:stage, 'dev'}",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      GROUPS_TABLE: "Groups-${self:provider.stage}",
      IMAGES_TABLE: "Images-${self:provider.stage}",
      IMAGE_ID_INDEX: "ImageIdIndex",
      IMAGES_S3_BUCKET: "serverless-udagram-${self:provider.stage}"
    }, 
    iamRoleStatements: [
      { 
        Effect: 'Allow', 
        Action: [ 'dynamodb:Scan', 'dynamodb:PutItem', 'dynamodb:GetItem'],
        Resource: {
          "Fn::GetAtt": [ "GroupsDynamoDBTable", "Arn"]
        }
      },
      {
        Effect: 'Allow',
        Action: [ 'dynamodb:Query', 'dynamodb:PutItem' ],
        Resource: {
          "Fn::GetAtt": [ "ImagesDynamoDBTable", "Arn"]
        }
      },
     {
        Effect: 'Allow',
        Action: [ 'dynamodb:Query' ],
        Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}'
      }
    ],
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: { hello, getGroups, createGroups, getImages, getImage, createImage },
  resources: {
    Resources: {
      AttachmentsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:provider.environment.IMAGES_S3_BUCKET}",
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                  'DELETE',
                  'HEAD',
                ],
                MaxAge: 3000
              }
            ]
          }
        }
      },
      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: {
            "Ref": "AttachmentsBucket"
          },
          PolicyDocument: {
            Id: 'MyPolicy',
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadForGetBucketObjects',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:*',
                Resource: {
                    "Fn::Join": [
                        "",
                        [
                            "arn:aws:s3:::",
                            {
                                "Ref": "AttachmentsBucket"
                            },
                            "/*"
                        ]
                    ]
                },
              }
            ]
          },
        },
      },
      GroupsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
          ],
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
          ],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: "${self:provider.environment.GROUPS_TABLE}"
        }
      },
      ImagesDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            { AttributeName: 'groupId', AttributeType: 'S' },  
            { AttributeName: 'timestamp', AttributeType: 'S' },
            { AttributeName: 'imageId', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'groupId', KeyType: 'HASH'},
            { AttributeName: 'timestamp', KeyType: 'RANGE'}
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.IMAGE_ID_INDEX}',
              KeySchema: [
                { 
                  AttributeName: 'imageId',
                  KeyType: 'HASH'
                }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.IMAGES_TABLE}"
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
