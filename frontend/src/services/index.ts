/**
 * Web3 Service Layer — Unified Export Entry Point
 *
 * This layer completely encapsulates blockchain and IPFS logic.
 * The frontend UI can be rebuilt or redesigned without changing any of these functions.
 */

// Contract & Provider
export {
  getBrowserProvider,
  getSigner,
  getReadOnlyContract,
  getSignedContract,
  getChainId,
} from "./contract";

// Issuer Management
export {
  isAuthorizedIssuer,
  addIssuer,
  removeIssuer,
} from "./issuer";

// Certificates (Minting, Revocation, On-chain reads)
export {
  mintCertificate,
  revokeCertificate,
  getCertificate,
  isCertificateValid,
  getCertificatesByWallet,
  type CertificateData,
} from "./certificates";

// Verification & IPFS resolution
export {
  verifyCertificate,
  verifyWalletCertificates,
  fetchMetadata,
  getCertificateStatus,
  type VerificationResult,
  type VerifiedCertificateRecord,
} from "./verification";
