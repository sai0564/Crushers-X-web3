import type { IPFSService } from "./types";
import { MockIPFSService } from "./mock-ipfs";
import { PinataIPFSService } from "./pinata-ipfs";

let _instance: IPFSService | null = null;

/**
 * Get the IPFS service instance.
 * Automatically uses Pinata if credentials are available,
 * otherwise falls back to the mock implementation.
 */
export function getIpfsService(): IPFSService {
  if (_instance) return _instance;

  const apiKey = import.meta.env.VITE_IPFS_API_KEY;
  const apiSecret = import.meta.env.VITE_IPFS_API_SECRET;

  if (apiKey && apiSecret) {
    console.log("[IPFS] Using Pinata provider");
    _instance = new PinataIPFSService();
  } else {
    console.log("[IPFS] ⚠️ Using MOCK provider (localStorage). NOT production IPFS.");
    _instance = new MockIPFSService();
  }

  return _instance;
}

export type { IPFSService, CertificateMetadata } from "./types";
