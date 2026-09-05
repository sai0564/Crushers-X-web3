import type { CertificateData } from "../services/certificates";
import type { CertificateMetadata } from "../ipfs/types";
import { formatIssuedDate, shortenAddress } from "../utils/display";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";

interface CertificateCardProps {
  certificate: CertificateData;
  metadata?: CertificateMetadata | null;
  onOpen?: () => void;
  compact?: boolean;
}

/** A real-credential styled card shared by verification, lookup, and issue success flows. */
export function CertificateCard({ certificate, metadata, onOpen, compact = false }: CertificateCardProps) {
  const credentialName = metadata?.course || metadata?.name || "On-chain credential";
  const student = metadata?.student || shortenAddress(certificate.student);
  const issuer = metadata?.issuer || shortenAddress(certificate.issuer);
  const status = certificate.revoked ? "REVOKED" : "VALID";
  const content = (
    <>
      <div className="credential-card__topline">
        <span className="credential-card__mark"><Icon name="shield" /></span>
        <span className="credential-card__issuer">{issuer}</span>
        <StatusBadge status={status} />
      </div>
      <div className="credential-card__body">
        <span className="eyebrow">Digital credential</span>
        <h3>{credentialName}</h3>
        <p className="credential-card__recipient">Awarded to <strong>{student}</strong></p>
      </div>
      <div className="credential-card__footer">
        <span><small>Certificate</small>#{certificate.tokenId}</span>
        <span><small>Issued</small>{formatIssuedDate(certificate.issuedAt)}</span>
        {!compact && <span className="credential-card__open">View details <Icon name="arrowRight" /></span>}
      </div>
    </>
  );

  if (onOpen) {
    return <button type="button" className="credential-card credential-card--action" onClick={onOpen} aria-label={`View details for certificate ${certificate.tokenId}`}>{content}</button>;
  }
  return <article className="credential-card">{content}</article>;
}
