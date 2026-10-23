const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const http = require("node:http");
const { createApp } = require("../dist/app");
const { ApiError } = require("../dist/services/supabase");
const entries = structuredClone(require("../data/aldy.json"));
const testAuth = {
  async verify(token) {
    if (token === "admin")
      return {
        id: "test-admin",
        email: "admin@example.test",
        email_confirmed_at: "2026-01-01",
      };
    throw new ApiError(token === "other" ? 403 : 401, "Access denied.");
  },
  async login(email, password) {
    if (email === "admin@example.test" && password === "test-password")
      return { token: "admin", expiresIn: 3600 };
    throw new ApiError(401, "Invalid credentials.");
  },
  async logout() {},
};
const testPortfolio = {
  async entries() {
    return [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
  },
  async media() {
    return [];
  },
  async save(entry, create) {
    const index = entries.findIndex((e) => e.slug === entry.slug);
    if (create && index >= 0) throw new ApiError(409, "Duplicate.");
    if (!create && index < 0) throw new ApiError(404, "Not found.");
    if (index >= 0) entries[index] = entry;
    else entries.push(entry);
    return entry;
  },
  async remove(slug) {
    const index = entries.findIndex((e) => e.slug === slug);
    if (index < 0) throw new ApiError(404, "Not found.");
    entries.splice(index, 1);
  },
  async upload(path) {
    return {
      url: `https://test.supabase.co/storage/v1/object/public/aldy-portfolio/${path}`,
      path,
    };
  },
  async removeMedia() {},
};
const app = createApp({ portfolio: testPortfolio, auth: testAuth });
function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const content = body === undefined ? "" : JSON.stringify(body);
    const req = Readable.from(content ? [Buffer.from(content)] : []);
    req.method = method;
    req.url = url;
    req.headers = {
      host: "localhost",
      ...(content
        ? {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(content),
          }
        : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };
    req.connection = req.socket = { remoteAddress: "127.0.0.1" };
    const res = new http.ServerResponse(req);
    const timeout = setTimeout(
      () => reject(new Error(`Timeout for ${url}`)),
      5000,
    );
    res.end = (data) => {
      clearTimeout(timeout);
      resolve({
        status: res.statusCode,
        body: data ? JSON.parse(data.toString()) : null,
      });
      return res;
    };
    app.handle(req, res, reject);
  });
}
(async () => {
  assert.equal((await request("GET", "/health")).body.storage, "supabase");
  const list = await request("GET", "/experiences");
  assert.equal(list.status, 200);
  assert.equal(list.body.entries.length, 8);
  assert.equal(list.body.entries[0].slug, "ofm-2026");
  for (const [method, path] of [
    ["GET", "/admin/check"],
    ["GET", "/admin/dashboard"],
    ["POST", "/admin/experiences/test"],
    ["PUT", "/admin/experiences/test"],
    ["DELETE", "/admin/experiences/test"],
    ["GET", "/admin/images"],
    ["POST", "/admin/images"],
    ["DELETE", "/admin/images/test.webp"],
  ]) {
    assert.equal((await request(method, path)).status, 401);
    assert.equal((await request(method, path, undefined, "other")).status, 403);
  }
  assert.equal((await request("POST", "/admin/login", {})).status, 400);
  assert.equal(
    (
      await request("POST", "/admin/login", {
        email: "admin@example.test",
        password: "wrong",
      })
    ).status,
    401,
  );
  const login = await request("POST", "/admin/login", {
    email: "admin@example.test",
    password: "test-password",
  });
  assert.equal(login.status, 200);
  const token = login.body.token;
  assert.equal(
    (await request("GET", "/admin/check", undefined, token)).status,
    200,
  );
  assert.equal(
    (await request("GET", "/admin/dashboard", undefined, token)).body.entries
      .length,
    8,
  );
  const valid = {
    title: "New role",
    category: "Organization",
    period: "2026",
    startDate: "2026-10",
    organization: "HIMATEKBIS",
    description: "A new experience.",
  };
  for (const changes of [
    { title: "" },
    { category: "unknown" },
    { startDate: "2026-13" },
    { imageUrl: "javascript:alert(1)" },
    { imageUrl: "https://user:password@example.test/image" },
  ])
    assert.equal(
      (
        await request(
          "POST",
          "/admin/experiences/new-role",
          { ...valid, ...changes },
          token,
        )
      ).status,
      400,
    );
  assert.equal(
    (await request("POST", "/admin/experiences/INVALID", valid, token)).status,
    400,
  );
  assert.equal(
    (await request("POST", "/admin/experiences/new-role", valid, token)).status,
    201,
  );
  assert.equal(
    (await request("POST", "/admin/experiences/new-role", valid, token)).status,
    409,
  );
  assert.equal((await request("GET", "/experiences")).body.entries.length, 9);
  assert.equal(
    (
      await request(
        "PUT",
        "/admin/experiences/new-role",
        { ...valid, title: "Updated role" },
        token,
      )
    ).body.entry.title,
    "Updated role",
  );
  assert.equal(
    (await request("PUT", "/admin/experiences/missing", valid, token)).status,
    404,
  );
  assert.equal(
    (await request("POST", "/admin/images", undefined, token)).status,
    400,
  );
  assert.equal(
    (await request("DELETE", "/admin/experiences/new-role", undefined, token))
      .status,
    200,
  );
  assert.equal(
    (await request("DELETE", "/admin/experiences/new-role", undefined, token))
      .status,
    404,
  );
  assert.equal((await request("GET", "/experiences")).body.entries.length, 8);
  assert.equal(
    (await request("POST", "/admin/logout", undefined, token)).status,
    200,
  );
  assert.equal((await request("GET", "/unknown")).status, 404);
  console.log(
    "API checks passed. Admin authorization, dashboard, CRUD, validation, and error handling verified without live credentials.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
