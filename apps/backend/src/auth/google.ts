import { FastifyInstance } from 'fastify';
import { request } from 'https';
import { findUserByEmail, createUser } from '../db/src/dbFunctions';
import { jwtUtils } from './jwt';
import { TRPCError } from '@trpc/server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

function makeHttpsRequest(
  url: string,
  options: any,
  body?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

export function setupGoogleAuthRoutes(app: FastifyInstance) {
  app.get('/api/auth/google', async (req, reply) => {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid email profile',
    });

    reply.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  app.get('/api/auth/google/callback', async (req, reply) => {
    const { code } = req.query as { code: string };

    try {
      // Exchange authorization code for access token
      const tokenParams = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      });

      const tokenResponse = await makeHttpsRequest(
        GOOGLE_TOKEN_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
        tokenParams.toString()
      );

      const { access_token } = tokenResponse;

      // Fetch user info
      const userInfoResponse = await makeHttpsRequest(GOOGLE_USERINFO_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const { email, name, sub: googleId, picture } = userInfoResponse;

      // Check if user exists
      let user = await findUserByEmail(email);

      if (!user) {
        const dummyPassword = `google_${googleId}_${Date.now()}`;
        await createUser(name, email, dummyPassword);
        user = await findUserByEmail(email);
      }

      if (!user || !user.id) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Google user creation failed',
        });
      }

      // Issue JWT
      const token = jwtUtils.sign(user.id, user.email);
      
      reply.setCookie('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        })
        .redirect('http://localhost:8080/welcome');

    } catch (error) {
      console.error('Google Sign-In failed:', error);
      reply.status(500).send({ error: 'Google Sign-In failed' });
    }
  });

  app.get('/api/auth/me', async (req, reply) => {
    try {
      const { auth_token } = req.cookies;
      if (!auth_token) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }
      
      const decoded = jwtUtils.verify(auth_token);
      if (typeof decoded === 'string' || !decoded?.email) {
        return reply.status(400).send({ error: 'Invalid token' });
      }
      const user = await findUserByEmail(decoded.email);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return {
        name: user.alias ?? user.name,
        token: auth_token, // to mirror into localStorage
      };
    } catch (err) {
      console.error(err);
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });
}
