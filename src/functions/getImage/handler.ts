import 'source-map-support/register';

import { formatJSONResponse } from '@libs/apiGateway';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient()
const imagesTable = process.env.IMAGES_TABLE;
const imageIdIndex = process.env.IMAGE_ID_INDEX;

export const main:  APIGatewayProxyHandler = async (event: APIGatewayProxyEvent ): Promise<APIGatewayProxyResult> => {

  const imageId = event.pathParameters.imageId;

  const result = await docClient.query({
    TableName: imagesTable,
    IndexName: imageIdIndex,
    KeyConditionExpression: 'imageId = :imageId',
    ExpressionAttributeValues: {
      ':imageId': imageId
    }
  }).promise();

  if (result.Count !== 0) {
    return formatJSONResponse({
      result
    })
  }

  return {
    statusCode: 404,
    body: ''
  }

  // return formatJSONResponse({
  //   items: images
  // });
}
