import { SuiObjectResponse } from '@mysten/sui/client';
import { Post, LockedPost, UnlockedPost } from '../components/PostCard';
import { ViewerToken } from '../hooks/useViewerTokens';
import { WALRUS_AGGREGATOR_URL } from '../constants';

/**
 * Helper: Check if user has access to a specific post
 */
function hasAccessToPost(postId: string, viewerTokens: ViewerToken[]): boolean {
  return viewerTokens.some((token) => token.postId === postId);
}

/**
 * Helper: Decode UTF-8 bytes to string
 */
function decodeBytesToString(bytes: number[]): string {
  const uint8Array = new Uint8Array(bytes);
  return new TextDecoder().decode(uint8Array);
}

/**
 * Helper: Convert encryption ID bytes to hex string
 */
function bytesToHex(bytes: number[]): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Transform Sui blockchain objects into typed Post objects.
 *
 * Post rendering logic:
 * 1. Not encrypted → UnlockedPost (public content)
 * 2. Encrypted + no ViewerToken → LockedPost (paywall)
 * 3. Encrypted + has ViewerToken → UnlockedPost (needs decryption - placeholder content)
 *
 * @param suiData - Raw Sui object responses from multiGetObjects
 * @param viewerTokens - User's ViewerTokens (proof of purchase)
 * @returns Typed array of Post objects ready for rendering
 */
export function transformSuiObjectsToPosts(
  suiData: SuiObjectResponse[] | undefined,
  viewerTokens: ViewerToken[]
): Post[] {
  if (!suiData) return [];

  return suiData
    .map((response): Post | null => {
      if (!response.data) return null;

      const content = response.data.content;
      if (content?.dataType !== 'moveObject') return null;

      const fields = content.fields as any;
      const postId = response.data.objectId;

      // Check if post is encrypted by checking encryption_id field
      const isEncrypted = fields.encryption_id && Array.isArray(fields.encryption_id) && fields.encryption_id.length > 0;

      // Check if user has access (owns a ViewerToken for this post)
      const userHasAccess = hasAccessToPost(postId, viewerTokens);

      // Base fields shared by all posts
      const baseFields = {
        id: postId,
        author: fields.author,
        timestamp: Number(fields.created_at),
        commentCount: 0,
        tipCount: 0,
        likeCount: 0,
      };

      // Convert fee from MIST to SUI
      const feeSui = Number(fields.fee_mist) / 1_000_000_000;

      // Case 1: Not encrypted → Public post (unlocked)
      if (!isEncrypted) {
        const caption = decodeBytesToString(fields.caption);
        const imageBytes = fields.image_blob_id
          ? `${WALRUS_AGGREGATOR_URL}/${fields.image_blob_id}`
          : '';

        return {
          kind: 'unlocked',
          caption,
          imageBytes,
          ...baseFields,
        } as UnlockedPost;
      }

      // Case 2: Encrypted + No access → Locked post (paywall)
      if (!userHasAccess) {
        const encryptionId = bytesToHex(fields.encryption_id);

        return {
          kind: 'locked',
          encryptedCaption: '🔒 Encrypted content - unlock to view',
          encryptedImageUrl: '', // Placeholder for locked content
          minPrice: feeSui,
          encryptionId,
          ...baseFields,
        } as LockedPost;
      }

      // Case 3: Encrypted + Has access → Unlocked but needs decryption
      // TODO: Integrate with Seal SDK to decrypt caption and image
      // For now, show placeholder content until decryption logic is added
      const encryptionId = bytesToHex(fields.encryption_id);

      return {
        kind: 'unlocked',
        caption: '⏳ Decrypting content...', // TODO: Replace with actual decrypted caption
        imageBytes: '', // TODO: Replace with decrypted image blob URL
        encryptionId, // Store for future Seal decryption
        ...baseFields,
      } as UnlockedPost;
    })
    .filter((post): post is Post => post !== null);
}
