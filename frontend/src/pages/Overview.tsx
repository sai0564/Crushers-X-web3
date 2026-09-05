import { Icon } from "../components/Icon";
import { StatusBadge } from "../components/StatusBadge";

interface OverviewProps {
  onNavigate: (page: "issuer" | "verify" | "wallet") => void;
}

export function Overview({ onNavigate }: OverviewProps) {
  return (
    <div className="page overview-page">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow eyebrow--accent"><Icon name="shield" /> Verifiable credential infrastructure</span>
          <h1>Credentials you can verify.<br />Trust you don&apos;t have to assume.</h1>
          <p className="hero-copy__lede">Issue tamper-evident credentials that stay tied to their holder&apos;s wallet. Anyone can independently check their authenticity and current status on-chain.</p>
          <div className="hero-actions">
            <button className="button button--primary" onClick={() => onNavigate("verify")}>Verify a certificate <Icon name="arrowRight" /></button>
            <button className="button button--secondary" onClick={() => onNavigate("issuer")}><Icon name="plus" /> Issue certificate</button>
          </div>
          <div className="hero-path" aria-label="Issue, own, verify">
            <span><Icon name="plus" /> Issue</span><i aria-hidden="true" />
            <span><Icon name="wallet" /> Own</span><i aria-hidden="true" />
            <span><Icon name="shield" /> Verify</span>
          </div>
        </div>
        <aside className="hero-preview" aria-label="Illustrative certificate preview">
          <div className="hero-preview__glow" />
          <div className="preview-card">
            <div className="preview-card__top"><span className="preview-seal"><Icon name="shield" /></span><span>Credence Protocol</span><StatusBadge status="VALID" /></div>
            <div className="preview-card__body"><span className="eyebrow">Credential record</span><h2>Blockchain Foundations</h2><p>Issued to a recipient wallet and anchored to the Sepolia network.</p></div>
            <div className="preview-card__bottom"><span><small>Credential type</small>Soulbound</span><span><small>Status</small>On-chain record</span></div>
          </div>
          <p className="preview-caption">Illustrative credential preview — verification always reads live on-chain data.</p>
        </aside>
      </section>
      <section className="explainers" aria-label="Product principles">
        <article className="explain-card"><span className="explain-card__icon"><Icon name="network" /></span><h2>Publicly verifiable</h2><p>Verification reads the credential&apos;s on-chain record. No account or wallet connection is required.</p></article>
        <article className="explain-card"><span className="explain-card__icon"><Icon name="wallet" /></span><h2>Bound to its holder</h2><p>Credentials are soulbound: they are permanently tied to the recipient wallet and cannot be transferred.</p></article>
        <article className="explain-card"><span className="explain-card__icon"><Icon name="shield" /></span><h2>Status you can trust</h2><p>When a credential is revoked, the original on-chain record remains visible with its current status.</p></article>
      </section>
      <section className="how-it-works">
        <div><span className="eyebrow eyebrow--accent">Simple by design</span><h2>From issuance to independent proof.</h2></div>
        <ol className="steps-list">
          <li><span>01</span><div><h3>An institution issues a credential</h3><p>Authorized issuers create a signed on-chain credential for a recipient wallet.</p></div></li>
          <li><span>02</span><div><h3>It stays with the recipient</h3><p>The credential is non-transferable, establishing a durable link to its holder.</p></div></li>
          <li><span>03</span><div><h3>Anyone can verify authenticity</h3><p>Enter the certificate ID to see its issuer, record, and current verification status.</p></div></li>
        </ol>
      </section>
    </div>
  );
}
