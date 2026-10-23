const assert = require("node:assert/strict");
require("../dist/config");
process.env.SUPABASE_PROJECT_URL = "https://project.supabase.co";
process.env.SUPABASE_SECRET_KEY = "sb_secret_test-only";
process.env.SUPABASE_ANON_KEY = "sb_publishable_test-only";
process.env.SUPABASE_STORAGE_BUCKET = "aldy-portfolio";
process.env.ALDY_ADMIN_EMAIL = "admin@example.test";
const { portfolio } = require("../dist/services/portfolio");
const { auth } = require("../dist/services/auth");
const { supabase } = require("../dist/services/supabase");
const calls = [];
let handler;
global.fetch = async (url, options) => {
  calls.push({ url, options });
  return handler(url, options);
};
const row = {
  slug: "test",
  title: "Test",
  category: "Organization",
  period: "2026",
  start_date: "2026-10",
  organization: "HIMATEKBIS",
  description: "Test description",
  image_url: "",
  updated_at: "2026-10-23T00:00:00Z",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
(async () => {
  handler = (url, options) => {
    assert.equal(options.headers.get("apikey"), "sb_secret_test-only");
    assert.equal(options.headers.has("Authorization"), false);
    assert.ok(
      url.endsWith(
        "/rest/v1/portfolio_experiences?select=*&order=start_date.desc,slug.asc",
      ),
    );
    return json([row]);
  };
  const [entry] = await portfolio.entries();
  assert.equal(entry.startDate, "2026-10");
  assert.equal(entry.updatedAt, row.updated_at);
  handler = (url, options) => {
    assert.equal(options.method, "PATCH");
    const body = JSON.parse(options.body);
    assert.equal(body.start_date, "2026-10");
    assert.equal(body.image_url, "");
    assert.ok(!("startDate" in body));
    return json([{ ...row, title: "Updated" }]);
  };
  await portfolio.save({ ...entry, title: "Updated" }, false);
  handler = () => json([]);
  await assert.rejects(
    () => portfolio.save(entry, false),
    (e) => e.status === 404,
  );
  handler = () => json([row]);
  await assert.rejects(
    () => portfolio.save(entry, true),
    (e) => e.status === 409,
  );
  handler = (url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(JSON.parse(options.body).prefix, "images");
    return json([
      {
        name: "abc.webp",
        id: "id",
        created_at: "2026-10-23",
        metadata: { size: 123 },
      },
      { name: "folder", id: null },
    ]);
  };
  const media = await portfolio.media();
  assert.equal(media.length, 1);
  assert.equal(media[0].size, 123);
  assert.ok(media[0].url.endsWith("/images/abc.webp"));
  handler = (url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(options.headers.get("Content-Type"), "image/webp");
    assert.ok(options.body instanceof Uint8Array);
    return json({ Key: "test" });
  };
  assert.ok(
    (
      await portfolio.upload(
        "images/test.webp",
        Buffer.from("image"),
        "image/webp",
      )
    ).url.endsWith("images/test.webp"),
  );
  handler = () => json([{ ...row, image_url: media[0].url }]);
  await assert.rejects(
    () => portfolio.removeMedia("abc.webp"),
    (e) => e.status === 409,
  );
  await assert.rejects(
    () => portfolio.removeMedia("../escape.webp"),
    (e) => e.status === 400,
  );
  handler = (url, options) => {
    assert.equal(options.headers.get("apikey"), "sb_publishable_test-only");
    assert.equal(options.headers.get("Authorization"), "Bearer valid");
    return json({
      id: "user",
      email: "ADMIN@example.test",
      email_confirmed_at: "2026-01-01",
    });
  };
  assert.equal((await auth.verify("valid")).id, "user");
  handler = () =>
    json({
      id: "user",
      email: "other@example.test",
      email_confirmed_at: "2026-01-01",
      user_metadata: { role: "admin" },
    });
  await assert.rejects(
    () => auth.verify("other"),
    (e) => e.status === 403,
  );
  handler = () => json({ id: "user", email: "admin@example.test" });
  await assert.rejects(
    () => auth.verify("unconfirmed"),
    (e) => e.status === 403,
  );
  handler = () => json({ message: "Invalid credentials" }, 400);
  await assert.rejects(
    () => auth.login("admin@example.test", "wrong"),
    (e) => e.status === 401,
  );
  handler = () => {
    throw new Error("Private provider details must not be forwarded");
  };
  await assert.rejects(
    () => supabase("/rest/v1/test"),
    (e) => e.status === 503 && !e.message.includes("Private"),
  );
  handler = () => json({ message: "secret provider error" }, 500);
  await assert.rejects(
    () => supabase("/rest/v1/test"),
    (e) => e.status === 503 && !e.message.includes("secret provider"),
  );
  console.log(
    "Supabase contract checks passed. Server-only keys, Auth authorization, SQL mapping, storage upload, referenced-image protection, and safe errors verified.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
