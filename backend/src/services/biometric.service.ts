import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY = process.env.BIOMETRIC_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export function encryptBiometricDescriptor(descriptor: number[]): string {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(DEFAULT_KEY.slice(0, 64), 'hex');
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  const plaintext = JSON.stringify(descriptor);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptBiometricDescriptor(encryptedData: string): number[] {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // Fallback if stored as plain JSON in test/dev
    return JSON.parse(encryptedData);
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(DEFAULT_KEY.slice(0, 64), 'hex');

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Calculates Cosine Similarity between two 128-d or 512-d feature vectors.
 * Returns value between -1.0 and 1.0 (typically 0.60+ is a strong positive facial match).
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates Euclidean Distance between two facial embeddings.
 * Lower distance (e.g. < 0.60) means closer match.
 */
export function calculateEuclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

