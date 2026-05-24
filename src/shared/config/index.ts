import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_KEY: z.string().min(1, 'A API_KEY é obrigatória para segurança do sistema'),
  DATABASE_URL: z.string().url('DATABASE_URL inválida'),
  REDIS_URL: z.string().url('REDIS_URL inválida'),
  DEFAULT_TIMEZONE: z.string().default('UTC'),
  SNAPSHOT_CACHE_TTL_SEC: z.coerce.number().default(300),
  HOT_MEMORY_TTL_SEC: z.coerce.number().default(1800),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Variáveis de ambiente inválidas ou ausentes:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const config = _env.data;
