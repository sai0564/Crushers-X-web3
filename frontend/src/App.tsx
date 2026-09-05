import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { IssuerPanel } from "./pages/IssuerPanel";
import { VerificationPanel } from "./pages/VerificationPanel";
import { WalletLookup } from "./pages/WalletLookup";
import { CONTRACT_ADDRESS, CHAIN_ID } from "./config/contract";
import "./App.css";

type Tab = "issuer" | "verify" | "wallet";

function App() {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("issuer");

  return (
    <div className="app">
      <header>
        <h1>Soulbound Certificate dApp — Test UI</h1>
        <p style={{ fontSize: "12px", color: "#888" }}>
          Contract: <code>{CONTRACT_ADDRESS || "NOT CONFIGURED"}</code> | Chain: <code>{CHAIN_ID}</code>
        </p>

        {!wallet.isConnected ? (
          <button onClick={wallet.connect} disabled={wallet.isConnecting}>
            {wallet.isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        ) : (
          <div style={{ fontSize: "14px" }}>
            <span style={{ color: "#0f0" }}>●</span> Connected:{" "}
            <code>{wallet.address}</code> ({wallet.chainName})
          </div>
        )}

        {wallet.error && <p style={{ color: "red" }}>{wallet.error}</p>}
      </header>

      <nav className="tabs">
        <button className={activeTab === "issuer" ? "active" : ""} onClick={() => setActiveTab("issuer")}>
          Issuer Panel
        </button>
        <button className={activeTab === "verify" ? "active" : ""} onClick={() => setActiveTab("verify")}>
          Verify Certificate
        </button>
        <button className={activeTab === "wallet" ? "active" : ""} onClick={() => setActiveTab("wallet")}>
          Wallet Lookup
        </button>
      </nav>

      <main>
        {activeTab === "issuer" && <IssuerPanel address={wallet.address} />}
        {activeTab === "verify" && <VerificationPanel />}
        {activeTab === "wallet" && <WalletLookup />}
      </main>
    </div>
  );
}

export default App;
