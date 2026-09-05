import type { IPFSService, CertificateMetadata } from "./types";

/**
 * Real IPFS service using Pinata API.
 * Requires VITE_IPFS_API_KEY and VITE_IPFS_API_SECRET env vars.
 */
export class PinataIPFSService implements IPFSService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly gatewayUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_IPFS_API_KEY || "";
    this.apiSecret = import.meta.env.VITE_IPFS_API_SECRET || "";
    this.gatewayUrl =
      import.meta.env.VITE_IPFS_GATEWAY_URL ||
      "https://gateway.pinata.cloud/ipfs/";

    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
        "Pinata credentials not configured. Set VITE_IPFS_API_KEY and VITE_IPFS_API_SECRET."
      );
    }
  }

  async uploadMetadata(metadata: CertificateMetadata): Promise<string> {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.apiSecret,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `certificate-${metadata.certificateId}`,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pinata upload failed: ${err}`);
    }

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  }

  async fetchMetadata(uri: string): Promise<CertificateMetadata> {
    const cid = uri.replace("ipfs://", "");
    const url = `${this.gatewayUrl}${cid}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata from IPFS: ${response.statusText}`);
    }

    return response.json() as Promise<CertificateMetadata>;
  }
}
