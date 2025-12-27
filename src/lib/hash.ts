/**
 * Simple hash function fallback for non-secure contexts
 * Uses a variant of djb2/FNV hash combined for better distribution
 */
function simpleHash(data: Uint8Array): string {
  let h1 = 0x811c9dc5; // FNV offset basis
  let h2 = 0x5bd1e995; // Murmur seed
  
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    
    // FNV-1a variant
    h1 ^= byte;
    h1 = Math.imul(h1, 0x01000193);
    
    // Murmur-like mixing
    h2 ^= byte;
    h2 = Math.imul(h2, 0x5bd1e995);
    h2 ^= h2 >>> 15;
  }
  
  // Additional mixing
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  
  h2 ^= h2 >>> 13;
  h2 = Math.imul(h2, 0xc2b2ae35);
  h2 ^= h2 >>> 16;
  
  // Generate 64 characters (256 bits) by running multiple rounds with different seeds
  const results: number[] = [];
  let seed1 = h1;
  let seed2 = h2;
  
  for (let round = 0; round < 8; round++) {
    seed1 = Math.imul(seed1 ^ (seed1 >>> 17), 0xed5ad4bb);
    seed1 = Math.imul(seed1 ^ (seed1 >>> 11), 0xac4c1b51);
    seed1 ^= seed1 >>> 15;
    
    seed2 = Math.imul(seed2 ^ (seed2 >>> 17), 0x165667b1);
    seed2 = Math.imul(seed2 ^ (seed2 >>> 11), 0x0a6d0e97);
    seed2 ^= seed2 >>> 15;
    
    results.push((seed1 >>> 0) & 0xff);
    results.push((seed1 >>> 8) & 0xff);
    results.push((seed1 >>> 16) & 0xff);
    results.push((seed1 >>> 24) & 0xff);
    results.push((seed2 >>> 0) & 0xff);
    results.push((seed2 >>> 8) & 0xff);
    results.push((seed2 >>> 16) & 0xff);
    results.push((seed2 >>> 24) & 0xff);
  }
  
  return results.slice(0, 32).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a SHA-256 hash from the provided data
 * Falls back to a simple hash if crypto.subtle is unavailable (non-HTTPS)
 */
export async function createHash(data: ArrayBuffer | Uint8Array): Promise<string> {
  // Convert to Uint8Array for consistent handling
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
  
  // Check if crypto.subtle is available (requires secure context)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const buffer = uint8Data.buffer.slice(
        uint8Data.byteOffset,
        uint8Data.byteOffset + uint8Data.byteLength
      ) as ArrayBuffer;
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fall through to simple hash
    }
  }
  
  // Fallback for non-secure contexts
  return simpleHash(uint8Data);
}

/**
 * Creates entropy data from cursor/touch positions
 */
export function createEntropyFromPositions(positions: Array<{ x: number; y: number; t: number }>): Uint8Array {
  const data: number[] = [];
  
  for (const pos of positions) {
    // Add position data with some precision
    data.push(Math.floor(pos.x * 1000) % 256);
    data.push(Math.floor(pos.x * 1000 / 256) % 256);
    data.push(Math.floor(pos.y * 1000) % 256);
    data.push(Math.floor(pos.y * 1000 / 256) % 256);
    // Add timing data for extra entropy
    data.push(pos.t % 256);
    data.push(Math.floor(pos.t / 256) % 256);
  }
  
  return new Uint8Array(data);
}

/**
 * Convert hash to numeric values for snowflake generation
 */
export function hashToParams(hash: string): number[] {
  const params: number[] = [];
  
  // Each pair of hex characters gives us a value 0-255
  for (let i = 0; i < hash.length; i += 2) {
    params.push(parseInt(hash.substring(i, i + 2), 16));
  }
  
  return params;
}
