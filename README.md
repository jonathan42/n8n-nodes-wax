# n8n-nodes-wax

This is an n8n community node. It lets you use the WAX Blockchain in your n8n workflows.

The WAX Blockchain is a purpose-built blockchain and protocol token designed to make e-commerce transactions faster, easier, and safer for all participants. It's specifically designed for the transfer of digital assets, including NFTs (Non-Fungible Tokens).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node package provides the following operations for interacting with the WAX Blockchain:

- **Get Account Info**: Fetch detailed account information from the WAX blockchain
- **Get Assets**: Retrieve NFT assets owned by an account, with optional filtering by template ID, collection, or schema
- **Get Balance**: Get token balance for an account
- **Transfer NFT**: Transfer NFT assets from one account to another
- **Transfer Token**: Transfer tokens (e.g., WAX) from one account to another
- **Verify Address**: Verify if an account exists on the WAX blockchain

## Credentials

For operations that require signing transactions (Transfer Token and Transfer NFT), you'll need to provide:

- **Account Name**: Your WAX account name
- **Private Key**: The private key associated with your WAX account

To obtain a WAX account and private key:
1. Create a WAX account through services like [WAX Cloud Wallet](https://wallet.wax.io/)
2. Export or generate your private key (keep this secure and never share it)

For read-only operations, no credentials are required, but you'll need to specify the account name as a parameter.

## Compatibility

This node requires n8n version 1.0.0 or later.

## Usage

### API Endpoints

All nodes allow you to specify the API endpoint to use. The default is `https://wax.greymass.com`, but you can use any WAX RPC endpoint, such as:
- https://wax.greymass.com
- https://wax.cryptolions.io
- https://wax.dapplica.io

### Working with NFTs

When transferring NFTs, you'll need to provide:
- The recipient account name
- Asset IDs (comma-separated list)
- Contract (defaults to "atomicassets")

You can use the Get Assets node to find the asset IDs of NFTs owned by an account.

### Token Operations

For token operations, you can specify:
- Token contract (defaults to "eosio.token" for WAX)
- Token symbol (defaults to "WAX")
- Precision (number of decimal places, defaults to 8)

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [WAX Developer Portal](https://developer.wax.io/)
* [WAX Blockchain GitHub](https://github.com/worldwide-asset-exchange/wax-blockchain)
* [EOSIO Developer Documentation](https://developers.eos.io/)

## Version history

### 0.1.5
- Initial public release
- Support for basic WAX blockchain operations
- NFT and token transfer capabilities
