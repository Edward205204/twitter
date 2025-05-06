import { createHash, randomBytes } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export function sha256(content: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = createHash('sha256').update(content).digest('hex');
      resolve(hash);
    } catch (error) {
      reject(error);
    }
  });
}

export async function hashPassword({
  password,
  salt = randomBytes(16).toString('hex')
}: {
  password: string;
  salt?: string;
}): Promise<{ password: string; salt: string }> {
  try {
    const hash = await sha256(password + (process.env.PRIVATE_KEY as string) + salt);
    return { password: hash, salt };
  } catch (error) {
    throw new Error('Error hashing password: ' + error);
  }
}
