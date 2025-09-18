import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config(); // Load environment variables from .env file
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECTRET is not defined in the environment variables');
}

function sign(userId: number, email: string): string {
  const options: jwt.SignOptions = {
    algorithm: 'HS256', //using SHA-256 hash algorithm (default)
    expiresIn: '5d',
  };
  const token = jwt.sign({ userId, email }, secret!, options);
  if (!token) {
    console.error('Failed to sign JWT token');
    return '';
  }
  return token;
}

function verify(token: string) {
  try {
    const decoded = jwt.verify(token, secret!, {
      algorithms: ['HS256'],
    });
    if (decoded) {
      return decoded;
    }
    console.error('Invalid token');
    return null;
  } catch (error) {
    console.error('JWT verification failed: ', error);
    return null;
  }
}

export const jwtUtils = {
  sign,
  verify,
};
