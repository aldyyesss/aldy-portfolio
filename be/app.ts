import "./config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { portfolio, Entry } from "./services/portfolio";
import { auth } from "./services/auth";
import { ApiError } from "./services/supabase";
import { isConfigured, config } from "./config";

const categories = [
  "Organization",
  "Event committee",
  "Community service",
  "Personal development",
];
const validSlug = (value: string) =>
  value.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export function createApp(dependencies = { portfolio, auth }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }),
  );
  app.use(express.json({ limit: "100kb" }));
  const route =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res)).catch(next);
    };
  const admin = (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    dependencies.auth
      .verify(token)
      .then((user) => {
        res.locals.admin = user;
        res.locals.token = token;
        next();
      })
      .catch(next);
  };
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      owner: "Aldy Radya Herlambang",
      database: "supabase",
      storage: "supabase",
      configured: isConfigured(),
    });
  });
  app.get(
    "/experiences",
    route(async (_req, res) => {
      res.json({
        entries: await dependencies.portfolio.entries(),
        editable: true,
      });
    }),
  );
  app.get("/cv", (_req, res) => {
    if (!isConfigured()) {
      res.status(503).json({ message: "Supabase is not configured." });
      return;
    }
    res.redirect(
      302,
      `${config.url}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/cv/aldy-cv.pdf`,
    );
  });
  app.post(
    "/admin/login",
    route(async (req, res) => {
      if (
        typeof req.body.email !== "string" ||
        typeof req.body.password !== "string" ||
        !req.body.password ||
        req.body.password.length > 256 ||
        req.body.email.length > 254
      )
        throw new ApiError(400, "Enter your admin email and password.");
      res.setHeader("Cache-Control", "no-store");
      res.json(
        await dependencies.auth.login(req.body.email, req.body.password),
      );
    }),
  );
  app.use("/admin", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.get("/admin/check", admin, (_req, res) => {
    res.json({ authenticated: true, email: res.locals.admin.email });
  });
  app.post(
    "/admin/logout",
    admin,
    route(async (_req, res) => {
      await dependencies.auth.logout(res.locals.token);
      res.json({ success: true });
    }),
  );
  app.get(
    "/admin/dashboard",
    admin,
    route(async (_req, res) => {
      const [entries, media] = await Promise.all([
        dependencies.portfolio.entries(),
        dependencies.portfolio.media(),
      ]);
      res.json({
        entries,
        media,
        admin: { email: res.locals.admin.email },
        database: "Supabase PostgreSQL",
        storage: "Supabase Storage",
      });
    }),
  );
  function parseEntry(req: Request) {
    const keys = [
      "title",
      "category",
      "period",
      "startDate",
      "organization",
      "description",
    ] as const;
    const data: Record<string, string> = {};
    for (const key of keys) {
      if (
        typeof req.body[key] !== "string" ||
        !req.body[key].trim() ||
        req.body[key].length > (key === "description" ? 10000 : 300)
      )
        throw new ApiError(
          400,
          "Complete all experience fields within the allowed lengths.",
        );
      data[key] = req.body[key].trim();
    }
    const slug = String(req.params.slug);
    if (!validSlug(slug))
      throw new ApiError(
        400,
        "Use lowercase letters, numbers, and hyphens for the URL slug.",
      );
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.startDate))
      throw new ApiError(400, "Use a valid start month in YYYY-MM format.");
    if (!categories.includes(data.category))
      throw new ApiError(400, "Choose a valid experience category.");
    const imageUrl =
      typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : "";
    if (imageUrl) {
      let url: URL;
      try {
        url = new URL(imageUrl);
      } catch {
        throw new ApiError(400, "Enter a valid HTTPS image URL.");
      }
      if (
        url.protocol !== "https:" ||
        imageUrl.length > 2000 ||
        url.username ||
        url.password
      )
        throw new ApiError(400, "Enter a valid HTTPS image URL.");
    }
    return { ...data, slug, imageUrl } as unknown as Entry;
  }
  app.post(
    "/admin/experiences/:slug",
    admin,
    route(async (req, res) => {
      res
        .status(201)
        .json({
          entry: await dependencies.portfolio.save(parseEntry(req), true),
        });
    }),
  );
  app.put(
    "/admin/experiences/:slug",
    admin,
    route(async (req, res) => {
      res.json({
        entry: await dependencies.portfolio.save(parseEntry(req), false),
      });
    }),
  );
  app.delete(
    "/admin/experiences/:slug",
    admin,
    route(async (req, res) => {
      const slug = String(req.params.slug);
      if (!validSlug(slug)) throw new ApiError(400, "Invalid experience slug.");
      await dependencies.portfolio.remove(slug);
      res.json({ success: true });
    }),
  );
  app.get(
    "/admin/images",
    admin,
    route(async (_req, res) => {
      res.json({ media: await dependencies.portfolio.media() });
    }),
  );
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  });
  app.post(
    "/admin/images",
    admin,
    upload.single("image"),
    route(async (req, res) => {
      if (!req.file || !/^image\/(jpeg|png|webp)$/.test(req.file.mimetype))
        throw new ApiError(400, "Choose a JPG, PNG, or WebP image up to 4 MB.");
      let body: Buffer;
      try {
        body = await sharp(req.file.buffer, { limitInputPixels: 40000000 })
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new ApiError(400, "This file could not be read as an image.");
      }
      res
        .status(201)
        .json(
          await dependencies.portfolio.upload(
            `images/${randomUUID()}.webp`,
            body,
            "image/webp",
          ),
        );
    }),
  );
  app.delete(
    "/admin/images/:name",
    admin,
    route(async (req, res) => {
      await dependencies.portfolio.removeMedia(String(req.params.name));
      res.json({ success: true });
    }),
  );
  app.use((_req, res) => {
    res.status(404).json({ message: "API route not found." });
  });
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const status = error instanceof ApiError ? error.status : 400;
    res
      .status(status)
      .json({
        message:
          error instanceof ApiError
            ? error.message
            : error instanceof multer.MulterError
              ? "Choose one image up to 4 MB."
              : "The request could not be processed.",
      });
  });
  return app;
}
const app = createApp();
if (require.main === module)
  app.listen(Number(process.env.PORT) || 3300, () =>
    console.log("Aldy API is running on port 3300"),
  );
export default app;
