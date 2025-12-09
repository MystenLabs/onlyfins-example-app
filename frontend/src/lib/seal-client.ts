import { SealClient } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SEAL_SERVER_IDS } from '../constants';

// Initialize Sui client for testnet
export const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

/**
 * Creates a configured Seal client for decryption.
 * Uses testnet key servers - no API key required.
 */
export function createSealClient(): SealClient {
  return new SealClient({
    suiClient,
    serverConfigs: SEAL_SERVER_IDS.map((objectId) => ({
      objectId,
      weight: 1,
    })),
    verifyKeyServers: false,
  });
}
