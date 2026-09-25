import { createHash, createHmac } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StorageConfig, StorageProvider, StorageUploadResult } from './types';

/**
 * S3 uyumlu nesne depolama (Cloudflare R2) için saf TypeScript AWS SigV4
 * imzalayıcı. aws-sdk bağımlılığı yok — `architecture.md`'nin "tabloda
 * olmayan paket eklenmez" kuralına uyar ve bundle'ı şişirmez.
 */

export function getStorageConfig(): StorageConfig {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET?.trim() || 'drmuratirmak-media';
  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');

  const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey && bucketName);

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl:
      publicBaseUrl || (accountId ? `https://pub-${accountId.slice(0, 8)}.r2.dev` : ''),
    isConfigured,
  };
}

class AwsSigV4 {
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly region: string;
  private readonly service: string;

  constructor(accessKeyId: string, secretAccessKey: string, region = 'auto', service = 's3') {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
    this.service = service;
  }

  private getSignatureKey(dateStamp: string): Buffer {
    const kDate = createHmac('sha256', 'AWS4' + this.secretAccessKey)
      .update(dateStamp, 'utf8')
      .digest();
    const kRegion = createHmac('sha256', kDate).update(this.region, 'utf8').digest();
    const kService = createHmac('sha256', kRegion).update(this.service, 'utf8').digest();
    return createHmac('sha256', kService).update('aws4_request', 'utf8').digest();
  }

  signHeaders(options: {
    method: string;
    url: URL;
    headers: Record<string, string>;
    payloadHash: string;
    datetime: string;
  }): Record<string, string> {
    const { method, url, headers, payloadHash, datetime } = options;
    const dateStamp = datetime.slice(0, 8);

    const canonicalHeaders: Record<string, string> = {
      ...headers,
      host: url.host,
      'x-amz-date': datetime,
      'x-amz-content-sha256': payloadHash,
    };
    const signedHeaderNames = Object.keys(canonicalHeaders).sort();
    const canonicalHeaderBlock = signedHeaderNames
      .map((name) => `${name}:${canonicalHeaders[name]}\n`)
      .join('');
    const signedHeaders = signedHeaderNames.join(';');

    const canonicalRequest = [
      method,
      url.pathname,
      url.search.replace(/^\?/, ''),
      canonicalHeaderBlock,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      datetime,
      credentialScope,
      createHash('sha256').update(canonicalRequest, 'utf8').digest('hex'),
    ].join('\n');

    const signature = createHmac('sha256', this.getSignatureKey(dateStamp))
      .update(stringToSign, 'utf8')
      .digest('hex');

    return {
      ...headers,
      'x-amz-date': datetime,
      'x-amz-content-sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };
  }
}

export class R2StorageProvider implements StorageProvider {
  private readonly config: StorageConfig;
  private readonly signer: AwsSigV4;
  private readonly endpoint: string;

  constructor(config: StorageConfig) {
    if (
      !config.accountId ||
      !config.accessKeyId ||
      !config.secretAccessKey ||
      !config.bucketName
    ) {
      throw new Error('R2StorageProvider accountId, accessKeyId, secretAccessKey ve bucketName ister');
    }
    this.config = config;
    this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
    this.signer = new AwsSigV4(config.accessKeyId, config.secretAccessKey, 'auto', 's3');
  }

  getPublicUrl(objectKey: string): string {
    const cleanKey = objectKey.replace(/^\/+/, '');
    if (this.config.publicBaseUrl) return `${this.config.publicBaseUrl}/${cleanKey}`;
    return `https://${this.config.bucketName}.${this.config.accountId}.r2.cloudflarestorage.com/${cleanKey}`;
  }

  async upload(input: {
    objectKey: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StorageUploadResult> {
    const cleanKey = input.objectKey.replace(/^\/+/, '');
    const url = new URL(`/${this.config.bucketName}/${cleanKey}`, this.endpoint);
    const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const payloadHash = createHash('sha256').update(input.buffer).digest('hex');

    const headers = this.signer.signHeaders({
      method: 'PUT',
      url,
      headers: {
        'content-type': input.mimeType,
        'content-length': input.buffer.length.toString(),
      },
      payloadHash,
      datetime,
    });

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers,
      body: new Uint8Array(input.buffer),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'bilinmeyen hata');
      throw new Error(`R2 yüklemesi HTTP ${response.status} ile başarısız: ${errorText.slice(0, 200)}`);
    }

    return { objectKey: cleanKey, url: this.getPublicUrl(cleanKey) };
  }

  async delete(objectKey: string): Promise<boolean> {
    const cleanKey = objectKey.replace(/^\/+/, '');
    const url = new URL(`/${this.config.bucketName}/${cleanKey}`, this.endpoint);
    const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const payloadHash = createHash('sha256').update('').digest('hex');
    const headers = this.signer.signHeaders({
      method: 'DELETE',
      url,
      headers: {},
      payloadHash,
      datetime,
    });
    const response = await fetch(url.toString(), { method: 'DELETE', headers });
    return response.ok || response.status === 404;
  }
}

/**
 * R2 yapılandırılmamışken devreye giren geliştirme sağlayıcısı: dosyayı
 * `public/uploads/` altına yazar ve normal statik dosya olarak servis eder.
 * Üretimde dosya sistemi salt okunur olduğundan orada R2 zorunludur.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  /**
   * Nesne anahtarı zaten `uploads/…` ile başlar (bkz. `generateObjectKey`);
   * kök dizin bu yüzden `public`, statik adres de anahtarın kendisidir.
   * Kökü `public/uploads` yapmak yolu `uploads/uploads/…` hâline getirirdi.
   */
  private readonly rootDir = path.join(process.cwd(), 'public');

  getPublicUrl(objectKey: string): string {
    return `/${objectKey.replace(/^\/+/, '')}`;
  }

  async upload(input: {
    objectKey: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StorageUploadResult> {
    const cleanKey = input.objectKey.replace(/^\/+/, '');
    const target = path.join(this.rootDir, cleanKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.buffer);
    return { objectKey: cleanKey, url: this.getPublicUrl(cleanKey) };
  }

  async delete(objectKey: string): Promise<boolean> {
    try {
      await unlink(path.join(this.rootDir, objectKey.replace(/^\/+/, '')));
      return true;
    } catch {
      return false;
    }
  }
}

const globalForStorage = globalThis as unknown as { clinicStorageProvider?: StorageProvider };

export function getStorageProvider(): StorageProvider {
  if (globalForStorage.clinicStorageProvider) return globalForStorage.clinicStorageProvider;
  const config = getStorageConfig();
  globalForStorage.clinicStorageProvider = config.isConfigured
    ? new R2StorageProvider(config)
    : new LocalDiskStorageProvider();
  return globalForStorage.clinicStorageProvider;
}
