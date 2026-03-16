import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import pino from "pino";
import { Queue, Worker } from "bullmq";

// 1. DEFINE LOGGER FIRST (So everyone else can use it)
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

export { logger };

// 2. ENVIRONMENT CONFIG
const envSchema = z.object({
  NODE_ENV:           z.enum(["development", "production", "test"]).default("development"),
  PORT:               z.coerce.number().default(3000),
  DATABASE_URL:       z.string().url(),
  REDIS_URL:          z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET:  z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL:     z.string().default("15m"),
  JWT_REFRESH_TTL:    z.string().default("30d"),
  CORS_ORIGINS:       z.string().default("http://localhost:5173"),
  WA_PHONE_NUMBER_ID: z.string().optional(),
  WA_ACCESS_TOKEN:    z.string().optional(),
  MSG91_AUTH_KEY:     z.string().optional(),
  MSG91_TEMPLATE_ID:  z.string().optional(),
  S3_BUCKET:          z.string().optional(),
  S3_REGION:          z.string().default("ap-south-1"),
  S3_ACCESS_KEY:      z.string().optional(),
  S3_SECRET_KEY:      z.string().optional(),
  S3_ENDPOINT:        z.string().optional(),
  RAZORPAY_KEY_ID:     z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}
export const env = parsed.data;

// 3. DATABASE (PRISMA)
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});
prisma.$on("error", (e) => logger.error(e, "Prisma error"));
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 4. REDIS
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});
redis.on("error", (err) => logger.error(err, "Redis error"));
redis.on("connect", () => logger.info("Redis connected"));

// 5. JWT UTILS
export const signAccessToken = (payload) => jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
export const signRefreshToken = (payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });
export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

// 6. SCHEMAS (Auth, Customer, Transaction)
export const createTxnSchema = z.object({
  customerId:  z.string().cuid(),
  type:        z.enum(["UDHAR", "JAMA"]),
  amount:      z.number().int().positive().max(10_000_000),
  description: z.string().min(1).max(200),
  note:        z.string().max(500).optional(),
  category:    z.string().max(50).optional(),
  clientId:    z.string().uuid().optional(),
});

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Valid Indian mobile required"),
});

// 7. JOBS / QUEUE
const connection = redis;
export const syncQueue     = new Queue("sync",     { connection });
export const scoreQueue    = new Queue("score",    { connection });
export const reminderQueue = new Queue("reminder", { connection });

export async function startWorkers() {
  const { default: syncWorkerFn }     = await import("./workers/sync.worker.js");
  const { default: scoreWorkerFn }    = await import("./workers/score.worker.js");
  const { default: reminderWorkerFn } = await import("./workers/reminder.worker.js");

  new Worker("sync",     syncWorkerFn,     { connection });
  new Worker("score",    scoreWorkerFn,    { connection });
  new Worker("reminder", reminderWorkerFn, { connection });

  logger.info("All BullMQ workers registered");
}