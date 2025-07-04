import { Redis } from 'ioredis';

/** @type {Redis} Le client Redis. */
export const redisClient = new Redis({ host: 'localhost', port: 6379 });