/**
 * Post definition for the OnlyFins app.
 * This is the single source of truth for all posts (encrypted and unencrypted).
 */
export interface PostDefinition {
  author: number;      // Author index (0-2) corresponding to AUTHOR_X_PRIVATE_KEY
  caption: string;     // Public caption text (always unencrypted)
  imageFile: string;   // Filename in backend/images/ directory
  encrypted: boolean;  // If true, image will be encrypted with Seal
}

const WalrusId = 0;
const sealId = 1;
const devrelId = 2;

/**
 * All posts to be created.
 * Mix and match authors, encrypted/unencrypted as desired.
 */
export const POSTS: PostDefinition[] = [
  // Author 0 posts (unencrypted)
  {
    author: devrelId,
    caption: `Welcome to OnlyFins — where every post is powered by Sui, stored on Walrus, and protected with Seal.
Dive in, explore the feed, and try unlocking some premium content 👀`,
    imageFile: "sui-icon-2.jpeg",
    encrypted: false,
  },
  {
    author: WalrusId,
    caption: `Before you go splurging on premium…
Check out my totally free teaser.
If this is the preview, imagine what's behind the curtain 🐋✨`,
    imageFile: "walrus-curtain.jpeg",
    encrypted: false,
  },
  {
    author: sealId,
    caption: `🔒 On-chain doesn't mean out-in-the-open.
Permissionless ≠ unprotected.`,
    imageFile: "seal-walrus.jpeg",
    encrypted: true,
  },
  {
    author: devrelId,
    caption: `We had such an incredible time with builders in Buenos Aires 🇦🇷🔥
Thanks to everyone who hacked, learned, and shipped with us!`,
    imageFile: "2.jpeg",
    encrypted: false,
  },
  {
    author: WalrusId,
    caption: `🔒 Feeling cute, might delete later.
Unlock to see the full, majestic walrus mode in high-res 🐋📸`,
    imageFile: "walrus-real.jpeg",
    encrypted: true,
  },
];
