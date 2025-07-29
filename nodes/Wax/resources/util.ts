import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

export async function getCredentials(context: IExecuteFunctions, errorMessage?: string) {
	try {
		return await context.getCredentials('waxPrivateKeyApi');
	}
	catch (error) {
		throw new NodeOperationError(context.getNode(), errorMessage || `Credentials required for this operation.`);
	}
}
