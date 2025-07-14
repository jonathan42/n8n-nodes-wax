import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import {WaxJS} from '@waxio/waxjs/dist';

interface WaxAsset {
	asset_id: string;
	template_id: string;
	collection_name: string;
	schema_name: string;
}

export class GetAssets implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAX Get Assets',
		name: 'waxGetAssets',
		icon: 'file:wax.svg',
		group: ['transform'],
		version: 1,
		description: 'Get NFTs for an account',
		defaults: {
			name: 'Get Assets',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		properties: [
			{
				displayName: 'Account Name',
				name: 'account',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: 'Template ID (Optional)',
				name: 'templateId',
				type: 'number',
				default: null,
			},
			{
				displayName: 'Collection (Optional)',
				name: 'collection',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Schema (Optional)',
				name: 'schema',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: 'atomicassets',
				required: true,
			},
			{
				displayName: 'API Endpoint',
				name: 'endpoint',
				type: 'string',
				default: 'https://wax.greymass.com',
				required: true,
			},
		],
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData = [];

		for (let i = 0; i < items.length; i++) {
			const account = this.getNodeParameter('account', i) as string;
			const templateId = this.getNodeParameter('templateId', i) as number;
			const collection = this.getNodeParameter('collection', i) as string;
			const schema = this.getNodeParameter('schema', i) as string;
			const code = this.getNodeParameter('code', i) as string;
			const endpoint = this.getNodeParameter('endpoint', i) as string;

			const wax = new WaxJS(endpoint);

			const assets = new Array<WaxAsset>();

			let result: { next_key: null|string, more: boolean, rows?: Array<any>} = { next_key: null, more: true };

			do {
				result = await wax.api.rpc.get_table_rows({
					json: true,
					code,
					scope: account,
					table: 'assets',
					lower_bound: result.next_key,
					limit: 1000,
					reverse: false,
					show_payer: false,
				});

				result.rows?.forEach((asset: any) => {
					if (
						(templateId && asset.template_id !== templateId) ||
						(collection && asset.collection_name !== collection) ||
						(schema && asset.schema_name !== schema)
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
			} while (result.more);

			returnData.push({
				json: {
					account,
					assets
				}
			});
		}

		return [returnData];
	}
}
