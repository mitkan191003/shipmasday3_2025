/**
 * Creates a SHA-256 hash from the provided data
 */
export async function createHash(data: ArrayBuffer | Uint8Array): Promise<string> {
  // Convert to ArrayBuffer for compatibility with crypto.subtle.digest
  let buffer: ArrayBuffer;
  if (data instanceof Uint8Array) {
    // Create a new ArrayBuffer from the Uint8Array to avoid SharedArrayBuffer issues
    buffer = new Uint8Array(data).buffer;
  } else {
    buffer = data;
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
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

