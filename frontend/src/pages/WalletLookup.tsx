import { isAddress } from "ethers";
import { useState, type FormEvent } from "react";
import { CertificateCard } from "../components/CertificateCard";
import { Icon } from "../components/Icon";
import { StatusBadge } from "../components/StatusBadge";
import { getChainName, CHAIN_ID } from "../config/contract";
import { type VerifiedCertificateRecord, verifyWalletCertificates } from "../services/verification";
import { explorerUrl, formatIssuedDate, shortenAddress } from "../utils/display";

export function WalletLookup() {
  const [walletAddress, setWalletAddress] = useState("");
  const [certificates, setCertificates] = useState<VerifiedCertificateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<VerifiedCertificateRecord | null>(null);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setSearched(false); setCertificates([]); setSelected(null);
    if (!isAddress(walletAddress.trim())) { setError("Enter a valid student wallet address."); return; }
    setLoading(true);
    try {
      setCertificates(await verifyWalletCertificates(walletAddress.trim()));
      setSearched(true);
    } catch {
      setError("We could not retrieve credentials for this wallet. Check the address and network connection, then try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page wallet-page">
      <div className="page-heading page-heading--compact"><div><span className="eyebrow eyebrow--accent"><Icon name="wallet" /> Public credential explorer</span><h1>Explore credentials</h1><p>Discover the on-chain credentials tied to any student wallet.</p></div></div>
      <section className="wallet-search surface-card">
        <div><h2>Look up a recipient wallet</h2><p>We query the contract&apos;s issuance events, then verify the current status of every credential found.</p></div>
        <form onSubmit={handleSearch} noValidate><label className="sr-only" htmlFor="wallet-address">Student wallet address</label><div className="wallet-search__input"><Icon name="wallet" /><input id="wallet-address" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="Enter a wallet address (0x…)" autoComplete="off" aria-invalid={Boolean(error)} /></div><button className="button button--primary" type="submit" disabled={loading}><Icon name="search" />{loading ? "Searching…" : "Explore credentials"}</button></form>
        {error && <p className="form-error" role="alert"><Icon name="warning" />{error}</p>}
      </section>
      {loading && <WalletSkeleton />}
      {searched && certificates.length === 0 && <section className="empty-panel empty-panel--short"><span><Icon name="certificate" /></span><h2>No credentials found</h2><p>This wallet has no certificate issuance events from this contract on {getChainName(CHAIN_ID)}.</p></section>}
      {certificates.length > 0 && <section className="wallet-results"><div className="wallet-results__heading"><div><span className="eyebrow">Wallet records</span><h2>{certificates.length} credential{certificates.length === 1 ? "" : "s"} found</h2><p>{shortenAddress(walletAddress.trim(), 10, 8)} · {getChainName(CHAIN_ID)}</p></div><span className="result-count"><Icon name="shield" /> Current status checked</span></div><div className="credential-grid">{certificates.map((certificate) => <CertificateCard key={certificate.tokenId} certificate={certificate} metadata={certificate.metadata} onOpen={() => setSelected(certificate)} />)}</div></section>}
      {selected && <div className="modal-backdrop" role="presentation"><section className="credential-dialog" role="dialog" aria-modal="true" aria-labelledby="credential-detail-title"><button className="dialog-close" aria-label="Close certificate details" onClick={() => setSelected(null)}><Icon name="close" /></button><span className="eyebrow eyebrow--accent">Credential detail</span><h2 id="credential-detail-title">Certificate #{selected.tokenId}</h2><CertificateCard certificate={selected} metadata={selected.metadata} compact /><dl className="credential-details credential-details--dialog"><div><dt>Status</dt><dd><StatusBadge status={selected.status} /></dd></div><div><dt>Holder wallet</dt><dd><code title={selected.student}>{shortenAddress(selected.student, 10, 8)}</code></dd></div><div><dt>Issuer wallet</dt><dd><code title={selected.issuer}>{shortenAddress(selected.issuer, 10, 8)}</code></dd></div><div><dt>Issued on</dt><dd>{formatIssuedDate(selected.issuedAt)}</dd></div><div><dt>Metadata URI</dt><dd><code title={selected.metadataURI}>{shortenAddress(selected.metadataURI, 16, 10)}</code></dd></div></dl>{explorerUrl(selected.tokenId) && <a className="text-link" href={explorerUrl(selected.tokenId) || undefined} target="_blank" rel="noreferrer">Open certificate on explorer <Icon name="external" /></a>}</section></div>}
    </div>
  );
}

function WalletSkeleton() {
  return <section className="wallet-skeleton" aria-label="Searching wallet credentials" aria-live="polite"><div className="skeleton skeleton--title" /><div className="credential-grid"><div className="skeleton skeleton--credential" /><div className="skeleton skeleton--credential" /></div></section>;
}
