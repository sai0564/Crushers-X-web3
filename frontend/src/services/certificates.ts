import { getAddress } from "ethers";
import { START_BLOCK } from "../config/contract";
import { getSignedContract, getReadOnlyContract } from "./contract";

const MAX_EVENT_QUERY_RANGE = 10_000;

/**
 * Certificate data returned from the contract.
 */
export interface CertificateData {
  tokenId: number;
  student: string;
  metadataURI: string;
  issuer: string;
  issuedAt: number;
  revoked: boolean;
}

/**
 * Mint a new soulbound certificate.
 * Returns the transaction hash and a function to wait for confirmation + extract tokenId.
 */
export async function mintCertificate(
  studentAddress: string,
  metadataURI: string
): Promise<{
  hash: string;
  waitForTokenId: () => Promise<number>;
}> {
  const contract = await getSignedContract();
  const tx = await contract.mintCertificate(studentAddress, metadataURI);

  return {
    hash: tx.hash,
    waitForTokenId: async () => {
      const receipt = await tx.wait();
      // Parse CertificateIssued event from the receipt
      const iface = contract.interface;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsed && parsed.name === "CertificateIssued") {
            return Number(parsed.args.tokenId);
          }
        } catch {
          // Not our event, skip
        }
      }
      throw new Error("CertificateIssued event not found in transaction logs");
    },
  };
}

/**
 * Revoke a certificate (issuer only).
 */
export async function revokeCertificate(tokenId: number): Promise<{
  hash: string;
  wait: () => Promise<unknown>;
}> {
  const contract = await getSignedContract();
  const tx = await contract.revokeCertificate(tokenId);
  return { hash: tx.hash, wait: () => tx.wait() };
}

/**
 * Get certificate data by token ID.
 */
export async function getCertificate(tokenId: number): Promise<CertificateData> {
  const contract = getReadOnlyContract();
  const result = await contract.getCertificate(tokenId);
  return {
    tokenId,
    student: result.student,
    metadataURI: result.metadataURI,
    issuer: result.issuer,
    issuedAt: Number(result.issuedAt),
    revoked: result.revoked,
  };
}

/**
 * Check if a certificate is valid (exists and not revoked).
 */
export async function isCertificateValid(tokenId: number): Promise<boolean> {
  const contract = getReadOnlyContract();
  return contract.isCertificateValid(tokenId);
}

async function getCertificateIssuedEvents(
  contract: ReturnType<typeof getReadOnlyContract>,
  studentAddress: string
) {
  const provider = contract.runner?.provider;
  if (!provider) throw new Error("Contract provider is not available");

  const latestBlock = await provider.getBlockNumber();
  if (latestBlock < START_BLOCK) return [];

  const filter = contract.filters.CertificateIssued(null, studentAddress, null);
  const events = [];

  for (
    let fromBlock = START_BLOCK;
    fromBlock <= latestBlock;
    fromBlock += MAX_EVENT_QUERY_RANGE
  ) {
    const toBlock = Math.min(
      fromBlock + MAX_EVENT_QUERY_RANGE - 1,
      latestBlock
    );
    events.push(...(await contract.queryFilter(filter, fromBlock, toBlock)));
  }

  const uniqueEvents = new Map<string, (typeof events)[number]>();
  for (const event of events) {
    uniqueEvents.set(`${event.transactionHash}:${event.index}`, event);
  }

  return [...uniqueEvents.values()];
}

/**
 * Get all certificates belonging to a student wallet by querying CertificateIssued events.
 * This avoids scanning arbitrary token ID ranges.
 */
export async function getCertificatesByWallet(
  studentAddress: string
): Promise<CertificateData[]> {
  const contract = getReadOnlyContract();
  const normalizedStudentAddress = getAddress(studentAddress.trim());

  // Query CertificateIssued events in provider-safe chunks filtered by student address
  const events = await getCertificateIssuedEvents(contract, normalizedStudentAddress);

  const certificates: CertificateData[] = [];

  for (const event of events) {
    const parsed = contract.interface.parseLog({
      topics: [...event.topics],
      data: event.data,
    });
    if (!parsed) continue;

    const tokenId = Number(parsed.args.tokenId);

    try {
      const cert = await getCertificate(tokenId);
      certificates.push(cert);
    } catch {
      // Token might have been burned or other issue — skip
    }
  }

  return certificates;
}
