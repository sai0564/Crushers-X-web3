import { getCertificate, isCertificateValid, getCertificatesByWallet, type CertificateData } from "./certificates";
import { getIpfsService } from "../ipfs/ipfs-service";
import type { CertificateMetadata } from "../ipfs/types";

/**
 * Full verification result combining on-chain data + IPFS metadata.
 */
export interface VerificationResult {
  exists: boolean;
  certificate: CertificateData | null;
  metadata: CertificateMetadata | null;
  isValid: boolean;
  status: "VALID" | "REVOKED" | "NOT_FOUND";
}

/**
 * Certificate record with metadata returned when verifying a wallet.
 */
export interface VerifiedCertificateRecord extends CertificateData {
  isValid: boolean;
  status: "VALID" | "REVOKED";
  metadata: CertificateMetadata | null;
}

/**
 * Verify a certificate by token ID.
 * Fetches on-chain data and IPFS metadata.
 */
export async function verifyCertificate(tokenId: number): Promise<VerificationResult> {
  try {
    const certificate = await getCertificate(tokenId);
    const valid = await isCertificateValid(tokenId);

    // Try to fetch IPFS metadata
    let metadata: CertificateMetadata | null = null;
    try {
      const ipfs = getIpfsService();
      metadata = await ipfs.fetchMetadata(certificate.metadataURI);
    } catch {
      // Metadata fetch failed — still return on-chain data
    }

    return {
      exists: true,
      certificate,
      metadata,
      isValid: valid,
      status: certificate.revoked ? "REVOKED" : "VALID",
    };
  } catch {
    return {
      exists: false,
      certificate: null,
      metadata: null,
      isValid: false,
      status: "NOT_FOUND",
    };
  }
}

/**
 * Discover and verify all certificates belonging to a student wallet.
 * Fetches on-chain event records and IPFS metadata for each token.
 */
export async function verifyWalletCertificates(
  studentAddress: string
): Promise<VerifiedCertificateRecord[]> {
  const certs = await getCertificatesByWallet(studentAddress);
  const ipfs = getIpfsService();

  const results: VerifiedCertificateRecord[] = [];
  for (const cert of certs) {
    let metadata: CertificateMetadata | null = null;
    try {
      metadata = await ipfs.fetchMetadata(cert.metadataURI);
    } catch {
      // Metadata fetch failed — still return on-chain data
    }

    results.push({
      ...cert,
      isValid: !cert.revoked,
      status: cert.revoked ? "REVOKED" : "VALID",
      metadata,
    });
  }

  return results;
}

/**
 * Fetch and parse certificate metadata from an IPFS URI.
 */
export async function fetchMetadata(metadataURI: string): Promise<CertificateMetadata> {
  const ipfs = getIpfsService();
  return ipfs.fetchMetadata(metadataURI);
}

/**
 * Get certificate status string.
 */
export function getCertificateStatus(revoked: boolean): "VALID" | "REVOKED" {
  return revoked ? "REVOKED" : "VALID";
}


