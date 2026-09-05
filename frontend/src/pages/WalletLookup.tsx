import { useState } from "react";
import { getCertificatesByWallet, type CertificateData } from "../services/certificates";
import { getCertificateStatus } from "../services/verification";

export function WalletLookup() {
  const [walletAddress, setWalletAddress] = useState("");
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError("");
    setCertificates([]);
    setSearched(false);

    try {
      const certs = await getCertificatesByWallet(walletAddress);
      setCertificates(certs);
      setSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Wallet Certificate Lookup</h2>
      <p>Search for all certificates belonging to a student wallet.</p>
      <p style={{ fontSize: "12px", color: "#888" }}>
        Uses on-chain CertificateIssued events — no token ID scanning.
      </p>

      <input
        placeholder="Student Wallet Address (0x...)"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        style={{ width: "400px" }}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {searched && certificates.length === 0 && (
        <p>No certificates found for this wallet.</p>
      )}

      {certificates.length > 0 && (
        <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #555" }}>
              <th style={{ padding: "6px", textAlign: "left" }}>Token ID</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Issuer</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Metadata URI</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Issued</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.tokenId} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "6px" }}>{cert.tokenId}</td>
                <td style={{ padding: "6px", fontSize: "12px" }}>
                  <code>{cert.issuer}</code>
                </td>
                <td style={{ padding: "6px", fontSize: "12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <code>{cert.metadataURI}</code>
                </td>
                <td style={{ padding: "6px", fontSize: "12px" }}>
                  {new Date(cert.issuedAt * 1000).toLocaleDateString()}
                </td>
                <td
                  style={{
                    padding: "6px",
                    fontWeight: "bold",
                    color: cert.revoked ? "#f00" : "#0f0",
                  }}
                >
                  {getCertificateStatus(cert.revoked)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
