import type { IPFSService, CertificateMetadata } from "./types";

/**
 * ⚠️ DEVELOPMENT-ONLY IPFS mock.
 *
 * Stores metadata in localStorage. NOT production IPFS.
 * Use this when no real IPFS credentials are available.
 * Returns URIs like: ipfs://mock-<hash>
 */
export class MockIPFSService implements IPFSService {
  private readonly STORAGE_KEY = "sbc_mock_ipfs_";

  async uploadMetadata(metadata: CertificateMetadata): Promise<string> {
    const json = JSON.stringify(metadata);
    // Generate a deterministic-ish hash
    const hash = "mock-" + this.simpleHash(json);
    const uri = `ipfs://${hash}`;

    localStorage.setItem(this.STORAGE_KEY + hash, json);
    console.log("[MockIPFS] Stored metadata:", uri);
    return uri;
  }

  async fetchMetadata(uri: string): Promise<CertificateMetadata> {
    const hash = uri.replace("ipfs://", "");
    const stored = localStorage.getItem(this.STORAGE_KEY + hash);

    if (!stored) {
      throw new Error(`[MockIPFS] Metadata not found for URI: ${uri}`);
    }

    return JSON.parse(stored) as CertificateMetadata;
  }

  /**
   * Simple string hash for generating mock CIDs.
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36) + Date.now().toString(36);
  }
}
