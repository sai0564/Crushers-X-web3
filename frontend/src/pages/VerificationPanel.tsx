import { useState, type FormEvent } from "react";
import { CertificateCard } from "../components/CertificateCard";
import { Icon } from "../components/Icon";
import { StatusBadge } from "../components/StatusBadge";
import { CHAIN_ID, getChainName } from "../config/contract";
import { verifyCertificate, type VerificationResult } from "../services/verification";
import { explorerUrl, formatIssuedDate, shortenAddress } from "../utils/display";

export function VerificationPanel() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!/^\d+$/.test(tokenId) || Number(tokenId) < 1) { setError("Enter a positive whole-number certificate ID."); return; }
    setLoading(true);
    try {
      setResult(await verifyCertificate(Number(tokenId)));
    } catch {
      setError("We could not reach the verification network. Please try again in a moment.");
    } finally { setLoading(false); }
  };

  const currentExplorerUrl = result?.certificate ? explorerUrl(result.certificate.tokenId) : null;

  return (
    <div className="page verification-page">
      <section className="verify-hero">
        <span className="verify-hero__seal"><Icon name="shield" /></span>
        <span className="eyebrow eyebrow--accent">Public verification authority</span>
        <h1>Verify a certificate</h1>
        <p>Instantly verify the authenticity and current status of an on-chain credential. No wallet connection is required.</p>
        <form className="verify-search" onSubmit={handleVerify} noValidate>
          <label className="sr-only" htmlFor="certificate-id">Certificate or token ID</label>
          <div className="verify-search__input"><Icon name="search" /><input id="certificate-id" value={tokenId} onChange={(e) => setTokenId(e.target.value)} inputMode="numeric" placeholder="Enter certificate ID" aria-invalid={Boolean(error)} /></div>
          <button className="button button--primary" type="submit" disabled={loading}><Icon name="shield" />{loading ? "Verifying…" : "Verify certificate"}</button>
        </form>
        {error && <p className="form-error verify-hero__error" role="alert"><Icon name="warning" />{error}</p>}
        <p className="verify-hero__note"><Icon name="network" /> Reads the live record on {getChainName(CHAIN_ID)}</p>
      </section>

      {loading && <VerificationSkeleton />}
      {result?.status === "NOT_FOUND" && <section className="not-found-result"><span><Icon name="search" /></span><div><span className="eyebrow">No record found</span><h2>Certificate not found</h2><p>We couldn&apos;t find an on-chain credential with ID #{tokenId}. Check the ID and make sure you&apos;re verifying a certificate issued by this contract.</p><button className="button button--secondary" onClick={() => { setTokenId(""); setResult(null); }}>Try another ID</button></div></section>}

      {result?.certificate && <section className={`verification-result verification-result--${result.status.toLowerCase()}`}>
        <div className="verification-result__header">
          <span className="verification-result__mark"><Icon name={result.status === "VALID" ? "check" : "warning"} /></span>
          <div><span className="eyebrow">Live verification result</span><h2>{result.status === "VALID" ? "VERIFIED" : "REVOKED"}</h2><p>{result.status === "VALID" ? "This credential is authentic and currently valid on-chain." : "This credential was issued on-chain but has been revoked by its original authorized issuer."}</p></div>
          <StatusBadge status={result.status === "REVOKED" ? "REVOKED" : "VALID"}>{result.status === "VALID" ? "Verified on-chain" : "Revoked on-chain"}</StatusBadge>
        </div>
        <div className="verification-result__content">
          <CertificateCard certificate={result.certificate} metadata={result.metadata} compact />
          <dl className="credential-details">
            <div><dt>Certificate ID</dt><dd>#{result.certificate.tokenId}</dd></div>
            <div><dt>Credential holder</dt><dd>{result.metadata?.student || "Metadata unavailable"}</dd></div>
            <div><dt>Recipient wallet</dt><dd><code title={result.certificate.student}>{shortenAddress(result.certificate.student, 10, 8)}</code></dd></div>
            <div><dt>Issuer</dt><dd><code title={result.certificate.issuer}>{shortenAddress(result.certificate.issuer, 10, 8)}</code></dd></div>
            <div><dt>Issued</dt><dd>{formatIssuedDate(result.certificate.issuedAt)}</dd></div>
            <div><dt>IPFS metadata</dt><dd><code title={result.certificate.metadataURI}>{shortenAddress(result.certificate.metadataURI, 14, 8)}</code></dd></div>
            <div><dt>Network</dt><dd>{getChainName(CHAIN_ID)}</dd></div>
          </dl>
        </div>
        <div className="verification-result__foot"><div><Icon name="network" /><span><strong>Verified on {getChainName(CHAIN_ID)}</strong><small>The on-chain record is the source of truth.</small></span></div>{currentExplorerUrl && <a className="button button--secondary" href={currentExplorerUrl} target="_blank" rel="noreferrer">View on explorer <Icon name="external" /></a>}</div>
        {!result.metadata && <p className="metadata-note"><Icon name="warning" />The on-chain credential is available, but its IPFS metadata could not be retrieved. This does not affect its on-chain status.</p>}
      </section>}
    </div>
  );
}

function VerificationSkeleton() {
  return <section className="verification-skeleton" aria-label="Verifying certificate" aria-live="polite"><div className="skeleton skeleton--title" /><div className="skeleton-grid"><div className="skeleton skeleton--card" /><div className="skeleton skeleton--lines" /></div></section>;
}
