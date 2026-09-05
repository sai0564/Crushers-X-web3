/**
 * Certificate metadata schema stored on IPFS.
 */
export interface CertificateMetadata {
  name: string;
  description: string;
  student: string;
  course: string;
  date: string;
  issuer: string;
  certificateId: string;
}

/**
 * IPFS service interface.
 * Implementations: MockIPFSService (dev), PinataIPFSService (production).
 */
export interface IPFSService {
  /**
   * Upload metadata to IPFS.
   * @returns IPFS URI (e.g. "ipfs://Qm...")
   */
  uploadMetadata(metadata: CertificateMetadata): Promise<string>;

  /**
   * Fetch metadata from an IPFS URI.
   */
  fetchMetadata(uri: string): Promise<CertificateMetadata>;
}
