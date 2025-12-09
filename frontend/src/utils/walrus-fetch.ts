/**
 * Fetch encrypted data from Walrus storage with retry logic.
 *
 * @param url - Full Walrus aggregator URL
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Uint8Array of fetched data
 */
export async function fetchFromWalrus(url: string, maxRetries: number = 3): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Accept': 'application/octet-stream'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Walrus returned ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (attempt === maxRetries) {
        if (error.name === 'AbortError') {
          throw new Error('Walrus storage is experiencing delays. Please try again in a moment.');
        }
        throw new Error(`Unable to fetch from Walrus: ${error.message}`);
      }

      // Exponential backoff: wait 2^attempt seconds before retry
      console.log(`Walrus fetch attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error('Unexpected error in Walrus fetch');
}
