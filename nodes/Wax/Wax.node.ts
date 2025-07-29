import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { properties, executeOperation } from './resources';

export class Wax implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAX',
		name: 'wax',
		icon: 'file:wax.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Interact with the WAX blockchain',
		defaults: {
			name: 'WAX',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		outputNames: ['data'],
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
		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await executeOperation.call(this, items, i);

				// Add the result to the returnData array
				if (result?.returnData) {
					returnData.push(result.returnData);
				}

				// We no longer use invalidData as everything goes through returnData
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
