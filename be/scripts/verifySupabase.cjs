const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { api, sql, url, bucket } = require("./supabaseCommon.cjs");
async function verify() {
  const rows = await api("/rest/v1/portfolio_experiences?select=slug&limit=10");
  assert.ok(Array.isArray(rows));
  const security = sql(
    "select relrowsecurity from pg_class where oid='public.portfolio_experiences'::regclass; select has_table_privilege('anon','public.portfolio_experiences','INSERT') or has_table_privilege('authenticated','public.portfolio_experiences','UPDATE');",
  );
  assert.equal(
    security,
    "t\nf",
    "RLS must be enabled and direct user mutations denied",
  );
  const bucketInfo = await api(
    `/storage/v1/bucket/${encodeURIComponent(bucket)}`,
  );
  assert.equal(bucketInfo.public, true);
  // Test writes inside a transaction and roll back, leaving portfolio records unchanged.
  const slug = `verification-${randomUUID()}`;
  sql(
    `begin; insert into public.portfolio_experiences(slug,title,category,period,start_date,organization,description) values ('${slug}','Verification','Organization','2026','2026-01','Verification','Verification'); update public.portfolio_experiences set title='Updated' where slug='${slug}'; delete from public.portfolio_experiences where slug='${slug}'; rollback;`,
  );
  const image = await require("sharp")({
    create: { width: 1, height: 1, channels: 3, background: "#075985" },
  })
    .webp()
    .toBuffer();
  const object = `images/${randomUUID()}.webp`;
  await api(`/storage/v1/object/${encodeURIComponent(bucket)}/${object}`, {
    method: "POST",
    headers: { "Content-Type": "image/webp" },
    body: image,
  });
  try {
    const response = await fetch(
      `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${object}`,
      { signal: AbortSignal.timeout(15000) },
    );
    assert.equal(response.status, 200);
  } finally {
    await api(`/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: "DELETE",
      body: JSON.stringify({ prefixes: [object] }),
    });
  }
  const cv = await fetch(
    `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/cv/aldy-cv.pdf`,
    { signal: AbortSignal.timeout(15000) },
  );
  assert.equal(cv.status, 200);
  console.log(
    "Live Supabase verification passed. Read access, RLS, database writes, image upload/read/delete, and CV download checked.",
  );
}
verify().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
