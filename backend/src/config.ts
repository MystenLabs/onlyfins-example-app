import dotenv from 'dotenv';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';

dotenv.config();

// Package ID for the posts module (will be set after deployment)
export const PACKAGE_ID = process.env.PACKAGE_ID || '0x0';

// Sui RPC URL for testnet
export const SUI_RPC_URL = 'https://fullnode.testnet.sui.io:443';

// Clock object ID (shared system object)
export const CLOCK_OBJECT_ID = '0x6';

// Author wallet private keys (required - 3 authors)
const AUTHOR_1_KEY = process.env.AUTHOR_1_PRIVATE_KEY;
const AUTHOR_2_KEY = process.env.AUTHOR_2_PRIVATE_KEY;
const AUTHOR_3_KEY = process.env.AUTHOR_3_PRIVATE_KEY;

if (!AUTHOR_1_KEY || !AUTHOR_2_KEY || !AUTHOR_3_KEY) {
  throw new Error('All three author private keys (AUTHOR_1_PRIVATE_KEY, AUTHOR_2_PRIVATE_KEY, AUTHOR_3_PRIVATE_KEY) are required');
}

export const AUTHOR_PRIVATE_KEYS = [AUTHOR_1_KEY, AUTHOR_2_KEY, AUTHOR_3_KEY];

/**
 * Get keypair for a specific author (0-2)
 */
export function getKeypair(authorIndex: number): Ed25519Keypair {
  if (authorIndex < 0 || authorIndex > 2) {
    throw new Error(`Invalid author index: ${authorIndex}. Must be 0, 1, or 2.`);
  }
  return Ed25519Keypair.fromSecretKey(AUTHOR_PRIVATE_KEYS[authorIndex]);
}

// Seal encryption configuration (testnet)
export const SEAL_SERVER_IDs = ["0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"];
