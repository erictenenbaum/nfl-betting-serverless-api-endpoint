import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDB, AWSError } from 'aws-sdk'
import { DocumentClient, GetItemOutput } from 'aws-sdk/clients/dynamodb';
import { PromiseResult } from 'aws-sdk/lib/request';
import 'source-map-support/register';

const dynamoDB: DocumentClient = new DynamoDB.DocumentClient({
    region: process.env.APP_AWS_REGION,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

// function runs a while loop to scan all items in table until the LastEvaluatedkey is undefined
// starts each new iteration with ExclusiveStartKey as to not have to rescan previously scanned items
export const getAllTeams = async (_event, _context) => {
    try {
        const params = { TableName: 'Teams' };
        let results: GetItemOutput[] = [];
        let items: GetItemOutput;
        do {
            items = await dynamoDB.scan(params).promise();
            items['Items'].forEach(doc => results.push(doc));
            params['ExclusiveStartKey'] = items['LastEvaluatedKey']
        } while (typeof items['LastEvaluatedKey'] !== 'undefined');

        return {
            statusCode: 200,
            body: JSON.stringify(results)
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: { 'error': 'unable to complete operation' }
        }
    }
}

// gets team matching the {id} in url path
export const getTeam = async (event: APIGatewayEvent, _context) => {
    try {
        const team: PromiseResult<GetItemOutput, AWSError> = await dynamoDB.get({ TableName: 'Teams', Key: { '_id': event.pathParameters.id } }).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(team['Item'])
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: { 'error': 'unable to complete operation' }
        }
    }
}