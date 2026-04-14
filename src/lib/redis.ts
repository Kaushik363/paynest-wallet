// src/lib/redis.ts
import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    client.on("error", () => {
      // Silently handle — app works without Redis, just slower
    });
    redis = client;
    return redis;
  } catch {
    return null;
  }
}

export async function redisGet(key: string): Promise<string | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    return await client.get(key);
  } catch {
    return null; // graceful degradation
  }
}

export async function redisSet(key: string, value: string, ttlSeconds = 300) {
  try {
    const client = getRedis();
    if (!client) return;
    await client.setex(key, ttlSeconds, value);
  } catch {
    // graceful degradation
  }
}

export async function redisDel(...keys: string[]) {
  try {
    const client = getRedis();
    if (!client || keys.length === 0) return;
    await client.del(...keys);
  } catch {
    // graceful degradation
  }
}
