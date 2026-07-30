// File/photo storage abstraction (§3): put/get/delete/url.
//   dev:  local disk under data/uploads/{org_id}/...
//   prod: Cloudflare R2 (S3-compatible, free tier) via aws4fetch, env-gated.
// url() always returns an app-internal path (/api/files/...) so files stay
// behind the passcode and the driver stays swappable.

import fs from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";

export interface Storage {
  put(key: string, data: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Uint8Array; contentType: string } | null>;
  delete(key: string): Promise<void>;
  url(key: string): string;
}

const DISK_ROOT = path.join(process.cwd(), "data", "uploads");

function contentTypeFor(key: string): string {
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

const diskStorage: Storage = {
  async put(key, data) {
    const file = path.join(DISK_ROOT, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
  },
  async get(key) {
    try {
      const data = await fs.readFile(path.join(DISK_ROOT, key));
      return { data: new Uint8Array(data), contentType: contentTypeFor(key) };
    } catch {
      return null;
    }
  },
  async delete(key) {
    await fs.rm(path.join(DISK_ROOT, key), { force: true });
  },
  url(key) {
    return `/api/files/${key}`;
  },
};

function r2Storage(): Storage {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET!;
  const client = new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    region: "auto",
    service: "s3",
  });
  const base = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;

  return {
    async put(key, data, contentType) {
      const res = await client.fetch(`${base}/${key}`, {
        method: "PUT",
        body: data as BodyInit,
        headers: { "Content-Type": contentType },
      });
      if (!res.ok) throw new Error(`R2 put failed: ${res.status}`);
    },
    async get(key) {
      const res = await client.fetch(`${base}/${key}`);
      if (!res.ok) return null;
      return {
        data: new Uint8Array(await res.arrayBuffer()),
        contentType: res.headers.get("content-type") ?? contentTypeFor(key),
      };
    },
    async delete(key) {
      await client.fetch(`${base}/${key}`, { method: "DELETE" });
    },
    url(key) {
      return `/api/files/${key}`;
    },
  };
}

export function getStorage(): Storage {
  if (process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET) return r2Storage();
  return diskStorage;
}
