import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: any): string {
    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign(payload, secret, { expiresIn });
  }

  static verifyToken(token: string): any {
    const secret = process.env.JWT_SECRET!;
    return jwt.verify(token, secret);
  }
}

export function generateApiKeyHash(key: string): string {
  return bcrypt.hashSync(key, 10);
}

export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
