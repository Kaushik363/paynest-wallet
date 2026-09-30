const Redis = require("ioredis");

// If Redis is down we don't want the whole app to die,
// so commands fail fast and the helpers below just fall back to the database.
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.log("Redis problem:", err.message));

async function getCache(key) {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

async function setCache(key, value, seconds = 60) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", seconds);
  } catch {
    // cache is optional, ignore
  }
}

// Call this whenever a user's money changes so they never see stale numbers.
async function clearUserCache(userId) {
  try {
    const historyKeys = await redis.keys(`history:${userId}:*`);
    await redis.del(`balance:${userId}`, ...historyKeys);
  } catch {
    // ignore
  }
}

module.exports = { redis, getCache, setCache, clearUserCache };
