import Fastify from 'fastify';
import cors from '@fastify/cors';
import { OAuth2Client } from 'google-auth-library';

const fastify = Fastify({ logger: true });
const client = new OAuth2Client('YOUR_GOOGLE_CLIENT_ID');

fastify.register(cors, {
  origin: true,
});

fastify.post('/verify-token', async (request, reply) => {
  const { token } = request.body as { token: string };
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: 'GOOGLE_CLIENT_ID',
    });
    const payload = ticket.getPayload();
    return { success: true, payload };
  } catch (err) {
    return reply.status(401).send({ success: false, message: 'Invalid token' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();