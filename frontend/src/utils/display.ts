import { CHAIN_ID, CONTRACT_ADDRESS } from "../config/contract";

export function shortenAddress(value: string, start = 6, end = 4): string {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function formatIssuedDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export function explorerUrl(tokenId?: number): string | null {
  if (CHAIN_ID !== 11155111 || !CONTRACT_ADDRESS) return null;
  const suffix = tokenId ? `?a=${tokenId}` : "";
  return `https://sepolia.etherscan.io/token/${CONTRACT_ADDRESS}${suffix}`;
}

export function humanizeError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error || "");
  const normal = message.toLowerCase();

  if (normal.includes("user rejected") || normal.includes("user denied") || normal.includes("action_rejected")) {
    return "The request was declined in your wallet. No changes were made.";
  }
  if (normal.includes("metamask") && normal.includes("not installed")) {
    return "MetaMask is required to connect and issue credentials.";
  }
  if (normal.includes("insufficient funds")) {
    return "This wallet does not have enough ETH to pay the network fee.";
  }
  if (normal.includes("unauthorized") || normal.includes("not authorized")) {
    return "This wallet is not authorized to perform that issuer action.";
  }
  if (normal.includes("invalid argument") || normal.includes("invalid address")) {
    return "Enter a valid wallet address and try again.";
  }
  if (normal.includes("network") || normal.includes("chain")) {
    return "Connect your wallet to the expected network and try again.";
  }
  return fallback;
}
