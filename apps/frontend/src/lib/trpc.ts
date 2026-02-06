import type { AppRouter } from '@repo/trpc/client';
import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import superjson from 'superjson';

function getBackendUrl() {
  if (import.meta.env.PROD) {
    const url = `${window.location.origin}/trpc`;
    console.log('Production browser URL:', url);
    return url;
  }
  const host = import.meta.env.VITE_BACKEND_HOST ?? 'localhost';
  const url = `http://${host}:4000/trpc`;
  console.log('Development browser || SSR URL:', url);
  return url;
}

export function getBackendApiUrl() {
    if (import.meta.env.PROD) {
    const url = `${window.location.origin}`;
    console.log('Production browser URL:', url);
    return url;
  }
  const host = import.meta.env.VITE_BACKEND_HOST ?? 'localhost';
  const url = `http://${host}:4000`;
  console.log('Development browser || SSR URL:', url);
  return url;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

function getWsUrl() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (import.meta.env.PROD) {
    const wsURL = `${wsProtocol}//${window.location.host}/trpc`;
    return wsURL;
  }
  const host = import.meta.env.VITE_BACKEND_HOST ?? 'localhost';
  return `${wsProtocol}//${host}:4000/trpc`;
}
const wsClient = createWSClient({
  url: getWsUrl(),
  connectionParams: async () => {
  const currentToken = getAuthToken();
  return currentToken ? { authorization: `Bearer ${currentToken}` } : {};
  },
  lazy: {
    enabled: true,
    closeMs: 30000,
  },
});

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: wsLink({
        client: wsClient,
        transformer: superjson,
      }),
      false: httpBatchLink({
        url: getBackendUrl(),
        transformer: superjson,
        async headers() {
          const currentToken = getAuthToken();
          return currentToken
            ? { authorization: `Bearer ${currentToken}` }
            : {};
        },
      }),
    }),
  ],
});
