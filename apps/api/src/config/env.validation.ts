import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().default(4000),
  API_CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  MSG91_AUTH_KEY: z.string().optional().default(''),
  MSG91_TEMPLATE_ID: z.string().optional().default(''),
  MSG91_SENDER_ID: z.string().optional().default(''),
  MSG91_OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  RAZORPAY_CURRENCY: z.string().default('INR'),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),
  GCP_PROJECT_ID: z.string().optional().default(''),
  GCP_STORAGE_BUCKET: z.string().optional().default(''),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional().default(''),
  SENTRY_DSN: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }

  return parsed.data;
}
