import { useState } from "react";
import { isAuthorizedIssuer, addIssuer, removeIssuer } from "../services/issuer";
import { mintCertificate, revokeCertificate } from "../services/certificates";
import { getIpfsService } from "../ipfs/ipfs-service";

interface IssuerPanelProps {
  address: string | null;
}

export function IssuerPanel({ address }: IssuerPanelProps) {
  const [issuerStatus, setIssuerStatus] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);

  // Admin: Add/Remove Issuer
  const [issuerAddr, setIssuerAddr] = useState("");

  // Mint form
  const [studentWallet, setStudentWallet] = useState("");
  const [metadataURI, setMetadataURI] = useState("");

  // Revoke
  const [revokeTokenId, setRevokeTokenId] = useState("");

  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const checkIssuerStatus = async () => {
    if (!address) return;
    try {
      const authorized = await isAuthorizedIssuer(address);
      setIssuerStatus(authorized ? "✅ Authorized Issuer" : "❌ Not Authorized");
      addLog(`Issuer check for ${address}: ${authorized ? "authorized" : "not authorized"}`);
    } catch (err: unknown) {
      setIssuerStatus("Error checking status");
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAddIssuer = async () => {
    if (!issuerAddr) return;
    setLoading(true);
    try {
      addLog(`Adding issuer: ${issuerAddr}...`);
      const tx = await addIssuer(issuerAddr);
      addLog(`TX sent: ${tx.hash}`);
      await tx.wait();
      addLog(`✅ Issuer added successfully`);
    } catch (err: unknown) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  const handleRemoveIssuer = async () => {
    if (!issuerAddr) return;
    setLoading(true);
    try {
      addLog(`Removing issuer: ${issuerAddr}...`);
      const tx = await removeIssuer(issuerAddr);
      addLog(`TX sent: ${tx.hash}`);
      await tx.wait();
      addLog(`✅ Issuer removed successfully`);
    } catch (err: unknown) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  const handleMint = async () => {
    const student = studentWallet.trim();

    if (!student) {
      addLog("❌ Student Wallet is required");
      return;
    }
    setLoading(true);
    try {
      const ipfs = getIpfsService();
      const uri = await ipfs.uploadMetadata({
        name: "Soulbound Certificate",
        description: "On-chain verifiable educational credential",
        student,
        course: "Web3 Track",
        date: new Date().toISOString().split("T")[0],
        issuer: address || "Issuer",
        certificateId: `CERT-${Date.now()}`,
      });
      setMetadataURI(uri);
      addLog(`Uploaded metadata: ${uri}`);
      addLog(`Minting certificate to ${student}...`);
      addLog(`Metadata URI: ${uri}`);
      const result = await mintCertificate(student, uri);
      addLog(`TX sent: ${result.hash}`);

      const tokenId = await result.waitForTokenId();
      addLog(`✅ Certificate minted! Token ID: ${tokenId}`);
      addLog(`   IPFS URI: ${uri}`);
    } catch (err: unknown) {
      addLog(`❌ Mint Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!revokeTokenId) return;
    setLoading(true);
    try {
      addLog(`Revoking certificate #${revokeTokenId}...`);
      const tx = await revokeCertificate(Number(revokeTokenId));
      addLog(`TX sent: ${tx.hash}`);
      await tx.wait();
      addLog(`✅ Certificate #${revokeTokenId} revoked`);
    } catch (err: unknown) {
      addLog(`❌ Revoke Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Issuer Panel</h2>
      <p>Connected: <code>{address || "not connected"}</code></p>
      <p>Status: {issuerStatus || "—"}</p>
      <button onClick={checkIssuerStatus} disabled={!address}>Check Issuer Status</button>

      <hr />
      <h3>Admin: Manage Issuers</h3>
      <input
        placeholder="Issuer address (0x...)"
        value={issuerAddr}
        onChange={(e) => setIssuerAddr(e.target.value)}
        style={{ width: "400px" }}
      />
      <br />
      <button onClick={handleAddIssuer} disabled={loading}>Add Issuer</button>{" "}
      <button onClick={handleRemoveIssuer} disabled={loading}>Remove Issuer</button>

      <hr />
      <h3>Mint Certificate</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ textAlign: "left" }}>
          <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>
            Student Wallet Address (required):
          </label>
          <input
            placeholder="0x..."
            value={studentWallet}
            onChange={(e) => setStudentWallet(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ textAlign: "left" }}>
          <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>
            Metadata URI (required):
          </label>
          <input
            placeholder="ipfs://..."
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={async () => {
              try {
                const ipfs = getIpfsService();
                const uri = await ipfs.uploadMetadata({
                  name: "Soulbound Certificate",
                  description: "On-chain verifiable educational credential",
                  student: studentWallet || "Student",
                  course: "Web3 Track",
                  date: new Date().toISOString().split("T")[0],
                  issuer: address || "Issuer",
                  certificateId: `CERT-${Date.now()}`,
                });
                setMetadataURI(uri);
                addLog(`Generated metadata URI: ${uri}`);
              } catch (err: unknown) {
                addLog(`Error generating URI: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
            style={{ fontSize: "12px" }}
          >
            Auto-generate Mock IPFS URI
          </button>

          <button onClick={handleMint} disabled={loading}>
            {loading ? "Processing..." : "Mint Certificate"}
          </button>
        </div>
      </div>

      <hr />
      <h3>Revoke Certificate</h3>
      <input placeholder="Token ID" value={revokeTokenId} onChange={(e) => setRevokeTokenId(e.target.value)} style={{ width: "120px" }} />
      <button onClick={handleRevoke} disabled={loading}>Revoke</button>

      <hr />
      <h3>Log</h3>
      <pre style={{ background: "#111", color: "#0f0", padding: "10px", maxHeight: "300px", overflow: "auto", fontSize: "12px" }}>
        {log.length === 0 ? "No activity yet" : log.join("\n")}
      </pre>
    </div>
  );
}
