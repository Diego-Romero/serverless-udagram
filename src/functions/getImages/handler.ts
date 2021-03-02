import 'source-map-support/register';

import { formatJSONResponse } from '@libs/apiGateway';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const main:  APIGatewayProxyHandler = async (event: APIGatewayProxyEvent ): Promise<APIGatewayProxyResult> => {

  console.log(event.pathParameters.groupId)
  const groupId = decodeURIComponent(event.pathParameters.groupId);
  const validGroupId = await groupExists(groupId.toString());
  console.log(groupId, validGroupId)

  if(!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Group doesnt exist'
      })
    }
  }

  const images = await getImagesPerGroup(groupId);

  return formatJSONResponse({
    items: images
  });
}

async function groupExists(groupId: string): Promise<boolean> {
  const result = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  }).promise();

  console.log('get group: ', groupId, result);
  return !!result.Item;
}

async function getImagesPerGroup(groupId: string) {
  const result = await docClient.query({
    TableName: imagesTable,
    KeyConditionExpression: 'groupId = :groupId',
    ExpressionAttributeValues: {
      ':groupId': groupId
    },
    ScanIndexForward: false
  }).promise();

  console.log('images', result)

  return result.Items;
}