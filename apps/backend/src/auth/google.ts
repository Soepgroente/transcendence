import { FastifyInstance } from 'fastify';
import { request } from 'https';

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

      // Handle user login/signup logic here
      console.log('Google User:', userInfoResponse);

      reply.send({
        message: 'Google Sign-In successful',
        user: userInfoResponse,
      });
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      reply.status(500).send({ error: 'Google Sign-In failed' });
    }
  });
}
