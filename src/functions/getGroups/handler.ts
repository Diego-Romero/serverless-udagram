import 'source-map-support/register';

import { formatJSONResponse } from '@libs/apiGateway';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE;

const hello:  APIGatewayProxyHandler = async (event: APIGatewayProxyEvent ): Promise<APIGatewayProxyResult> => {

  const docs = await docClient.scan({
    TableName: groupsTable

  }).promise();
  const items = docs.Items;

  return formatJSONResponse({
    message: `ooohh elloooo`,
    items,
  });
}

export const main = hello;
