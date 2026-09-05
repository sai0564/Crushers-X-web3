import { BrowserProvider, JsonRpcSigner, Contract, JsonRpcProvider } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS, CHAIN_ID } from "../config/contract";

/**
 * Get the browser-based provider from MetaMask.
 */
export function getBrowserProvider(): BrowserProvider {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  return new BrowserProvider(window.ethereum);
}

/**
 * Get the connected signer (the user's wallet).
 */
export async function getSigner(address?: string): Promise<JsonRpcSigner> {
  const provider = getBrowserProvider();
  const targetAddress =
    address ||
    (typeof window !== "undefined" && (window.ethereum as { selectedAddress?: string } | undefined)?.selectedAddress) ||
    undefined;
  return provider.getSigner(targetAddress);
}

/**
 * Get a read-only contract instance (no signer needed).
 * Falls back to JsonRpcProvider if MetaMask is not present.
 */
export function getReadOnlyContract(rpcUrl?: string): Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set VITE_CONTRACT_ADDRESS.");
  }
  let provider;
  if (rpcUrl) {
    provider = new JsonRpcProvider(rpcUrl);
  } else if (typeof window !== "undefined" && window.ethereum) {
    provider = new BrowserProvider(window.ethereum);
  } else {
    const fallbackRpc =
      (import.meta.env.VITE_RPC_URL as string | undefined) ||
      (CHAIN_ID === 31337 ? "http://127.0.0.1:8545" : "https://ethereum-sepolia-rpc.publicnode.com");
    provider = new JsonRpcProvider(fallbackRpc);
  }
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Get a read-write contract instance connected to the user's signer.
 */
export async function getSignedContract(): Promise<Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set VITE_CONTRACT_ADDRESS.");
  }
  const signer = await getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Get the current connected chain ID.
 */
export async function getChainId(): Promise<number> {
  const provider = getBrowserProvider();
  const network = await provider.getNetwork();
  return Number(network.chainId);
}
