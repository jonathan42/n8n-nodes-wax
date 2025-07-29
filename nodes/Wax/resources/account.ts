import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import axios from 'axios';

// Account resource properties
export const accountProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Get Info',
				value: 'getInfo',
				description: 'Get account information',
				action: 'Get account information',
			},
			{
				name: 'Verify Address',
				value: 'verifyAddress',
				description: 'Verify if an account exists',
				action: 'Verify if an account exists',
			},
		],
		default: 'getInfo',
	},
	{
		displayName: 'Account Name',
		name: 'account',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getInfo', 'verifyAddress'],
			},
		},
		description: 'WAX account name',
	},
];

// Account operations execution
export async function executeAccountOperations(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	i: number,
): Promise<{ returnData?: INodeExecutionData, invalidData?: INodeExecutionData }> {
	const operation = this.getNodeParameter('operation', i) as string;
	const endpoint = this.getNodeParameter('endpoint', i) as string;
	const account = this.getNodeParameter('account', i) as string;

	if (operation === 'getInfo') {
		// Get account info
		const response = await axios.post(`${endpoint}/v1/chain/get_account`, { account_name: account });
		return { returnData: { json: response.data } };
	} else if (operation === 'verifyAddress') {
		// Verify address
		try {
			// Try to get the account info
			const result = await axios.post(`${endpoint}/v1/chain/get_account`, { account_name: account });

			// If no error is thrown, the account exists
			return {
				returnData: {
					json: {
						account,
						created: result.data.created,
						message: 'Account exists on the WAX blockchain'
					}
				}
			};
		} catch (error) {
			// If we get an error, the account likely doesn't exist
			let message = 'Account does not exist on the WAX blockchain';

			// If it's an axios error, we can get more details
			if (axios.isAxiosError(error) && error.response) {
				// Some APIs return specific error codes or messages for non-existent accounts
				if (error.response.status === 404) {
					message = 'Account not found (404)';
				} else if (error.response.data && error.response.data.error) {
					// WAX API often returns error details in the response data
					message = `Account verification failed: ${error.response.data.error.what || error.response.data.error}`;
				}
			}

			return {
				invalidData: {
					json: {
						account,
						message
					}
				}
			};
		}
	}

	return {};
}
