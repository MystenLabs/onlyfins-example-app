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
