export const DEVNET_COUNTER_PACKAGE_ID = "0xTODO";
export const TESTNET_COUNTER_PACKAGE_ID = "0xTODO";
export const MAINNET_COUNTER_PACKAGE_ID = "0xTODO";

// Posts package ID (deployed on testnet)
export const POSTS_PACKAGE_ID = "0xae7b46a9c4976eb70779b397f7d3febac00f782c14ed04ae79d809e1f1507986";  // Update this after deploying the Move contract

// Hardcoded post addresses for demo
export const POST_ADDRESSES = [
  "0xd0ec52e2f2db8f2ef2a0704a4771663953df1604c0df4138ae63f6073fdba3ef",
  "0x5d0e7a9f0b3c9588d7663e2d40225ae0148d98e4cbcf6e5391ede4cc7a6fc26f",
  "0x733a5341ba9d035cd384c24954329a564d053c739de0f195f7c5a815300a8e23",
  "0x385ba21615b0d0615d8219e5a640b07e8a1b4a00b4545f82da567530d901ac1a",
  "0xf0e0aceb9220c1530948c43b32a229eeb01adeba5619224cf0568bddf401b610",
];

// Walrus aggregator URL for fetching images
export const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id";

// Seal encryption key servers (testnet)
export const SEAL_SERVER_IDS = [
  "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
  "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"
];

// Backend API URL for sponsored transactions
export const BACKEND_URL = "https://messaging-sdk-example-production.up.railway.app";
// export const BACKEND_URL = 'http://localhost:3000';

// Web3 Benefits Content for InfoTooltips
export const WEB3_BENEFITS = {
  POST_OWNERSHIP: {
    title: "True Creator Ownership",
    content: "Each post is completely owned by the creator on the Sui blockchain. This includes the caption, attachment, and all metadata. The post can never be deleted from the blockchain. While the app owner might choose not to render certain posts due to policy, nothing stops another app from displaying this content with different policies."
  },
  PERMANENT_ACCESS: {
    title: "Permanent, Irrevocable Access",
    content: "When you unlock premium content, you receive a unique AccessToken that belongs to your account forever. No one - not the creator, not the app admin - can ever revoke your access. Even if this post migrates to another platform, your AccessToken will continue to work, guaranteeing your access to the content you've paid for."
  },
  TRANSPARENT_FEES: {
    title: "Transparent On-Chain Policies",
    content: "All middleman policies and fees are completely transparent because they're enforced by smart contracts on-chain. This dramatically reduces potential abuse from app owners and ensures creators are fairly compensated. You can verify exactly where your payment goes - no hidden fees, no arbitrary deductions."
  },
  CREATOR_CONTROL: {
    title: "Creator-Controlled Access",
    content: "Creators have explicit control over who can access their premium content and under what conditions. For example, a creator might require users to hold a specific token from an in-person event. The app owner or admin has no special ability to decrypt content or grant access outside of the creator's intended flow - it's cryptographically enforced."
  },
  CROSS_PLATFORM: {
    title: "Cross-Platform Portability",
    content: "Because everything is on-chain, your content and access rights aren't locked to this app. Any application can be built to read and display this content. Your AccessTokens work across all compatible apps, giving you true ownership and freedom from platform lock-in."
  }
} as const;