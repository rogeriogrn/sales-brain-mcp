import pinoModule from 'pino';
import { config } from '../config/index.js';

// Resolução de compatibilidade para imports ES Modules e CommonJS
const pino = (pinoModule as any).default || pinoModule;

const isDevelopment = config.NODE_ENV === 'development';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
