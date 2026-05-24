import { Redis } from 'ioredis';
import { config } from '../../shared/config/index.js';
import { logger } from '../../shared/logger/index.js';

let redisClient: Redis | null = null;
const memoryBackup = new Map<string, string>();
let useMemoryFallback = false;

try {
  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 2000,
    lazyConnect: true,
    retryStrategy: () => null, // Desativa tentativas infinitas de reconexão no dev para evitar poluição de logs
  });

  redisClient.on('connect', () => {
    logger.info('🔌 Conexão com Redis estabelecida com sucesso');
    useMemoryFallback = false;
  });

  redisClient.on('error', (err) => {
    logger.warn('⚠️ Falha de conexão com Redis. Ativando fallback em memória local.');
    useMemoryFallback = true;
  });
} catch (err) {
  logger.warn('⚠️ Erro ao instanciar Redis. Usando fallback em memória local.');
  useMemoryFallback = true;
}

export const redis = {
  async connect(): Promise<void> {
    if (!redisClient) {
      useMemoryFallback = true;
      return;
    }
    try {
      await redisClient.connect();
    } catch (err) {
      logger.warn('⚠️ Não foi possível conectar ao Redis na inicialização. Usando fallback em memória.');
      useMemoryFallback = true;
    }
  },

  async ping(): Promise<string> {
    if (useMemoryFallback || !redisClient) return 'PONG (memory)';
    try {
      return await redisClient.ping();
    } catch {
      return 'PONG (memory)';
    }
  },

  async get(key: string): Promise<string | null> {
    if (useMemoryFallback || !redisClient) {
      return memoryBackup.get(key) || null;
    }
    try {
      return await redisClient.get(key);
    } catch {
      return memoryBackup.get(key) || null;
    }
  },

  async set(key: string, value: string, mode?: 'EX', ttl?: number): Promise<string> {
    if (useMemoryFallback || !redisClient) {
      memoryBackup.set(key, value);
      if (ttl) {
        setTimeout(() => memoryBackup.delete(key), ttl * 1000);
      }
      return 'OK';
    }
    try {
      if (mode === 'EX' && ttl) {
        return await redisClient.set(key, value, 'EX', ttl);
      }
      return await redisClient.set(key, value);
    } catch {
      memoryBackup.set(key, value);
      return 'OK';
    }
  },

  async del(key: string): Promise<number> {
    if (useMemoryFallback || !redisClient) {
      return memoryBackup.delete(key) ? 1 : 0;
    }
    try {
      return await redisClient.del(key);
    } catch {
      return memoryBackup.delete(key) ? 1 : 0;
    }
  }
};

