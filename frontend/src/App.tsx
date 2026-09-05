import { useState } from "react";
import { Icon } from "./components/Icon";
import { CHAIN_ID, getChainName } from "./config/contract";
import { useWallet } from "./hooks/useWallet";
import { IssuerPanel } from "./pages/IssuerPanel";
import { Overview } from "./pages/Overview";
import { VerificationPanel } from "./pages/VerificationPanel";
import { WalletLookup } from "./pages/WalletLookup";
import { shortenAddress } from "./utils/display";
import "./App.css";

type Tab = "overview" | "issuer" | "verify" | "wallet";

const navigation: { id: Tab; label: string; icon: "network" | "plus" | "search" | "wallet" }[] = [
  { id: "overview", label: "Overview", icon: "network" },
  { id: "issuer", label: "Issue certificate", icon: "plus" },
  { id: "verify", label: "Verify certificate", icon: "search" },
  { id: "wallet", label: "Wallet lookup", icon: "wallet" },
];

function App() {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = (tab: Tab) => { setActiveTab(tab); setMobileNavOpen(false); };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar--open" : ""}`} aria-label="Primary navigation">
        <div className="sidebar__brand"><span className="brand-mark"><Icon name="shield" /></span><span>Credence</span></div>
        <p className="sidebar__eyebrow">Credential network</p>
        <nav className="sidebar__nav">
          {navigation.map((item) => <button key={item.id} className={`nav-item ${activeTab === item.id ? "nav-item--active" : ""}`} onClick={() => navigate(item.id)}><Icon name={item.icon} />{item.label}</button>)}
        </nav>
        <div className="sidebar__foot"><div className="network-status"><span className="network-status__dot" /><span><small>Network</small>{getChainName(CHAIN_ID)}</span></div><p>On-chain credentials, independently verifiable.</p></div>
      </aside>
      {mobileNavOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <div className="app-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Icon name="menu" /></button>
          <div className="topbar__network"><span className="network-status__dot" />{getChainName(CHAIN_ID)}</div>
          <div className="topbar__wallet">
            {!wallet.isConnected ? <button className="button button--dark" onClick={wallet.connect} disabled={wallet.isConnecting}><Icon name="wallet" />{wallet.isConnecting ? "Connecting…" : "Connect wallet"}</button>
              : wallet.isWrongNetwork ? <button className="button button--warning" onClick={wallet.switchToExpectedNetwork} disabled={wallet.isSwitching}><Icon name="warning" />{wallet.isSwitching ? "Switching…" : `Switch to ${getChainName(CHAIN_ID).replace(" Testnet", "")}`}</button>
                : <div className="connected-wallet" title={wallet.address || undefined}><span><Icon name="wallet" /></span>{wallet.address && shortenAddress(wallet.address)}</div>}
          </div>
        </header>
        {wallet.error && <div className="global-alert" role="alert"><Icon name="warning" />{wallet.error}</div>}
        <main className="main-content">
          {activeTab === "overview" && <Overview onNavigate={navigate} />}
          {activeTab === "issuer" && <IssuerPanel address={wallet.address} networkReady={!wallet.isWrongNetwork} onNavigate={navigate} />}
          {activeTab === "verify" && <VerificationPanel />}
          {activeTab === "wallet" && <WalletLookup />}
        </main>
      </div>
    </div>
  );
}

export default App;
