import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { toFile } from "qrcode";

export interface JobRequest {
  brand: string;
  model: string;
  options?: Record<string, unknown>;
}

export interface JobManifest {
  id: string;
  dir: string;
  createdAt: string;
  brand: string;
  model: string;
  options?: Record<string, unknown>;
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "").toUpperCase();
}

export async function initJobFolder(baseDir: string, request: JobRequest): Promise<JobManifest> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const id = `${timestamp}_${normalize(request.brand)}_${normalize(request.model)}`;
  const dir = join(baseDir, id);
  await mkdir(dir, { recursive: true });

  const manifest: JobManifest = {
    id,
    dir,
    createdAt: new Date().toISOString(),
    brand: request.brand,
    model: request.model,
    options: request.options
  };

  await writeFile(join(dir, "job.json"), JSON.stringify(manifest, null, 2), "utf8");
  await toFile(join(dir, "qr.png"), JSON.stringify({ id }), { margin: 1, width: 256 });

  return manifest;
}
