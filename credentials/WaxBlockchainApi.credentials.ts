import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WaxBlockchainApi implements ICredentialType {
	name = 'waxPrivateKeyApi';
	displayName = 'WAX Private Key API';
	documentationUrl = 'https://github.com/mongus/n8n-nodes-wax';
	properties: INodeProperties[] = [
		{
			displayName: 'Account Name',
			name: 'account',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			}
		},
	];
}
