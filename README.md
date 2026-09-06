# Credence — On-Chain Verifiable Credentials

> **Credentials you can verify. Trust you don't have to assume.**

Credence is a Web3 dApp for issuing, owning, and publicly verifying **non-transferable (soulbound) digital certificates** on the Ethereum Sepolia testnet.

It combines a Solidity smart contract, MetaMask, IPFS metadata, and public on-chain verification so certificate validity does not depend on a traditional centralized database.

---

## ✨ Core Flow

**Authorized Issuer → Mint → Student Wallet → Verify → Revoke → Verify Again**

- 🎓 Issue certificates directly to student wallets
- 🔒 Certificates are soulbound and cannot be transferred
- 🔎 Public verification by Token ID
- 👛 Wallet-based credential lookup
- ♻️ On-chain certificate revocation
- 🌐 IPFS-based certificate metadata

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Ethereum Sepolia Testnet |
| Smart Contract | Solidity `^0.8.28` + OpenZeppelin v5.x |
| Frontend | React + TypeScript + Vite |
| Web3 | ethers.js + MetaMask |
| Storage | IPFS / Pinata-compatible integration |
| Tooling | Node.js + npm + Git |

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────┐
│              Credence Frontend              │
│          React + TypeScript + Vite          │
├─────────────────────────────────────────────┤
│ Overview │ Issue │ Verify │ Wallet Lookup  │
└──────────────────┬──────────────────────────┘
                   │
            ethers.js / MetaMask
                   │
                   ▼
        ┌────────────────────────┐
        │ SoulboundCertificate   │
        │     Smart Contract     │
        └───────────┬────────────┘
                    │
              Metadata URI
                    │
                    ▼
              ┌──────────┐
              │   IPFS   │
              └──────────┘
```

---

## ⛓️ Deployed Contract

**Network:** Ethereum Sepolia Testnet  
**Chain ID:** `11155111`

**Contract:**

```text
0x6C79bD4669d5f5825f983a663341AE9C576D1215
```

> ⚠️ This is a testnet deployment intended for demonstration and development.

---

## 📁 Project Structure

```text
HACKBLOX-R-2/
├── contracts/
│   └── SoulboundCertificate.sol
├── test/
├── scripts/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── ipfs/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone

```bash
git clone <YOUR_REPOSITORY_URL>
cd HACKBLOX-R-2
```

### 2. Install dependencies

```bash
npm install
cd frontend
npm install
```

### 3. Configure environment

Create a local `.env` file when needed:

```env
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

Never commit API keys, private keys, or seed phrases.

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal.

---

## 🦊 MetaMask Setup

For the complete demo:

1. Install MetaMask
2. Select **Sepolia Testnet**
3. Use a test wallet with Sepolia ETH
4. Connect the wallet to Credence
5. Use an authorized wallet as the issuer
6. Use a separate wallet as the student/recipient

**Never share a seed phrase or private key.**

---

## 🎬 Demo Flow

```text
Connect Issuer
      ↓
Authorized Issuer
      ↓
Mint Certificate
      ↓
Confirm MetaMask
      ↓
Token ID
      ↓
Public Verification
      ↓
🟢 VALID
      ↓
Revoke Certificate
      ↓
Confirm MetaMask
      ↓
Public Verification
      ↓
🔴 REVOKED
```

### What the demo proves

- Only authorized issuers can issue credentials
- Certificates are issued to student wallets
- Certificate state is verified from the blockchain
- Soulbound certificates cannot be transferred
- Certificates can be revoked without deleting their record
- Public verification reflects the current on-chain status

---

## 🔎 Verification

Anyone can verify a certificate using its Token ID.

Credence can display:

- Certificate ID
- Student / recipient wallet
- Issuer wallet
- Course / credential
- Issue date
- IPFS metadata
- Network
- Current status

Possible states:

```text
🟢 VALID
🔴 REVOKED
```

---

## 👛 Wallet Lookup

Users can enter a student's wallet address to discover associated certificates.

Credence uses `CertificateIssued` blockchain events and filters them by the recipient wallet.

---

## 🔒 Soulbound Design

The certificate uses NFT functionality to represent a unique credential, while the smart contract blocks transfer and approval operations.

```text
Normal NFT:
Wallet A → Wallet B → Wallet C

Credence:
Issuer → Student Wallet
              ↓
         ❌ Transfer
```

The credential remains tied to its recipient wallet.

---

## 🌐 Data Storage

### On-chain

Critical credential state includes:

- Token ID
- Student / recipient wallet
- Issuer wallet
- Issue timestamp
- Revocation status
- IPFS metadata URI

### IPFS

Certificate metadata can include:

- Certificate name
- Student information
- Course
- Date
- Description
- Certificate reference

IPFS is content-addressed, so changing content produces a different CID.

---

## ♻️ Revocation

Revocation changes the certificate's status rather than deleting the record.

```text
VALID
  │
  │ revoke
  ▼
REVOKED
```

The certificate remains verifiable on-chain.

---

## 🧪 Testing

The project has been validated across the smart contract, backend, and frontend.

### Smart Contract

**45 automated tests passed**, covering:

- Issuer authorization
- Certificate minting
- Soulbound restrictions
- Verification
- Certificate events
- Wallet lookup
- Revocation

### End-to-End Backend

**14/14 validation checks passed.**

The validation included real certificate states such as:

```text
Token #1 → REVOKED
Token #2 → VALID
Token #3 → VALID
```

### Frontend

- ✅ `npm run lint`
- ✅ `npm run build`
- ✅ TypeScript diagnostics
- ✅ Vite runtime
- ✅ Navigation
- ✅ Responsive UI
- ✅ Live Sepolia reads
- ✅ Certificate verification
- ✅ Wallet lookup
- ✅ Invalid-input handling
- ✅ Browser smoke testing
- ✅ No browser console errors after RPC configuration

---

## 🛡️ Security

- Issuer permissions are enforced by the smart contract
- Certificate validity is determined from on-chain state
- Transfers and approvals are blocked for soulbound certificates
- Private keys and seed phrases are never required
- No private credentials should be committed to the repository

---

## ⚠️ Limitations

- Currently deployed on Ethereum Sepolia testnet
- Transactions require a compatible wallet and Sepolia ETH
- Issuers must be authorized by the contract owner
- IPFS metadata availability depends on the configured storage/pinning setup
- Production use would require additional privacy, identity, governance, and operational security

---

## 🔮 Future Scope

- 📱 QR-code verification
- 🏛️ Multiple issuer tiers
- 🪪 Verifiable Credential standards
- 👨‍🎓 Student credential dashboard
- 🏫 University administration dashboard
- 📲 Mobile wallet support
- 🌍 Multi-network deployment
- 🔐 Production-grade identity and privacy controls

---

## 🏆 HACKBLOX 2026

**Web3 Track — Problem #2: On-Chain Verifiable Credentials (Soulbound Certificates)**

Credence focuses on a complete working credential lifecycle:

> **Issue → Own → Verify → Revoke → Verify Again**

---

## 👥 Team

**Team Credence**  
Built for **HACKBLOX 2026**

---

> ### Credence
> **Credentials you can verify. Trust you don't have to assume.**
