import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';
import { PACKAGE_ID, SUI_RPC_URL, CLOCK_OBJECT_ID, POSTER_PRIVATE_KEY } from './config.js';

// Mock captions for test posts
const MOCK_CAPTIONS = [
  "Just deployed my first smart contract on Sui! The developer experience is amazing. 🚀",
  "GM everyone! What are you building today?",
  "The speed of Sui transactions is mind-blowing. Sub-second finality FTW!",
  "Excited to share my new dApp built on Sui. Check it out!",
  "Learning Move has been such a rewarding experience. The type safety is incredible.",
];

// Mock blob ID for testing (same for all posts)
const MOCK_BLOB_ID = "ZpybC85My9t2vJz8-J61wR5OUZI1v36ma-zQPzo8cwUBAQD3AQ";

async function createPosts() {
  console.log('🚀 Creating posts on Sui testnet...\n');

  // Create Sui client
  const client = new SuiClient({ url: SUI_RPC_URL });

  // Load keypair from private key
  const keypair = Ed25519Keypair.fromSecretKey(POSTER_PRIVATE_KEY!);
  const address = keypair.getPublicKey().toSuiAddress();
  console.log(`📍 Poster address: ${address}`);

  // Check balance
  const balance = await client.getBalance({ owner: address });
  console.log(`💰 Balance: ${Number(balance.totalBalance) / 1_000_000_000} SUI\n`);

  // Build transaction with multiple post creations
  const tx = new Transaction();

  console.log(`📝 Creating ${MOCK_CAPTIONS.length} posts...`);

  MOCK_CAPTIONS.forEach((caption, index) => {
    tx.moveCall({
      target: `${PACKAGE_ID}::posts::create_post`,
      arguments: [
        tx.pure.string(caption),
        tx.pure.string(MOCK_BLOB_ID),
        tx.object.clock(),
      ],
    });
    console.log(`   ${index + 1}. "${caption.slice(0, 50)}..."`);
  });

  console.log('\n🔄 Executing transaction...');

  // Sign and execute transaction
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log('\n✅ Transaction executed successfully!');
  console.log(`📋 Digest: ${result.digest}`);

  // Extract created post object IDs
  const createdPosts = result.objectChanges?.filter(
    (change) => change.type === 'created' && change.objectType.includes('::posts::Post')
  );

  if (createdPosts && createdPosts.length > 0) {
    console.log(`\n📦 Created ${createdPosts.length} post object(s):`);
    createdPosts.forEach((post, index) => {
      if (post.type === 'created') {
        console.log(`   ${index + 1}. ${post.objectId}`);
      }
    });
  }

  console.log('\n🎉 Done! Posts are now live on Sui testnet.');
}

// Run the script
createPosts().catch((error) => {
  console.error('❌ Error creating posts:', error);
  process.exit(1);
});
