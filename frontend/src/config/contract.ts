import contractArtifact from "./SoulboundCertificate.json";

/**
 * Contract ABI — auto-generated from Hardhat compilation.
 * Exported by scripts/export-abi.ts
 */
export const CONTRACT_ABI = contractArtifact.abi;

/**
 * Deployed contract address.
 * Set via VITE_CONTRACT_ADDRESS env var or update this fallback after deployment.
 */
export const CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x6C79bD4669d5f5825f983a663341AE9C576D1215";

/**
 * Expected chain ID.
 * Sepolia = 11155111, Hardhat local = 31337
 */
export const CHAIN_ID: number = Number(
  import.meta.env.VITE_CHAIN_ID || "11155111"
);

/**
 * Starting block for event querying (avoiding block 0 on testnets).
 * Sepolia deployment of 0x6C79bD4669d5f5825f983a663341AE9C576D1215 was at block 11640322.
 */
export const START_BLOCK: number = Number(
  import.meta.env.VITE_START_BLOCK || (CHAIN_ID === 11155111 ? 11640000 : 0)
);

/**
 * Network display names.
 */
export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  31337: "Hardhat Local",
};

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Unknown (${chainId})`;
}
