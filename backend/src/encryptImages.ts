import { SealClient } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACKAGE_ID, SEAL_SERVER_IDs } from './config.js';
import { POSTS } from './postData.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple encryption ID generator (timestamp + index)
function generateEncryptionId(postIndex: number): string {
  const timestamp = Date.now();
  const combined = `${timestamp}_${postIndex}`;
  return Buffer.from(combined).toString('hex');
}

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

async function main() {
  console.log('🔐 Starting image encryption process...\n');

  if (!PACKAGE_ID || PACKAGE_ID === '0x0') {
    console.error('❌ Error: PACKAGE_ID must be set in .env');
    console.error('   Please deploy the Move contracts first and update PACKAGE_ID');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Package ID: ${PACKAGE_ID}`);
  console.log(`   Seal Key Servers: ${SEAL_SERVER_IDs.length} servers`);
  console.log(`   Network: testnet\n`);

  // Filter posts by encryption status
  const encryptedPosts = POSTS.map((post, index) => ({ post, index }))
    .filter(({ post }) => post.encrypted);
  const unencryptedPosts = POSTS.map((post, index) => ({ post, index }))
    .filter(({ post }) => !post.encrypted);

  console.log(`📊 Post Statistics:`);
  console.log(`   Total posts: ${POSTS.length}`);
  console.log(`   Encrypted: ${encryptedPosts.length}`);
  console.log(`   Unencrypted: ${unencryptedPosts.length}\n`);

  if (encryptedPosts.length === 0) {
    console.log('ℹ️  No encrypted posts found. Nothing to encrypt.');
    console.log('   Update postData.ts to add posts with encrypted: true\n');
    process.exit(0);
  }

  // Initialize Seal client
  const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
  const sealClient = new SealClient({
    suiClient: suiClient,
    serverConfigs: SEAL_SERVER_IDs.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });

  // Setup directories
  const imagesDir = path.join(__dirname, '..', 'images');
  const encryptedDir = path.join(__dirname, '..', 'encrypted');

  // Create encrypted directory if it doesn't exist
  await fs.mkdir(encryptedDir, { recursive: true });

  const encryptedImagesData: EncryptedImageData[] = [];

  // Encrypt images for encrypted posts
  console.log('🔒 Encrypting images for encrypted posts:\n');
  for (const { post, index } of encryptedPosts) {
    console.log(`📸 Post ${index}: ${post.imageFile}`);
    console.log(`   Author: ${post.author}`);
    console.log(`   Caption: "${post.caption.slice(0, 50)}${post.caption.length > 50 ? '...' : ''}"`);

    try {
      // Read image bytes
      const imagePath = path.join(imagesDir, post.imageFile);
      const imageBuffer = await fs.readFile(imagePath);
      const imageBytes = new Uint8Array(imageBuffer);

      console.log(`   Image size: ${(imageBytes.length / 1024).toFixed(2)} KB`);

      // Generate encryption ID
      const encryptionId = generateEncryptionId(index);
      console.log(`   Encryption ID: ${encryptionId}`);

      // Encrypt with Seal
      console.log(`   Encrypting with Seal...`);
      const { encryptedObject } = await sealClient.encrypt({
        threshold: 1,
        packageId: PACKAGE_ID,
        id: encryptionId,
        data: imageBytes,
      });

      // Write encrypted bytes to file
      const encryptedFilename = `encrypted_${index}.enc`;
      const encryptedPath = path.join(encryptedDir, encryptedFilename);
      await fs.writeFile(encryptedPath, encryptedObject);

      encryptedImagesData.push({
        postIndex: index,
        imageFile: post.imageFile,
        encryptedFile: encryptedFilename,
        encryptionId,
        walrusBlobId: 'PASTE_BLOB_ID_HERE',
      });

      console.log(`   ✅ Saved to encrypted/${encryptedFilename}\n`);
    } catch (error) {
      console.error(`   ❌ Failed to encrypt ${post.imageFile}:`, error);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      }
      process.exit(1);
    }
  }

  // Create unencrypted images mapping
  const unencryptedImagesData: UnencryptedImageData[] = unencryptedPosts.map(({ post, index }) => ({
    postIndex: index,
    imageFile: post.imageFile,
    walrusBlobId: 'PASTE_BLOB_ID_HERE',
  }));

  // Save encrypted images data
  const encryptedMappingPath = path.join(encryptedDir, 'encrypted-images.json');
  await fs.writeFile(encryptedMappingPath, JSON.stringify(encryptedImagesData, null, 2));

  // Save unencrypted images data
  const unencryptedMappingPath = path.join(encryptedDir, 'unencrypted-images.json');
  await fs.writeFile(unencryptedMappingPath, JSON.stringify(unencryptedImagesData, null, 2));

  console.log('✅ Image encryption complete!\n');
  console.log(`📋 Encrypted images data: encrypted/encrypted-images.json`);
  console.log(`📋 Unencrypted images data: encrypted/unencrypted-images.json\n`);

  console.log('🚀 Next steps:');
  console.log('   1. Upload ALL images to Walrus:\n');

  if (encryptedPosts.length > 0) {
    console.log('      Encrypted images:');
    encryptedImagesData.forEach((item) => {
      console.log(`      walrus store backend/encrypted/${item.encryptedFile}`);
    });
    console.log('');
  }

  if (unencryptedPosts.length > 0) {
    console.log('      Unencrypted images:');
    unencryptedImagesData.forEach((item) => {
      console.log(`      walrus store backend/images/${item.imageFile}`);
    });
    console.log('');
  }

  console.log('   2. Fill in blob IDs:');
  console.log('      - Edit encrypted/encrypted-images.json');
  console.log('      - Edit encrypted/unencrypted-images.json');
  console.log('      - Replace all "PASTE_BLOB_ID_HERE" with actual Walrus blob IDs\n');
  console.log('   3. Run: pnpm create-posts\n');
}

main().catch((error) => {
  console.error('❌ Encryption script failed:', error);
  process.exit(1);
});
