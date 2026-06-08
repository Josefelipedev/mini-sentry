import Redis from 'ioredis';

export function createRedisClient(): Redis {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on('error', (err) => {
    console.error('[redis] connection error:', err.message);
  });

  return client;
}
