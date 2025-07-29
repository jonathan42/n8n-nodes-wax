import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { WaxJS } from '@waxio/waxjs/dist';
import axios from 'axios';
import { TextEncoder, TextDecoder } from 'util';
import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';

interface WaxAsset {
	asset_id: string;
	template_id: string;
	collection_name: string;
	schema_name: string;
}

export class Wax implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAX',
		name: 'wax',
		icon: 'file:wax.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with the WAX blockchain',
		defaults: {
			name: 'WAX',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main', 'main'] as NodeConnectionType[],
		outputNames: ['data', 'invalid'],
		credentials: [
			{
				name: 'waxPrivateKeyApi',
				required: true,
				displayOptions: {
					show: {
						resource: ['token', 'nft'],
						operation: ['transfer'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Asset',
						value: 'asset',
					},
					{
						name: 'Token',
						value: 'token',
					},
					{
						name: 'NFT',
						value: 'nft',
					},
				],
				default: 'account',
			},
			// Account operations
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
			// Asset operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['asset'],
					},
				},
				options: [
					{
						name: 'Get Assets',
						value: 'getAssets',
						description: 'Get NFTs for an account',
						action: 'Get nfts for an account',
					},
				],
				default: 'getAssets',
			},
			// Token operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['token'],
					},
				},
				options: [
					{
						name: 'Get Balance',
						value: 'getBalance',
						description: 'Get token balance for an account',
						action: 'Get token balance for an account',
					},
					{
						name: 'Transfer',
						value: 'transfer',
						description: 'Transfer tokens on the WAX blockchain',
						action: 'Transfer tokens on the wax blockchain',
					},
				],
				default: 'getBalance',
			},
			// NFT operations
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

			// Account parameters
			{
				displayName: 'Account Name',
				name: 'account',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['account', 'asset', 'token'],
						operation: ['getInfo', 'verifyAddress', 'getAssets', 'getBalance'],
					},
				},
				description: 'WAX account name',
			},

			// Asset parameters
			{
				displayName: 'Template ID (Optional)',
				name: 'templateId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['asset'],
						operation: ['getAssets'],
					},
				},
				description: 'Comma-separated list of template IDs',
			},
			{
				displayName: 'Collection (Optional)',
				name: 'collection',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['asset'],
						operation: ['getAssets'],
					},
				},
				description: 'Comma-separated list of collections',
			},
			{
				displayName: 'Schema (Optional)',
				name: 'schema',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['asset'],
						operation: ['getAssets'],
					},
				},
				description: 'Comma-separated list of schemas',
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: 'atomicassets',
				required: true,
				displayOptions: {
					show: {
						resource: ['asset'],
						operation: ['getAssets'],
					},
				},
			},

			// Token parameters
			{
				displayName: 'Token Contract',
				name: 'contract',
				type: 'string',
				default: 'eosio.token',
				required: true,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['getBalance', 'transfer'],
					},
				},
				description: 'Token contract (e.g., "eosio.token" for WAX)',
			},
			{
				displayName: 'Symbol',
				name: 'symbol',
				type: 'string',
				default: 'WAX',
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['getBalance', 'transfer'],
					},
				},
				description: 'Token symbol (e.g., "WAX")',
			},

			// Transfer token parameters
			{
				displayName: 'To Account',
				name: 'to',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['token', 'nft'],
						operation: ['transfer'],
					},
				},
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 1,
				required: true,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['transfer'],
					},
				},
				description: 'Amount of tokens to transfer (e.g., 1)',
			},
			{
				displayName: 'Precision',
				name: 'precision',
				type: 'number',
				default: 8,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['transfer'],
					},
				},
				description: 'Number of decimal places for the token (default is 8)',
			},
			{
				displayName: 'Memo',
				name: 'memo',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['token', 'nft'],
						operation: ['transfer'],
					},
				},
			},

			// NFT transfer parameters
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

			// Common parameters
			{
				displayName: 'API Endpoint',
				name: 'endpoint',
				type: 'string',
				default: 'https://wax.greymass.com',
				required: true,
				description: 'WAX blockchain API endpoint',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const invalidData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const endpoint = this.getNodeParameter('endpoint', i) as string;

				// Account operations
				if (resource === 'account') {
					const account = this.getNodeParameter('account', i) as string;

					if (operation === 'getInfo') {
						// Get account info
						const response = await axios.post(`${endpoint}/v1/chain/get_account`, { account_name: account });
						returnData.push({ json: response.data });
					} else if (operation === 'verifyAddress') {
						// Verify address
						try {
							// Try to get the account info
							const result = await axios.post(`${endpoint}/v1/chain/get_account`, { account_name: account });

							// If no error is thrown, the account exists
							returnData.push({
								json: {
									account,
									created: result.data.created,
									message: 'Account exists on the WAX blockchain'
								}
							});
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

							invalidData.push({
								json: {
									account,
									message
								}
							});
						}
					}
				}

				// Asset operations
				else if (resource === 'asset') {
					if (operation === 'getAssets') {
						const account = this.getNodeParameter('account', i) as string;
						const templateIdInput = this.getNodeParameter('templateId', i) as string;
						const collectionInput = this.getNodeParameter('collection', i) as string;
						const schemaInput = this.getNodeParameter('schema', i) as string;
						const code = this.getNodeParameter('code', i) as string;

						// Parse comma-separated values
						const templateIds = templateIdInput ? templateIdInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
						const collections = collectionInput ? collectionInput.split(',').map(c => c.trim()).filter(c => c !== '') : [];
						const schemas = schemaInput ? schemaInput.split(',').map(s => s.trim()).filter(s => s !== '') : [];

						const wax = new WaxJS(endpoint);

						const assets = new Array<WaxAsset>();

						let result: { next_key: null|string, more: boolean, rows?: Array<any>} = { next_key: null, more: true };

						do {
							// @ts-ignore
							result = await wax.rpc.get_table_rows({
								json: true,
								code,
								scope: account,
								table: 'assets',
								lower_bound: result.next_key,
								limit: 1000,
								reverse: false,
								show_payer: false,
							});

							// Check if result has the expected structure
							if (!result) {
								throw new NodeOperationError(this.getNode(), 'Empty response from get_table_rows');
							}

							if (!result.hasOwnProperty('rows')) {
								throw new NodeOperationError(this.getNode(), 'Response missing rows property: ' + JSON.stringify(result));
							}

							// Process the rows if they exist
							if (result.rows && Array.isArray(result.rows)) {
								result.rows.forEach((asset: any) => {
									// Skip if asset doesn't match any of the filter criteria
									if (
										(templateIds.length > 0 && !templateIds.includes(asset.template_id)) ||
										(collections.length > 0 && !collections.includes(asset.collection_name)) ||
										(schemas.length > 0 && !schemas.includes(asset.schema_name))
									) {
										return;
									}

									assets.push({
										asset_id: asset.asset_id,
										template_id: asset.template_id,
										collection_name: asset.collection_name,
										schema_name: asset.schema_name,
									});
								});
							} else {
								// If rows is not an array, log the issue but continue
								console.log(`Warning: result.rows is not an array: ${JSON.stringify(result.rows)}`);
							}
						} while (result.more && result.rows);

						returnData.push({
							json: {
								account,
								assets
							}
						});
					}
				}

				// Token operations
				else if (resource === 'token') {
					if (operation === 'getBalance') {
						const account = this.getNodeParameter('account', i) as string;
						const contract = this.getNodeParameter('contract', i) as string;
						const symbol = this.getNodeParameter('symbol', i) as string;

						const payload: Record<string, string> = { account, code: contract };
						if (symbol) payload.symbol = symbol;

						const { data } = await axios.post(`${endpoint}/v1/chain/get_currency_balance`, payload);

						const item = data.find((item: string) => item.endsWith(` ${symbol}`)) ?? `0 ${symbol}`;

						const [_balance, _symbol] = item.split(' ');

						const balance = parseFloat(_balance);

						returnData.push({ json: { account, contract, symbol, balance } });
					} else if (operation === 'transfer') {
						const credentials = await this.getCredentials('waxPrivateKeyApi');
						const from = credentials.account as string;
						const key = credentials.privateKey as string;

						const to = this.getNodeParameter('to', i) as string;
						const amount = this.getNodeParameter('amount', i) as number;
						const symbol = this.getNodeParameter('symbol', i) as string;
						const precision = this.getNodeParameter('precision', i) as number || 8; // Default to 8 if not provided
						const memo = this.getNodeParameter('memo', i) as string;
						const contract = this.getNodeParameter('contract', i) as string;

						// Format the quantity as "amount symbol" (e.g., "1.00000000 WAX")
						// Ensure the amount has 8 decimal places for proper formatting
						const formattedAmount = amount.toFixed(precision);
						const quantity = `${formattedAmount} ${symbol}`;

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
								quantity,
								memo,
							}
						}];

						const result = await api.transact({
							actions
						}, {
							blocksBehind: 3,
							expireSeconds: 30,
						});

						returnData.push({ json: { result } });
					}
				}

				// NFT operations
				else if (resource === 'nft') {
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

						returnData.push({ json: { result } });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		// Return data based on the operation
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Only verifyAddress operation has two outputs
		if (resource === 'account' && operation === 'verifyAddress') {
			return [returnData, invalidData];
		}

		return [returnData];
	}
}
