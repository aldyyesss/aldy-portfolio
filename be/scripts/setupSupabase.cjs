const { randomBytes } = require("node:crypto");
const {
  api,
  sql,
  fs,
  path,
  root,
  adminEmail,
  bucket,
} = require("./supabaseCommon.cjs");
const { seed } = require("./seedSupabase.cjs");
async function setup() {
  if (bucket !== "aldy-portfolio")
    throw new Error(
      "The migration provisions aldy-portfolio. Use that bucket for initial setup.",
    );
  // Check the API first. A network failure must not produce a partially applied seed.
  await api("/storage/v1/bucket");
  const file = fs
    .readdirSync(path.join(root, "supabase/migrations"))
    .find((n) => n.endsWith("_aldy_portfolio.sql"));
  sql(fs.readFileSync(path.join(root, "supabase/migrations", file), "utf8"));
  console.log("Database schema and storage bucket are ready.");
  const security = sql(
    "select relrowsecurity from pg_class where oid='public.portfolio_experiences'::regclass; select has_table_privilege('anon','public.portfolio_experiences','INSERT') or has_table_privilege('authenticated','public.portfolio_experiences','UPDATE');",
  );
  if (security !== "t\nf")
    throw new Error(
      "The database access checks did not pass. Review the migration before continuing.",
    );
  await seed();
  // Do not change an existing Auth account or reset its password.
  const users = await api("/auth/v1/admin/users?page=1&per_page=1000");
  if (!(users.users || []).some((u) => u.email?.toLowerCase() === adminEmail)) {
    let password = process.env.ALDY_ADMIN_INITIAL_PASSWORD;
    if (password && password.length < 12)
      throw new Error(
        "Use at least 12 characters for ALDY_ADMIN_INITIAL_PASSWORD.",
      );
    if (!password) {
      password = randomBytes(24).toString("base64url");
      fs.appendFileSync(
        path.join(root, ".env"),
        `\n# Generated initial admin password. Keep this file private.\nALDY_ADMIN_INITIAL_PASSWORD=${password}\n`,
        { mode: 0o600 },
      );
      console.log(
        "An initial admin password was saved to the ignored root .env. It is not printed.",
      );
    }
    await api("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: adminEmail,
        password,
        email_confirm: true,
      }),
    });
    console.log("The Supabase Auth admin account was created.");
  } else console.log("The existing Supabase Auth admin account was preserved.");
  console.log("Setup complete. Run npm run verify:supabase next.");
}
setup().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
