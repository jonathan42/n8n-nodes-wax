import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { commonProperties } from './common';
import { accountProperties, executeAccountOperations } from './account';
import { tokenProperties, executeTokenOperations } from './token';
import { assetProperties, executeAssetOperations } from './asset';

export const properties: INodeProperties[] = [
	...commonProperties,
	...accountProperties,
	...tokenProperties,
	...assetProperties,
];

export async function executeOperation(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	i: number,
): Promise<{ returnData?: INodeExecutionData, invalidData?: INodeExecutionData }> {
	const resource = this.getNodeParameter('resource', i) as string;

	if (resource === 'account') {
		return await executeAccountOperations.call(this, items, i);
	} else if (resource === 'token') {
		return await executeTokenOperations.call(this, items, i);
	} else if (resource === 'asset') {
		return await executeAssetOperations.call(this, items, i);
	}

	return Promise.reject(new Error(`The resource "${resource}" is not supported.`));
}
