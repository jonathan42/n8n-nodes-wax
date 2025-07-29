import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'util';
import { getCredentials } from './util';

// NFT resource properties
export const nftProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'hidden',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['nft'],
			},
		},
		options: [
			{
				name: 'Transfer NFTs',
				value: 'transferNfts',
				description: 'Transfer NFTs on the WAX blockchain',
				action: 'Transfer NFTs on the WAX blockchain',
			},
		],
		default: 'transferNfts',
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
				operation: ['transferNfts'],
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
				operation: ['transferNfts'],
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
				operation: ['transferNfts'],
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
				operation: ['transferNfts'],
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

	if (operation === 'transferNfts') {
		const credentials = await getCredentials(this);
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
