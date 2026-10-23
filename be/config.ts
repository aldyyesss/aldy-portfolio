import dotenv from "dotenv";
import path from "node:path";

// Read workspace configuration in development. Vercel supplies environment variables.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  dotenv.config({});
}

export const config = {
  get url() {
    return (
      process.env.SUPABASE_PROJECT_URL ||
      process.env.SUPABASE_URL ||
      ""
    ).replace(/\/$/, "");
  },
  get secret() {
    return (
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ""
    );
  },
  get publicKey() {
    return (
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      ""
    );
  },
  get bucket() {
    return process.env.SUPABASE_STORAGE_BUCKET || "aldy-portfolio";
  },
  get adminEmail() {
    return (process.env.ALDY_ADMIN_EMAIL || "Aldyradya2@gmail.com")
      .trim()
      .toLowerCase();
  },
};

export function isConfigured() {
  return Boolean(config.url && config.secret && config.publicKey);
}
