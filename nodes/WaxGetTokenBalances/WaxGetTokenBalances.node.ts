import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import {WaxJS} from '@waxio/waxjs/dist';

interface Balances {
	[token: string]: number;
}

export class WaxGetTokenBalances implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAX Get Token Balances',
		name: 'waxGetTokenBalances',
		icon: 'file:wax.svg',
		group: ['transform'],
		version: 1,
		description: 'Get token balances for an account',
		defaults: {
			name: 'Get Token Balances',
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
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
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
			const code = this.getNodeParameter('code', i) as string;
			const endpoint = this.getNodeParameter('endpoint', i) as string;

			const wax = new WaxJS(endpoint);

			const balances = {} as Balances;

			let result: { next_key: null|string, more: boolean, rows?: Array<any>} = { next_key: null, more: true };

			do {
				// @ts-ignore
				result = await wax.rpc.get_table_rows({
					json: true,
					code,
					scope: account,
					table: 'accounts',
					lower_bound: result.next_key,
					limit: 1000,
					reverse: false,
					show_payer: false,
				});

				result.rows?.forEach((record: { balance: string }) => {
					if (!record.balance.match(/^\d+(\.\d+)? [A-Z]+$/)) {
						return;
					}

					const [balance, token] = record.balance.split(' ');

					balances[token] = parseFloat(balance);
				});
			} while (result.more);

			returnData.push({
				json: {
					account,
					balances
				}
			});
		}

		return [returnData];
	}
}
