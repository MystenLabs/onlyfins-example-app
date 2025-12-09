import dotenv from 'dotenv';

dotenv.config();

// Package ID for the posts module (will be set after deployment)
export const PACKAGE_ID = process.env.PACKAGE_ID || '0x0';

// Sui RPC URL for testnet
export const SUI_RPC_URL = 'https://fullnode.testnet.sui.io:443';

// Clock object ID (shared system object)
export const CLOCK_OBJECT_ID = '0x6';

// Poster wallet private key (required)
export const POSTER_PRIVATE_KEY = process.env.POSTER_PRIVATE_KEY;
if (!POSTER_PRIVATE_KEY) {
  throw new Error('POSTER_PRIVATE_KEY environment variable is required');
}

// Seal encryption configuration (testnet)
export const SEAL_SERVER_IDs = ["0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"];
