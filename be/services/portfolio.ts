import { config } from "../config";
import { supabase, ApiError } from "./supabase";

export interface Entry {
  slug: string;
  title: string;
  category: string;
  period: string;
  startDate: string;
  organization: string;
  description: string;
  imageUrl?: string;
  updatedAt?: string;
}
type Row = Omit<Entry, "startDate" | "imageUrl" | "updatedAt"> & {
  start_date: string;
  image_url: string;
  updated_at: string;
};
export interface Media {
  name: string;
  path: string;
  url: string;
  size: number;
  createdAt: string;
}
interface StorageObject {
  name: string;
  id: string | null;
  created_at: string;
  metadata?: { size?: number };
}
export function mediaUrl(path: string) {
  return `${config.url}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
export const portfolio = {
  async entries(): Promise<Entry[]> {
    const rows = await supabase<Row[]>(
      "/rest/v1/portfolio_experiences?select=*&order=start_date.desc,slug.asc",
    );
    return rows.map(({ start_date, image_url, updated_at, ...row }) => ({
      ...row,
      startDate: start_date,
      imageUrl: image_url,
      updatedAt: updated_at,
    }));
  },
  async save(entry: Entry, create: boolean): Promise<Entry> {
    const row = {
      slug: entry.slug,
      title: entry.title,
      category: entry.category,
      period: entry.period,
      start_date: entry.startDate,
      organization: entry.organization,
      description: entry.description,
      image_url: entry.imageUrl || "",
      updated_at: new Date().toISOString(),
    };
    if (create && (await this.entries()).some((e) => e.slug === entry.slug))
      throw new ApiError(
        409,
        "This URL slug is already in use. Choose another one.",
      );
    const query = create ? "" : `?slug=eq.${encodeURIComponent(entry.slug)}`;
    const rows = await supabase<Row[]>(
      `/rest/v1/portfolio_experiences${query}`,
      {
        method: create ? "POST" : "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(row),
      },
    );
    if (!rows.length)
      throw new ApiError(
        404,
        "This experience no longer exists. Reload the list.",
      );
    return { ...entry, updatedAt: rows[0].updated_at };
  },
  async remove(slug: string) {
    const rows = await supabase<Row[]>(
      `/rest/v1/portfolio_experiences?slug=eq.${encodeURIComponent(slug)}`,
      { method: "DELETE", headers: { Prefer: "return=representation" } },
    );
    if (!rows.length) throw new ApiError(404, "Experience not found.");
  },
  async media(): Promise<Media[]> {
    const objects = await supabase<StorageObject[]>(
      `/storage/v1/object/list/${encodeURIComponent(config.bucket)}`,
      {
        method: "POST",
        body: JSON.stringify({
          prefix: "images",
          limit: 1000,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        }),
      },
    );
    return objects
      .filter((o) => o.id)
      .map((o) => ({
        name: o.name,
        path: `images/${o.name}`,
        url: mediaUrl(`images/${o.name}`),
        size: o.metadata?.size || 0,
        createdAt: o.created_at,
      }));
  },
  async upload(path: string, body: Buffer, contentType: string) {
    await supabase(
      `/storage/v1/object/${encodeURIComponent(config.bucket)}/${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "max-age=31536000",
        },
        body: new Uint8Array(body),
      },
    );
    return { url: mediaUrl(path), path };
  },
  async removeMedia(name: string) {
    if (!/^[a-f0-9-]+\.webp$/.test(name))
      throw new ApiError(400, "Invalid image name.");
    const path = `images/${name}`;
    if ((await this.entries()).some((e) => e.imageUrl === mediaUrl(path)))
      throw new ApiError(
        409,
        "This image is used by an experience. Remove it from that experience first.",
      );
    await supabase(`/storage/v1/object/${encodeURIComponent(config.bucket)}`, {
      method: "DELETE",
      body: JSON.stringify({ prefixes: [path] }),
    });
  },
};
