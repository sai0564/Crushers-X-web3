import { useState } from "react";
import { verifyCertificate, type VerificationResult } from "../services/verification";

export function VerificationPanel() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!tokenId) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await verifyCertificate(Number(tokenId));
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Certificate Verification</h2>
      <p>Anyone can verify — no wallet connection required (uses provider for reads).</p>

      <input
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        style={{ width: "120px" }}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? "Verifying..." : "Verify"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {result && (
        <div style={{ marginTop: "16px" }}>
          {result.status === "NOT_FOUND" ? (
            <div style={{ padding: "12px", background: "#333", border: "2px solid #666" }}>
              <strong>NOT FOUND</strong> — Certificate #{tokenId} does not exist.
            </div>
          ) : (
            <div
              style={{
                padding: "12px",
                background: result.status === "VALID" ? "#0a2e0a" : "#2e0a0a",
                border: `2px solid ${result.status === "VALID" ? "#0f0" : "#f00"}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px 0",
                  color: result.status === "VALID" ? "#0f0" : "#f00",
                  fontSize: "24px",
                }}
              >
                {result.status === "VALID" ? "✅ VALID" : "⚠️ REVOKED"}
              </h3>

              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  <Row label="Token ID" value={String(result.certificate!.tokenId)} />
                  <Row label="Student (Owner)" value={result.certificate!.student} />
                  <Row label="Issuer" value={result.certificate!.issuer} />
                  <Row label="Metadata URI" value={result.certificate!.metadataURI} />
                  <Row
                    label="Issued At"
                    value={new Date(result.certificate!.issuedAt * 1000).toLocaleString()}
                  />
                  <Row label="Revoked" value={result.certificate!.revoked ? "YES" : "NO"} />
                  {result.metadata && (
                    <>
                      <Row label="— IPFS: Name" value={result.metadata.name} />
                      <Row label="— IPFS: Student" value={result.metadata.student} />
                      <Row label="— IPFS: Course" value={result.metadata.course} />
                      <Row label="— IPFS: Date" value={result.metadata.date} />
                      <Row label="— IPFS: Issuer" value={result.metadata.issuer} />
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: "4px 8px", fontWeight: "bold", whiteSpace: "nowrap", verticalAlign: "top" }}>
        {label}
      </td>
      <td style={{ padding: "4px 8px", wordBreak: "break-all" }}>
        <code>{value}</code>
      </td>
    </tr>
  );
}
