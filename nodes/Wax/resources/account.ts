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
				description: 'Verify an account exists',
				action: 'Verify an account exists',
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
): Promise<{ returnData?: INodeExecutionData; invalidData?: INodeExecutionData }> {
	const operation = this.getNodeParameter('operation', i) as string;
	const endpoint = this.getNodeParameter('endpoint', i) as string;
	const account = this.getNodeParameter('account', i) as string;

	if (operation === 'getInfo') {
		// Get account info
		const response = await axios.post(`${endpoint}/v1/chain/get_account`, {
			account_name: account,
		});
		return { returnData: { json: response.data } };
	} else if (operation === 'verifyAddress') {
		try {
			// Verify address
			const result = await axios.post(`${endpoint}/v1/chain/get_account`, {
				account_name: account,
			});

			return {
				returnData: {
					json: {
						account,
						exists: true,
						created: result.data.created,
					},
				},
			};
		} catch (error) {
			if (axios.isAxiosError(error) && [400, 404].includes(error.response?.status ?? 0)) {
				return {
					returnData: {
						json: {
							account,
							exists: false,
							error: 'Account does not exist on the WAX blockchain',
						},
					},
				}; // Account does not exist
			}

			throw new Error(`Failed to verify account: ${error.message}`);
		}
	}

	return {};
}
