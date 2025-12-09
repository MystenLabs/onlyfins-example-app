import { SealClient } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACKAGE_ID, SEAL_SERVER_IDs } from './config.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple encryption ID generator (timestamp + index)
function generateEncryptionId(index: number): string {
  const timestamp = Date.now();
  const combined = `${timestamp}_${index}`;
  return Buffer.from(combined).toString('hex');
}

interface EncryptionData {
  encryptedFile: string;
  encryptionId: string;
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
  console.log(`   Seal Key Server: ${SEAL_SERVER_IDs}`);
  console.log(`   Network: testnet\n`);

  // Initialize Seal client
  const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
  // Initialize Seal client
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

  // Read images from images/ directory
  let imageFiles: string[];
  try {
    const allFiles = await fs.readdir(imagesDir);
    imageFiles = allFiles
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .slice(0, 4);
  } catch (error) {
    console.error('❌ Error: Cannot read images directory');
    console.error('   Please create backend/images/ and add at least 4 images');
    process.exit(1);
  }

  if (imageFiles.length < 4) {
    console.error(`❌ Error: Need at least 4 images in backend/images/`);
    console.error(`   Found only ${imageFiles.length} image(s)`);
    console.error('   Supported formats: jpg, jpeg, png, gif, webp');
    process.exit(1);
  }

  console.log(`✅ Found ${imageFiles.length} images to encrypt\n`);

  const encryptionData: EncryptionData[] = [];

  // Encrypt each image
  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    console.log(`📸 Processing ${filename}...`);

    try {
      // Read image bytes
      const imagePath = path.join(imagesDir, filename);
      const imageBuffer = await fs.readFile(imagePath);
      const imageBytes = new Uint8Array(imageBuffer);

      console.log(`   Image size: ${(imageBytes.length / 1024).toFixed(2)} KB`);

      // Generate encryption ID
      const encryptionId = generateEncryptionId(i);
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
      const encryptedFilename = `image_${i + 1}.enc`;
      const encryptedPath = path.join(encryptedDir, encryptedFilename);
      await fs.writeFile(encryptedPath, encryptedObject);

      encryptionData.push({
        encryptedFile: encryptedFilename,
        encryptionId,
        walrusBlobId: 'PASTE_BLOB_ID_HERE',
      });

      console.log(`   ✅ Saved to encrypted/${encryptedFilename}\n`);
    } catch (error) {
      console.error(`   ❌ Failed to encrypt ${filename}:`, error);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      }
      process.exit(1);
    }
  }

  // Save encryption data with placeholder for blob IDs
  const mappingPath = path.join(encryptedDir, 'encryption-ids.json');
  await fs.writeFile(mappingPath, JSON.stringify(encryptionData, null, 2));

  console.log('\n✅ All images encrypted successfully!\n');
  console.log('📋 Encryption data saved to encrypted/encryption-ids.json\n');
  console.log('📄 Encryption IDs:');
  encryptionData.forEach((item) => {
    console.log(`   ${item.encryptedFile}: ${item.encryptionId}`);
  });

  console.log('\n🚀 Next steps:');
  console.log('   1. Upload each encrypted file to Walrus:\n');
  for (let i = 1; i <= imageFiles.length; i++) {
    console.log(`      walrus store backend/encrypted/image_${i}.enc`);
  }
  console.log('\n   2. Edit encrypted/encryption-ids.json and replace "PASTE_BLOB_ID_HERE"');
  console.log('      with the actual Walrus blob IDs from the upload commands\n');
  console.log('   3. Run: pnpm create-encrypted-posts\n');
}

main().catch((error) => {
  console.error('❌ Encryption script failed:', error);
  process.exit(1);
});
