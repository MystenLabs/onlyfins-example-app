import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACKAGE_ID, SUI_RPC_URL, CLOCK_OBJECT_ID, getKeypair } from './config.js';
import { POSTS } from './postData.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EncryptedImageData {
  postIndex: number;
  imageFile: string;
  encryptedFile: string;
  encryptionId: string;
  walrusBlobId: string;
}

interface UnencryptedImageData {
  postIndex: number;
  imageFile: string;
  walrusBlobId: string;
}

interface PostWithBlobId {
  postIndex: number;
  author: number;
  caption: string;
  blobId: string;
  encryptionId: string | null;
}

async function main() {
  console.log('🚀 Creating posts on Sui testnet...\n');

  if (!PACKAGE_ID || PACKAGE_ID === '0x0') {
    console.error('❌ Error: PACKAGE_ID must be set in .env');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Package ID: ${PACKAGE_ID}`);
  console.log(`   Total posts: ${POSTS.length}\n`);

  // Read blob ID mappings
  const encryptedDir = path.join(__dirname, '..', 'encrypted');

  let encryptedImagesData: EncryptedImageData[] = [];
  let unencryptedImagesData: UnencryptedImageData[] = [];

  try {
    const encryptedContent = await fs.readFile(
      path.join(encryptedDir, 'encrypted-images.json'),
      'utf-8'
    );
    encryptedImagesData = JSON.parse(encryptedContent);
  } catch (error) {
    console.log('ℹ️  No encrypted-images.json found (no encrypted posts)');
  }

  try {
    const unencryptedContent = await fs.readFile(
      path.join(encryptedDir, 'unencrypted-images.json'),
      'utf-8'
    );
    unencryptedImagesData = JSON.parse(unencryptedContent);
  } catch (error) {
    console.log('ℹ️  No unencrypted-images.json found (no unencrypted posts)');
  }

  // Validate blob IDs are filled in
  const missingEncryptedBlobs = encryptedImagesData.filter(
    (item) => item.walrusBlobId === 'PASTE_BLOB_ID_HERE'
  );
  const missingUnencryptedBlobs = unencryptedImagesData.filter(
    (item) => item.walrusBlobId === 'PASTE_BLOB_ID_HERE'
  );

  if (missingEncryptedBlobs.length > 0 || missingUnencryptedBlobs.length > 0) {
    console.error('❌ Error: Please fill in all Walrus blob IDs\n');
    if (missingEncryptedBlobs.length > 0) {
      console.error('   Missing blob IDs in encrypted-images.json:');
      missingEncryptedBlobs.forEach((item) => {
        console.error(`      Post ${item.postIndex}: ${item.imageFile}`);
      });
    }
    if (missingUnencryptedBlobs.length > 0) {
      console.error('   Missing blob IDs in unencrypted-images.json:');
      missingUnencryptedBlobs.forEach((item) => {
        console.error(`      Post ${item.postIndex}: ${item.imageFile}`);
      });
    }
    console.error('\n   Please replace all "PASTE_BLOB_ID_HERE" with actual blob IDs\n');
    process.exit(1);
  }

  // Build complete post data with blob IDs
  const postsWithBlobs: PostWithBlobId[] = POSTS.map((post, index) => {
    if (post.encrypted) {
      const encData = encryptedImagesData.find((e) => e.postIndex === index);
      if (!encData) {
        throw new Error(`Missing encrypted data for post ${index}`);
      }
      return {
        postIndex: index,
        author: post.author,
        caption: post.caption,
        blobId: encData.walrusBlobId,
        encryptionId: encData.encryptionId,
      };
    } else {
      const unencData = unencryptedImagesData.find((u) => u.postIndex === index);
      if (!unencData) {
        throw new Error(`Missing unencrypted data for post ${index}`);
      }
      return {
        postIndex: index,
        author: post.author,
        caption: post.caption,
        blobId: unencData.walrusBlobId,
        encryptionId: null,
      };
    }
  });

  // Group posts by author
  const postsByAuthor = new Map<number, PostWithBlobId[]>();
  for (const post of postsWithBlobs) {
    if (!postsByAuthor.has(post.author)) {
      postsByAuthor.set(post.author, []);
    }
    postsByAuthor.get(post.author)!.push(post);
  }

  console.log('📊 Posts grouped by author:');
  postsByAuthor.forEach((posts, authorIndex) => {
    console.log(`   Author ${authorIndex}: ${posts.length} post(s)`);
  });
  console.log('');

  // Create Sui client
  const client = new SuiClient({ url: SUI_RPC_URL });

  // Create transactions for each author
  let totalPostsCreated = 0;

  for (const [authorIndex, authorPosts] of postsByAuthor.entries()) {
    console.log(`\n👤 Author ${authorIndex}:`);

    const keypair = getKeypair(authorIndex);
    const address = keypair.getPublicKey().toSuiAddress();
    console.log(`   Address: ${address}`);

    // Check balance
    const balance = await client.getBalance({ owner: address });
    console.log(`   Balance: ${Number(balance.totalBalance) / 1_000_000_000} SUI`);
    console.log(`   Creating ${authorPosts.length} post(s)...\n`);

    // Build transaction
    const tx = new Transaction();

    for (const post of authorPosts) {
      console.log(`   📝 Post ${post.postIndex}:`);
      console.log(`      Caption: "${post.caption.slice(0, 50)}${post.caption.length > 50 ? '...' : ''}"`);
      console.log(`      Blob ID: ${post.blobId}`);
      console.log(`      Encrypted: ${post.encryptionId ? 'Yes' : 'No'}`);

      if (post.encryptionId) {
        // Encrypted post
        const encryptionIdBytes = fromHex(post.encryptionId);
        tx.moveCall({
          target: `${PACKAGE_ID}::posts::create_post`,
          arguments: [
            tx.pure.string(post.caption),
            tx.pure.string(post.blobId),
            tx.pure.option('vector<u8>', Array.from(encryptionIdBytes)),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });
      } else {
        // Unencrypted post
        tx.moveCall({
          target: `${PACKAGE_ID}::posts::create_post`,
          arguments: [
            tx.pure.string(post.caption),
            tx.pure.string(post.blobId),
            tx.pure.option('vector<u8>', null),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });
      }
    }

    console.log('\n   🔄 Executing transaction...');

    // Sign and execute transaction
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log(`   ✅ Transaction successful!`);
    console.log(`   📋 Digest: ${result.digest}`);

    // Extract created post object IDs
    const createdPosts = result.objectChanges?.filter(
      (change) => change.type === 'created' && change.objectType.includes('::posts::Post')
    );

    if (createdPosts && createdPosts.length > 0) {
      console.log(`   📦 Created ${createdPosts.length} post object(s):`);
      createdPosts.forEach((post) => {
        if (post.type === 'created') {
          console.log(`      ${post.objectId}`);
        }
      });
      totalPostsCreated += createdPosts.length;
    }
  }

  console.log(`\n\n🎉 Done! Created ${totalPostsCreated} posts across ${postsByAuthor.size} authors.`);
  console.log('📖 All posts are now live on Sui testnet.\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Error creating posts:', error);
  if (error instanceof Error) {
    console.error('Error details:', error.message);
  }
  process.exit(1);
});
