import { isAddress } from "ethers";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CertificateCard } from "../components/CertificateCard";
import { Icon } from "../components/Icon";
import { StatusBadge } from "../components/StatusBadge";
import { getChainName, CHAIN_ID } from "../config/contract";
import { getIpfsService } from "../ipfs/ipfs-service";
import { addIssuer, isAuthorizedIssuer, removeIssuer } from "../services/issuer";
import { mintCertificate, revokeCertificate } from "../services/certificates";
import { verifyCertificate, type VerificationResult } from "../services/verification";
import { humanizeError, shortenAddress } from "../utils/display";

interface IssuerPanelProps {
  address: string | null;
  networkReady: boolean;
  onNavigate: (page: "verify") => void;
}

type Activity = {
  phase: "idle" | "confirming" | "pending" | "success" | "error";
  message: string;
  hash?: string;
};

interface MintedCredential {
  tokenId: number;
  student: string;
  course: string;
  metadataURI: string;
  hash: string;
  verification: VerificationResult | null;
}

const today = new Date().toISOString().slice(0, 10);

export function IssuerPanel({ address, networkReady, onNavigate }: IssuerPanelProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [checkingIssuer, setCheckingIssuer] = useState(false);
  const [activity, setActivity] = useState<Activity>({ phase: "idle", message: "" });
  const [formError, setFormError] = useState("");
  const [student, setStudent] = useState("");
  const [studentName, setStudentName] = useState("");
  const [course, setCourse] = useState("");
  const [issuedDate, setIssuedDate] = useState(today);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [minted, setMinted] = useState<MintedCredential | null>(null);
  const [revokeTokenId, setRevokeTokenId] = useState("");
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [issuerAddress, setIssuerAddress] = useState("");

  const refreshAuthorization = useCallback(async () => {
    if (!address || !networkReady) return;
    setCheckingIssuer(true);
    try {
      setAuthorized(await isAuthorizedIssuer(address));
    } catch {
      setAuthorized(false);
      setActivity({ phase: "error", message: "We could not confirm issuer authorization. Check your network connection and try again." });
    } finally {
      setCheckingIssuer(false);
    }
  }, [address, networkReady]);

  useEffect(() => {
    const checkTimer = window.setTimeout(() => void refreshAuthorization(), 0);
    return () => window.clearTimeout(checkTimer);
  }, [refreshAuthorization]);

  const handleMint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setMinted(null);
    if (!isAddress(student.trim())) { setFormError("Enter a valid student wallet address."); return; }
    if (!studentName.trim()) { setFormError("Enter the student name for the credential record."); return; }
    if (!course.trim()) { setFormError("Enter the course or credential name."); return; }
    if (!address || !authorized || !networkReady) return;

    try {
      setActivity({ phase: "confirming", message: "Preparing the credential record, then requesting wallet confirmation…" });
      const metadataURI = await getIpfsService().uploadMetadata({
        name: course.trim(),
        description: description.trim() || "On-chain verifiable educational credential",
        student: studentName.trim(),
        course: course.trim(),
        date: issuedDate,
        issuer: address,
        certificateId: reference.trim() || "Institution reference not provided",
      });
      const result = await mintCertificate(student.trim(), metadataURI);
      setActivity({ phase: "pending", message: "Transaction submitted. Waiting for on-chain confirmation…", hash: result.hash });
      const tokenId = await result.waitForTokenId();
      let verification: VerificationResult | null = null;
      try { verification = await verifyCertificate(tokenId); } catch { /* the confirmed transaction remains the source of truth */ }
      setMinted({ tokenId, student: student.trim(), course: course.trim(), metadataURI, hash: result.hash, verification });
      setActivity({ phase: "success", message: "Certificate issued and confirmed on-chain.", hash: result.hash });
      setStudent(""); setStudentName(""); setCourse(""); setDescription(""); setReference(""); setIssuedDate(today);
    } catch (error: unknown) {
      setActivity({ phase: "error", message: humanizeError(error, "We could not issue this certificate. Nothing was recorded on-chain.") });
    }
  };

  const requestRevoke = () => {
    setFormError("");
    if (!/^\d+$/.test(revokeTokenId) || Number(revokeTokenId) < 1) { setFormError("Enter a valid on-chain certificate ID to revoke."); return; }
    setShowRevokeConfirm(true);
  };

  const handleRevoke = async () => {
    setShowRevokeConfirm(false);
    try {
      setActivity({ phase: "confirming", message: `Confirm revocation of certificate #${revokeTokenId} in your wallet…` });
      const tx = await revokeCertificate(Number(revokeTokenId));
      setActivity({ phase: "pending", message: `Revocation submitted. Waiting for certificate #${revokeTokenId} to update on-chain…`, hash: tx.hash });
      await tx.wait();
      setActivity({ phase: "success", message: `Certificate #${revokeTokenId} is now revoked. Its on-chain record remains publicly visible.`, hash: tx.hash });
      setRevokeTokenId("");
    } catch (error: unknown) {
      setActivity({ phase: "error", message: humanizeError(error, "We could not revoke this certificate. Its status has not changed.") });
    }
  };

  const handleIssuerAdmin = async (operation: "add" | "remove") => {
    if (!isAddress(issuerAddress.trim())) { setFormError("Enter a valid issuer wallet address."); return; }
    try {
      setActivity({ phase: "confirming", message: `Confirm the issuer ${operation === "add" ? "update" : "removal"} in your wallet…` });
      const tx = operation === "add" ? await addIssuer(issuerAddress.trim()) : await removeIssuer(issuerAddress.trim());
      setActivity({ phase: "pending", message: "Issuer update submitted. Waiting for on-chain confirmation…", hash: tx.hash });
      await tx.wait();
      setActivity({ phase: "success", message: `Issuer ${operation === "add" ? "updated" : "removed"} successfully.`, hash: tx.hash });
      setIssuerAddress("");
      void refreshAuthorization();
    } catch (error: unknown) {
      setActivity({ phase: "error", message: humanizeError(error, "We could not update the issuer list. No changes were made.") });
    }
  };

  return (
    <div className="page issuer-page">
      <div className="page-heading">
        <div><span className="eyebrow eyebrow--accent"><Icon name="key" /> Authorized institutions</span><h1>Issuer dashboard</h1><p>Issue a permanent, independently verifiable credential to a student wallet.</p></div>
        <button className="icon-button" onClick={() => void refreshAuthorization()} disabled={!address || checkingIssuer} aria-label="Refresh issuer authorization"><Icon name="refresh" /></button>
      </div>

      <section className="issuer-summary" aria-label="Issuer connection status">
        <div className="issuer-summary__identity"><span className="issuer-summary__icon"><Icon name="wallet" /></span><div><small>Connected wallet</small><strong>{address ? shortenAddress(address) : "No wallet connected"}</strong></div></div>
        <div><small>Network</small><strong>{getChainName(CHAIN_ID)}</strong></div>
        <div><small>Issuer access</small>{!address ? <StatusBadge status="NEUTRAL">Wallet needed</StatusBadge> : !networkReady ? <StatusBadge status="PENDING">Switch network</StatusBadge> : checkingIssuer ? <StatusBadge status="PENDING">Checking access</StatusBadge> : authorized ? <StatusBadge status="VALID">Authorized issuer</StatusBadge> : <StatusBadge status="REVOKED">Not authorized</StatusBadge>}</div>
      </section>

      {!address ? <section className="empty-panel"><span><Icon name="wallet" /></span><h2>Connect a wallet to issue credentials</h2><p>Connect an authorized institution wallet using the button in the top bar. Public verification remains available without a wallet.</p></section>
        : !networkReady ? <section className="notice notice--warning"><Icon name="warning" /><div><h2>Wrong network selected</h2><p>Switch your wallet to {getChainName(CHAIN_ID)} before issuing or revoking credentials.</p></div></section>
          : authorized === false ? <section className="empty-panel empty-panel--warning"><span><Icon name="warning" /></span><h2>Your wallet is not authorized to issue credentials.</h2><p>Only authorized issuer wallets can create or revoke credentials. Ask the contract owner to grant issuer access, then refresh this page.</p></section>
            : authorized && <>
              <section className="issuer-workspace">
                <form className="surface-card issue-form" onSubmit={handleMint} noValidate>
                  <div className="surface-card__header"><div><h2>Issue a certificate</h2><p>Metadata is stored through the configured IPFS service, then its URI is committed on-chain.</p></div><StatusBadge status="NEUTRAL">Soulbound</StatusBadge></div>
                  <div className="form-grid">
                    <label className="field field--full"><span>Student wallet address <b>*</b></span><input value={student} onChange={(e) => setStudent(e.target.value)} placeholder="0x…" inputMode="text" autoComplete="off" aria-invalid={Boolean(formError && !isAddress(student.trim()))} /></label>
                    <label className="field"><span>Student name <b>*</b></span><input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Aisha Sharma" /></label>
                    <label className="field"><span>Course or credential <b>*</b></span><input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Blockchain Foundations" /></label>
                    <label className="field"><span>Issue date <b>*</b></span><input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} required /></label>
                    <label className="field"><span>Institution reference <em>optional</em></span><input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Internal record reference" /></label>
                    <label className="field field--full"><span>Description <em>optional</em></span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief credential description" rows={3} /></label>
                  </div>
                  {formError && <p className="form-error" role="alert"><Icon name="warning" />{formError}</p>}
                  <div className="form-actions"><p>Credential ownership cannot be transferred after issuance.</p><button className="button button--primary" type="submit" disabled={activity.phase === "confirming" || activity.phase === "pending"}><Icon name="certificate" />{activity.phase === "confirming" ? "Confirm in wallet…" : activity.phase === "pending" ? "Transaction pending…" : "Issue certificate"}</button></div>
                </form>
                <TransactionCard activity={activity} />
              </section>

              {minted && <section className="mint-success surface-card"><div className="mint-success__intro"><span><Icon name="check" /></span><div><span className="eyebrow eyebrow--accent">Transaction confirmed</span><h2>Certificate #{minted.tokenId} was issued.</h2><p>{minted.course} has been bound to {shortenAddress(minted.student)}.</p></div><button className="button button--secondary" onClick={() => onNavigate("verify")}>Verify it <Icon name="arrowRight" /></button></div>{minted.verification?.certificate ? <CertificateCard certificate={minted.verification.certificate} metadata={minted.verification.metadata} compact /> : <p className="metadata-note">Metadata URI recorded: <code>{minted.metadataURI}</code></p>}</section>}

              <section className="issuer-lower-grid">
                <div className="surface-card revoke-card"><div className="surface-card__header"><div><h2>Revoke a certificate</h2><p>Use only when an issued credential must no longer be considered valid.</p></div><Icon name="warning" /></div><div className="inline-form"><label className="field"><span>On-chain certificate ID</span><input value={revokeTokenId} onChange={(e) => setRevokeTokenId(e.target.value)} placeholder="e.g. 42" inputMode="numeric" /></label><button className="button button--danger" type="button" onClick={requestRevoke} disabled={activity.phase === "confirming" || activity.phase === "pending"}>Revoke</button></div><p className="helper-text">Revocation changes the status to <strong>REVOKED</strong>; the certificate record remains on-chain for auditability.</p></div>
              </section>
            </>}

      {address && networkReady && <details className="advanced-controls issuer-admin-section"><summary><span><Icon name="key" /></span><div><h2>Issuer administration</h2><p>Contract-owner controls for the authorized issuer list.</p></div><Icon name="arrowRight" /></summary><div className="advanced-controls__body"><label className="field"><span>Issuer wallet address</span><input value={issuerAddress} onChange={(e) => setIssuerAddress(e.target.value)} placeholder="0x…" /></label><div className="button-row"><button className="button button--secondary" type="button" onClick={() => void handleIssuerAdmin("add")}>Add issuer</button><button className="button button--quiet" type="button" onClick={() => void handleIssuerAdmin("remove")}>Remove issuer</button></div></div></details>}

      {showRevokeConfirm && <div className="modal-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="revoke-title"><span className="confirm-dialog__icon"><Icon name="warning" /></span><h2 id="revoke-title">Revoke certificate #{revokeTokenId}?</h2><p>This changes its public verification status to REVOKED. The on-chain certificate and issuance history will remain visible.</p><div className="button-row"><button className="button button--quiet" onClick={() => setShowRevokeConfirm(false)}>Cancel</button><button className="button button--danger" onClick={() => void handleRevoke()}>Confirm revocation</button></div></section></div>}
    </div>
  );
}

function TransactionCard({ activity }: { activity: Activity }) {
  if (activity.phase === "idle") return <aside className="transaction-card"><span className="transaction-card__icon"><Icon name="shield" /></span><h2>Transaction clarity</h2><p>Every issuance and revocation will show wallet confirmation, pending, and confirmed states here.</p></aside>;
  const transactionExplorer = activity.hash && CHAIN_ID === 11155111 ? `https://sepolia.etherscan.io/tx/${activity.hash}` : null;
  return <aside className={`transaction-card transaction-card--${activity.phase}`} role={activity.phase === "error" ? "alert" : "status"}><span className="transaction-card__icon"><Icon name={activity.phase === "error" ? "warning" : activity.phase === "success" ? "check" : activity.phase === "pending" ? "network" : "wallet"} /></span><span className="eyebrow">{activity.phase === "confirming" ? "Wallet confirmation" : activity.phase === "pending" ? "On-chain pending" : activity.phase === "success" ? "Confirmed" : "Action needed"}</span><h2>{activity.phase === "success" ? "Transaction complete" : activity.phase === "error" ? "Action couldn’t be completed" : "Your action is in progress"}</h2><p>{activity.message}</p>{activity.hash && <code className="transaction-hash">{shortenAddress(activity.hash, 10, 8)}</code>}{transactionExplorer && <a className="text-link" href={transactionExplorer} target="_blank" rel="noreferrer">View transaction <Icon name="external" /></a>}</aside>;
}
