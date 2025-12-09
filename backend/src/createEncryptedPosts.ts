import { SealClient } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';
import { bcs } from '@mysten/sui/bcs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACKAGE_ID, SUI_RPC_URL, CLOCK_OBJECT_ID, POSTER_PRIVATE_KEY, SEAL_SERVER_IDs } from './config.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock captions for encrypted posts
const MOCK_CAPTIONS = [
  "Check out this exclusive content! 🔥",
  "Behind the scenes of my latest project",
  "Premium content for my supporters 💎",
  "You unlocked this secret post! 🎉",
];

// No fee - content is free for demo purposes

interface EncryptionData {
  encryptedFile: string;
  encryptionId: string;
  walrusBlobId: string;
}

async function main() {
  console.log('🚀 Creating encrypted posts on Sui testnet...\n');

  if (!PACKAGE_ID || PACKAGE_ID === '0x0') {
    console.error('❌ Error: PACKAGE_ID must be set in .env');
    process.exit(1);
  }

  // Read encryption data
  const mappingPath = path.join(__dirname, '..', 'encrypted', 'encryption-ids.json');
  let encryptionData: EncryptionData[];

  try {
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    encryptionData = JSON.parse(mappingContent);
  } catch (error) {
    console.error('❌ Error: Cannot read encrypted/encryption-ids.json');
    console.error('   Please run "pnpm encrypt-images" first');
    process.exit(1);
  }

  // Validate blob IDs have been filled in
  const missingBlobIds = encryptionData.filter(
    item => item.walrusBlobId === 'PASTE_BLOB_ID_HERE'
  );

  if (missingBlobIds.length > 0) {
    console.error('❌ Error: Please fill in Walrus blob IDs in encrypted/encryption-ids.json');
    console.error('   Missing blob IDs for:', missingBlobIds.map(x => x.encryptedFile).join(', '));
    console.error('\n   1. Upload encrypted files to Walrus:');
    missingBlobIds.forEach(item => {
      console.error(`      walrus store backend/encrypted/${item.encryptedFile}`);
    });
    console.error('\n   2. Edit encrypted/encryption-ids.json and replace "PASTE_BLOB_ID_HERE"\n');
    process.exit(1);
  }

  if (encryptionData.length < 4) {
    console.error(`❌ Error: Need 4 encrypted images, found only ${encryptionData.length}`);
    console.error('   Please run "pnpm encrypt-images" first');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Package ID: ${PACKAGE_ID}`);
  console.log(`   Seal Key Server: ${SEAL_SERVER_IDs}`);
  console.log(`   Content Access: Free (demo mode)\n`);

  // Initialize Sui client and keypair
  const client = new SuiClient({ url: SUI_RPC_URL });
  const keypair = Ed25519Keypair.fromSecretKey(POSTER_PRIVATE_KEY!);
  const address = keypair.getPublicKey().toSuiAddress();

  console.log(`📍 Poster address: ${address}`);

  // Check balance
  const balance = await client.getBalance({ owner: address });
  console.log(`💰 Balance: ${Number(balance.totalBalance) / 1_000_000_000} SUI\n`);

  // Initialize Seal client
  const sealClient = new SealClient({
    suiClient: client,
    serverConfigs: SEAL_SERVER_IDs.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });

  console.log('🔐 Encrypting captions with Seal...\n');

  // Build transaction
  const tx = new Transaction();

  // Create posts with encrypted captions
  for (let i = 0; i < 4; i++) {
    const caption = MOCK_CAPTIONS[i];
    const { encryptionId, walrusBlobId } = encryptionData[i];

    console.log(`📝 Post ${i + 1}:`);
    console.log(`   Caption: "${caption}"`);
    console.log(`   Walrus Blob ID: ${walrusBlobId}`);
    console.log(`   Encryption ID: ${encryptionId}`);

    // Encrypt caption with SAME encryption ID as image
    const captionBytes = new TextEncoder().encode(caption);

    let encryptedCaption: Uint8Array;
    try {
      const { encryptedObject } = await sealClient.encrypt({
        threshold: 1,
        packageId: PACKAGE_ID,
        id: encryptionId,
        data: captionBytes,
      });
      encryptedCaption = encryptedObject;
      console.log(`   ✅ Caption encrypted (${encryptedCaption.length} bytes)\n`);
    } catch (error) {
      console.error(`   ❌ Failed to encrypt caption:`, error);
      process.exit(1);
    }

    // Convert encryption ID hex string to bytes
    const encryptionIdBytes = fromHex(encryptionId);

    // Add create_post call to transaction
    tx.moveCall({
      target: `${PACKAGE_ID}::posts::create_post`,
      arguments: [
        tx.pure(bcs.vector(bcs.U8).serialize(Array.from(encryptedCaption))),  // caption: vector<u8>
        tx.pure.string(walrusBlobId),                                          // image_blob_id: String
        tx.pure.option('vector<u8>', Array.from(encryptionIdBytes)),           // encryption_id: Option<vector<u8>>
        tx.object(CLOCK_OBJECT_ID),                                            // clock: &Clock
      ],
    });
  }

  console.log('🔄 Executing transaction...\n');

  // Sign and execute transaction
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log('✅ Transaction executed successfully!');
  console.log(`📋 Digest: ${result.digest}\n`);

  // Extract created post object IDs
  const createdPosts = result.objectChanges?.filter(
    (change) => change.type === 'created' && change.objectType.includes('::posts::Post')
  );

  if (createdPosts && createdPosts.length > 0) {
    console.log(`📦 Created ${createdPosts.length} encrypted post object(s):`);
    createdPosts.forEach((post, index) => {
      if (post.type === 'created') {
        console.log(`   ${index + 1}. ${post.objectId}`);
      }
    });
  }

  console.log('\n🎉 Done! Encrypted posts are now live on Sui testnet.');
  console.log('🆓 Content is free to access (demo mode).\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Error creating encrypted posts:', error);
  if (error instanceof Error) {
    console.error('Error details:', error.message);
  }
  process.exit(1);
});
