import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import * as uuid from 'uuid';
import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

import schema from './schema';

const createImageHandler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {

  const groupId = event.pathParameters.groupId;
  const validGroup = await groupExists(groupId.toString())

  if (!validGroup) {
   return {
      statusCode: 404,
      body: ''
    } 
  }

  const id = uuid.v4();

  const newItem = {
    imageId: id,
    timestamp: new Date().toISOString(),
    groupId,
    ...event.body
  }

  const createdItem = await docClient.put({
    TableName: imagesTable,
    Item: newItem
  }).promise();

  console.log('created item:', createdItem);


  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(createdItem)
  }
}

async function groupExists(groupId: string) {
  const result= await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  }).promise()

  console.log('group result', result)
  return !!result.Item
}

export const main = middyfy(createImageHandler);
