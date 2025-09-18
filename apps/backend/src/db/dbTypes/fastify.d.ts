import { DbType } from './types';

/* Still trying to understand if this is needed */
declare module 'fastify' {
  interface FastifyInstance {
    db: DbType;
  }
}
