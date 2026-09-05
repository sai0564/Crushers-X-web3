import { getSignedContract, getReadOnlyContract } from "./contract";

/**
 * Check if an address is an authorized issuer.
 */
export async function isAuthorizedIssuer(address: string): Promise<boolean> {
  const contract = getReadOnlyContract();
  return contract.isAuthorizedIssuer(address);
}

/**
 * Add an authorized issuer (owner only).
 */
export async function addIssuer(issuerAddress: string): Promise<{
  hash: string;
  wait: () => Promise<unknown>;
}> {
  const contract = await getSignedContract();
  const tx = await contract.addIssuer(issuerAddress);
  return { hash: tx.hash, wait: () => tx.wait() };
}

/**
 * Remove an authorized issuer (owner only).
 */
export async function removeIssuer(issuerAddress: string): Promise<{
  hash: string;
  wait: () => Promise<unknown>;
}> {
  const contract = await getSignedContract();
  const tx = await contract.removeIssuer(issuerAddress);
  return { hash: tx.hash, wait: () => tx.wait() };
}
