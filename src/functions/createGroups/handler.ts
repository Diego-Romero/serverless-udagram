import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import * as uuid from 'uuid';
import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE;

import schema from './schema';

const createGroupHandler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {

  const id = uuid.v4();

  const newItem = {
    id,
    ...event.body
  }

  const createdItem = await docClient.put({
    TableName: groupsTable,
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

export const main = middyfy(createGroupHandler);
