export interface StorageDriver {
  /** Persist a document's bytes under a storage key and return that key. */
  put(key: string, bytes: Uint8Array | Buffer, contentType: string): Promise<string>;
  /** Read a document's bytes back out by storage key. */
  get(key: string): Promise<Buffer>;
}

let cached: StorageDriver | null = null;

export function getStorageDriver(): StorageDriver {
  if (cached) return cached;

  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "azure") {
    const { AzureBlobStorageDriver } = require("./azure") as typeof import("./azure");
    cached = new AzureBlobStorageDriver();
  } else {
    const { LocalStorageDriver } = require("./local") as typeof import("./local");
    cached = new LocalStorageDriver(process.env.LOCAL_STORAGE_DIR ?? "./storage/documents");
  }
  return cached;
}
