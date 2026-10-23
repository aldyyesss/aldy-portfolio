const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const root = path.resolve(__dirname, "../..");
const url = (
  process.env.SUPABASE_PROJECT_URL ||
  process.env.SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const key =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "aldy-portfolio";
const adminEmail = (
  process.env.ALDY_ADMIN_EMAIL || "Aldyradya2@gmail.com"
).toLowerCase();
async function api(endpoint, options = {}, publicAccess = false) {
  if (!url || !key)
    throw new Error(
      "Set SUPABASE_PROJECT_URL and SUPABASE_SECRET_KEY in the root .env.",
    );
  const apiKey = publicAccess
    ? process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
    : key;
  if (!apiKey) throw new Error("Set SUPABASE_ANON_KEY in the root .env.");
  const headers = {
    apikey: apiKey,
    ...(apiKey.startsWith("eyJ") ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...options.headers,
  };
  if (options.body && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(url + endpoint, {
      ...options,
      headers,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "Supabase could not be reached. Check network access and the project URL.",
    );
  }
  if (!response.ok)
    throw new Error(
      `Supabase request failed (HTTP ${response.status}). Check the migration and environment configuration.`,
    );
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
function sql(input) {
  const env = { ...process.env, PGSSLMODE: "require", PGCONNECT_TIMEOUT: "10" };
  if (process.env.SUPABASE_DB_URL) {
    const connection = new URL(process.env.SUPABASE_DB_URL);
    env.PGHOST = connection.hostname;
    env.PGPORT = connection.port || "5432";
    env.PGUSER = decodeURIComponent(connection.username);
    env.PGPASSWORD = decodeURIComponent(connection.password);
    env.PGDATABASE = connection.pathname.slice(1) || "postgres";
  } else {
    if (!process.env.SUPABASE_PASSWORD)
      throw new Error(
        "Set SUPABASE_PASSWORD or SUPABASE_DB_URL to apply the database migration.",
      );
    const host = new URL(url).hostname;
    if (!/^[a-z0-9]+\.supabase\.co$/.test(host))
      throw new Error("Use SUPABASE_DB_URL for a custom Supabase domain.");
    env.PGHOST = `db.${host}`;
    env.PGPORT = "5432";
    env.PGUSER = "postgres";
    env.PGPASSWORD = process.env.SUPABASE_PASSWORD;
    env.PGDATABASE = "postgres";
  }
  const result = spawnSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-qAt"], {
    env,
    input,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0)
    throw new Error(
      "Database setup failed. Check psql, the database password, and connectivity. If the direct host is unavailable, set SUPABASE_DB_URL to your Supabase pooler connection string.",
    );
  return result.stdout.trim();
}
module.exports = { root, url, key, bucket, adminEmail, api, sql, fs, path };
