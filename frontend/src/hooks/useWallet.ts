import { useState, useCallback, useEffect } from "react";
import { getBrowserProvider, getChainId } from "../services/contract";
import { CHAIN_ID, getChainName } from "../config/contract";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  chainName: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSwitching: boolean;
}

function getSelectedAccount(accounts: string[]): string | null {
  if (!accounts || accounts.length === 0) return null;
  const selected = (window.ethereum as { selectedAddress?: string } | undefined)?.selectedAddress;
  if (selected) {
    const match = accounts.find((a) => a.toLowerCase() === selected.toLowerCase());
    if (match) return match;
  }
  return accounts[0];
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    chainName: "",
    isConnected: false,
    isConnecting: false,
    error: null,
    isSwitching: false,
  });

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const provider = getBrowserProvider();
      let accounts = await provider.send("eth_requestAccounts", []);

      // If MetaMask is currently switched to an account not yet authorized, prompt permissions
      const selected = (window.ethereum as { selectedAddress?: string } | undefined)?.selectedAddress;
      if (selected && !accounts.some((a: string) => a.toLowerCase() === selected.toLowerCase())) {
        try {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
          accounts = await provider.send("eth_accounts", []);
        } catch {
          // If user rejects permission dialog, proceed with available accounts
        }
      }

      const activeAccount = getSelectedAccount(accounts);
      if (!activeAccount) {
        throw new Error("No accounts found");
      }

      const chainId = await getChainId();

      setState({
        address: activeAccount,
        chainId,
        chainName: getChainName(chainId),
        isConnected: true,
        isConnecting: false,
        error: null,
        isSwitching: false,
      });
    } catch (err: unknown) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const switchToExpectedNetwork = useCallback(async () => {
    setState((s) => ({ ...s, isSwitching: true, error: null }));
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed");
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
      const chainId = await getChainId();
      setState((s) => ({
        ...s,
        chainId,
        chainName: getChainName(chainId),
        isSwitching: false,
      }));
    } catch (err: unknown) {
      setState((s) => ({
        ...s,
        isSwitching: false,
        error: err instanceof Error ? err.message : "Unable to switch networks",
      }));
    }
  }, []);

  // Listen for account/chain changes and check active session on mount
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = (args[0] as string[]) || [];
      const activeAccount = getSelectedAccount(accounts);

      if (!activeAccount) {
        setState({
          address: null,
          chainId: null,
          chainName: "",
          isConnected: false,
          isConnecting: false,
          error: null,
          isSwitching: false,
        });
      } else {
        const chainId = await getChainId().catch(() => null);
        setState((s) => ({
          ...s,
          address: activeAccount,
          chainId: chainId ?? s.chainId,
          chainName: chainId ? getChainName(chainId) : s.chainName,
          isConnected: true,
          isConnecting: false,
          error: null,
          isSwitching: false,
        }));
      }
    };

    const handleChainChanged = () => {
      // Reload on chain change for safety
      window.location.reload();
    };

    // Auto-detect currently connected account on mount
    const provider = getBrowserProvider();
    provider
      .send("eth_accounts", [])
      .then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          handleAccountsChanged(accounts);
        }
      })
      .catch(() => {});

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return { ...state, connect, switchToExpectedNetwork, isWrongNetwork: state.chainId !== null && state.chainId !== CHAIN_ID };
}
