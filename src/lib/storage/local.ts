import { promises as fs } from "fs";
import path from "path";
import type { StorageDriver } from "./index";

/**
 * Filesystem-backed storage for local development. Swap STORAGE_DRIVER=azure
 * to use Azure Blob Storage in every other environment without touching
 * calling code — everything goes through the StorageDriver interface.
 */
export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly rootDir: string) {}

  private resolve(key: string) {
    const safeKey = key.replace(/^\/+/, "");
    return path.join(process.cwd(), this.rootDir, safeKey);
  }

  async put(key: string, bytes: Uint8Array | Buffer, _contentType: string): Promise<string> {
    const filePath = this.resolve(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, bytes);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }
}
