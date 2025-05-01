// redisClient.js
const Redis = require('ioredis');
const logger = require('./logger'); // ← これでOK

const redisClient = new Redis(process.env.REDIS_URL, {
  tls: {
    servername: process.env.REDIS_HOST
  },
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis接続リトライ上限');
      return null;
    }
    return Math.min(times * 200, 5000);
  }
});

// 接続テスト
redisClient.on('connect', async () => {
  try {
    await redisClient.ping();
    logger.info('✅ Redis認証成功');
  } catch (err) {
    logger.error('🛑 Redis認証失敗', err);
  }
});

module.exports = redisClient;

