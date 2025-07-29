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
		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const invalidData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await executeOperation.call(this, items, i);

				// Add the result to the appropriate array
				if (result?.returnData) {
					returnData.push(result.returnData);
				}

				if (result?.invalidData) {
					invalidData.push(result.invalidData);
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
