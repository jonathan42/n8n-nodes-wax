import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'util';

// NFT resource properties
export const nftProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['nft'],
			},
		},
		options: [
			{
				name: 'Transfer',
				value: 'transfer',
				description: 'Transfer an NFT on the WAX blockchain',
				action: 'Transfer an nft on the wax blockchain',
			},
		],
		default: 'transfer',
	},
	// NFT transfer parameters
	{
		displayName: 'To Account',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer'],
			},
		},
	},
	{
		displayName: 'Asset IDs (Comma-Separated)',
		name: 'assetIds',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer'],
			},
		},
	},
	{
		displayName: 'Contract',
		name: 'contract',
		type: 'string',
		default: 'atomicassets',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer'],
			},
		},
	},
	{
		displayName: 'Memo',
		name: 'memo',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer'],
			},
		},
	},
];

// NFT operations execution
export async function executeNftOperations(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	i: number,
): Promise<{ returnData?: INodeExecutionData, invalidData?: INodeExecutionData }> {
	const operation = this.getNodeParameter('operation', i) as string;
	const endpoint = this.getNodeParameter('endpoint', i) as string;

	if (operation === 'transfer') {
		const credentials = await this.getCredentials('waxPrivateKeyApi');
		const from = credentials.account as string;
		const key = credentials.privateKey as string;

		const to = this.getNodeParameter('to', i) as string;
		const memo = this.getNodeParameter('memo', i) as string;
		const assetIdsString = this.getNodeParameter('assetIds', i) as string;
		const contract = this.getNodeParameter('contract', i) as string;

		const assetIds = assetIdsString.split(',').map(id => id.trim());

		const signatureProvider = new JsSignatureProvider([key]);
		const rpc = new JsonRpc(endpoint, { fetch });

		const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

		const actions = [{
			account: contract,
			name: 'transfer',
			authorization: [{ actor: from, permission: 'active' }],
			data: {
				from,
				to,
				asset_ids: assetIds,
				memo,
			}
		}];

		const result = await api.transact({
			actions
		}, {
			blocksBehind: 3,
			expireSeconds: 30,
		});

		return {
			returnData: {
				json: { result }
			}
		};
	}

	return {};
}
