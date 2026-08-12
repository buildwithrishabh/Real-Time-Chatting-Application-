const dotenv = require("dotenv");
const { z } = require("zod");

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  TRUST_PROXY: z
    .string()
    .optional()
    .default("true")
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      const num = Number(val);
      return !isNaN(num) ? num : val;
    }),

  MONGODB_URI: z.string().url("MONGODB_URI must be a valid connection URL"),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("6379"),
  REDIS_PASSWORD: z.string().optional().default(""),

  JWT_ACCESS_SECRET: z
    .string()
    .min(8, "JWT Access Secret must be at least 8 characters long"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(8, "JWT Refresh Secret must be at least 8 characters long"),
  COOKIE_SECRET: z
    .string()
    .min(8, "Cookie Secret must be at least 8 characters long"),

  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  // Email API / SMTP Configuration
  BREVO_API_KEY: z.string().optional().default(""),
  BREVO_SENDER_EMAIL: z.string().email().optional().default("noreply@chatapp.com"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 587)),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().email().default("noreply@chatapp.com"),
});

const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(JSON.stringify(envValidation.error.format(), null, 2));
  process.exit(1);
}

module.exports = envValidation.data;
