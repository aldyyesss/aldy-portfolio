const { api, fs, path, root, bucket } = require("./supabaseCommon.cjs");
async function seed() {
  const entries = JSON.parse(
    fs.readFileSync(path.join(root, "be/data/aldy.json"), "utf8"),
  );
  const rows = entries.map(({ startDate, imageUrl, ...entry }) => ({
    ...entry,
    start_date: startDate,
    image_url: imageUrl || "",
  }));
  await api("/rest/v1/portfolio_experiences?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  const cv = fs.readFileSync(path.join(root, "fe/public/cv-aldy.pdf"));
  await api(`/storage/v1/object/${encodeURIComponent(bucket)}/cv/aldy-cv.pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf", "x-upsert": "true" },
    body: cv,
  });
  console.log(
    "CV experiences seeded without replacing existing records. Original CV uploaded to Supabase Storage.",
  );
}
if (require.main === module)
  seed().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
module.exports = { seed };
