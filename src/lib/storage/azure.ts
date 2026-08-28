import type { StorageDriver } from "./index";

/**
 * Azure Blob Storage driver. Used in every deployed environment
 * (STORAGE_DRIVER=azure). Requires @azure/storage-blob and either
 * AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME (with a
 * managed identity / DefaultAzureCredential in production).
 */
export class AzureBlobStorageDriver implements StorageDriver {
  private containerClientPromise: Promise<import("@azure/storage-blob").ContainerClient>;

  constructor() {
    this.containerClientPromise = this.init();
  }

  private async init() {
    const { BlobServiceClient } = await import("@azure/storage-blob");
    const containerName = process.env.AZURE_STORAGE_CONTAINER ?? "documents";
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    let serviceClient: import("@azure/storage-blob").BlobServiceClient;
    if (connectionString) {
      serviceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else {
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      if (!accountName) {
        throw new Error(
          "AZURE_STORAGE_ACCOUNT_NAME or AZURE_STORAGE_CONNECTION_STRING is required when STORAGE_DRIVER=azure"
        );
      }
      const { DefaultAzureCredential } = await import("@azure/identity");
      serviceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
      );
    }

    const containerClient = serviceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    return containerClient;
  }

  async put(key: string, bytes: Uint8Array | Buffer, contentType: string): Promise<string> {
    const container = await this.containerClientPromise;
    const blockBlobClient = container.getBlockBlobClient(key);
    await blockBlobClient.uploadData(bytes, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return key;
  }

  async get(key: string): Promise<Buffer> {
    const container = await this.containerClientPromise;
    const blobClient = container.getBlobClient(key);
    const download = await blobClient.download();
    const chunks: Buffer[] = [];
    for await (const chunk of download.readableStreamBody!) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
