import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/logger/index.js';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

// Registrar log de queries no logger estruturado em modo debug
prisma.$on('query' as any, (e: any) => {
  logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma Query');
});

prisma.$on('info' as any, (e: any) => {
  logger.info({ message: e.message }, 'Prisma Info');
});

prisma.$on('warn' as any, (e: any) => {
  logger.warn({ message: e.message }, 'Prisma Warn');
});

prisma.$on('error' as any, (e: any) => {
  logger.error({ message: e.message }, 'Prisma Error');
});
