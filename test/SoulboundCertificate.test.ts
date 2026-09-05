import { expect } from "chai";
import { ethers } from "hardhat";
import { SoulboundCertificate } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SoulboundCertificate", function () {
  let contract: SoulboundCertificate;
  let owner: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let issuer2: HardhatEthersSigner;
  let student: HardhatEthersSigner;
  let student2: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const METADATA_URI = "ipfs://QmTestHash123456789";
  const METADATA_URI_2 = "ipfs://QmTestHash987654321";

  beforeEach(async function () {
    [owner, issuer, issuer2, student, student2, unauthorized] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SoulboundCertificate");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // =================================================================
  // DEPLOYMENT
  // =================================================================

  describe("Deployment", function () {
    it("1. Should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("2. Should set deployer as owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await contract.name()).to.equal("SoulboundCertificate");
      expect(await contract.symbol()).to.equal("SBC");
    });

    it("Should start nextTokenId at 1", async function () {
      expect(await contract.nextTokenId()).to.equal(1);
    });
  });

  // =================================================================
  // ISSUER MANAGEMENT
  // =================================================================

  describe("Issuer Management", function () {
    it("3. Owner can add issuer", async function () {
      await expect(contract.addIssuer(issuer.address))
        .to.emit(contract, "IssuerAuthorized")
        .withArgs(issuer.address);

      expect(await contract.isAuthorizedIssuer(issuer.address)).to.be.true;
    });

    it("4. Owner can remove issuer", async function () {
      await contract.addIssuer(issuer.address);

      await expect(contract.removeIssuer(issuer.address))
        .to.emit(contract, "IssuerRemoved")
        .withArgs(issuer.address);

      expect(await contract.isAuthorizedIssuer(issuer.address)).to.be.false;
    });

    it("5. Unauthorized account cannot add issuer", async function () {
      await expect(
        contract.connect(unauthorized).addIssuer(issuer.address)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("6. Unauthorized account cannot remove issuer", async function () {
      await contract.addIssuer(issuer.address);

      await expect(
        contract.connect(unauthorized).removeIssuer(issuer.address)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("7. Zero address cannot be authorized", async function () {
      await expect(
        contract.addIssuer(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("Zero address cannot be removed", async function () {
      await expect(
        contract.removeIssuer(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });
  });

  // =================================================================
  // MINTING
  // =================================================================

  describe("Minting", function () {
    beforeEach(async function () {
      await contract.addIssuer(issuer.address);
    });

    it("8. Authorized issuer can mint", async function () {
      const tx = await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);
      await tx.wait();

      expect(await contract.ownerOf(1)).to.equal(student.address);
    });

    it("9. Unauthorized wallet cannot mint", async function () {
      await expect(
        contract
          .connect(unauthorized)
          .mintCertificate(student.address, METADATA_URI)
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedIssuer");
    });

    it("10. Zero student address is rejected", async function () {
      await expect(
        contract
          .connect(issuer)
          .mintCertificate(ethers.ZeroAddress, METADATA_URI)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("11. Empty metadata URI is rejected", async function () {
      await expect(
        contract.connect(issuer).mintCertificate(student.address, "")
      ).to.be.revertedWithCustomError(contract, "EmptyMetadataURI");
    });

    it("12. Certificate is owned by intended student", async function () {
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);

      expect(await contract.ownerOf(1)).to.equal(student.address);
    });

    it("13. Metadata URI is stored correctly", async function () {
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);

      const cert = await contract.getCertificate(1);
      expect(cert.metadataURI).to.equal(METADATA_URI);
    });

    it("14. Issuer is recorded correctly", async function () {
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);

      const cert = await contract.getCertificate(1);
      expect(cert.issuer).to.equal(issuer.address);
    });

    it("15. Certificate issue timestamp is recorded", async function () {
      const tx = await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const cert = await contract.getCertificate(1);
      expect(cert.issuedAt).to.equal(block!.timestamp);
    });

    it("16. CertificateIssued event contains correct values", async function () {
      await expect(
        contract
          .connect(issuer)
          .mintCertificate(student.address, METADATA_URI)
      )
        .to.emit(contract, "CertificateIssued")
        .withArgs(1, student.address, issuer.address, METADATA_URI);
    });

    it("Token IDs increment correctly", async function () {
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);
      await contract
        .connect(issuer)
        .mintCertificate(student2.address, METADATA_URI_2);

      expect(await contract.ownerOf(1)).to.equal(student.address);
      expect(await contract.ownerOf(2)).to.equal(student2.address);
      expect(await contract.nextTokenId()).to.equal(3);
    });

    it("tokenURI returns the stored metadata URI", async function () {
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);

      expect(await contract.tokenURI(1)).to.equal(METADATA_URI);
    });
  });

  // =================================================================
  // SOULBOUND (NON-TRANSFERABLE)
  // =================================================================

  describe("Soulbound / Non-Transferable", function () {
    beforeEach(async function () {
      await contract.addIssuer(issuer.address);
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);
    });

    it("17. Certificate cannot be transferred via transferFrom", async function () {
      await expect(
        contract
          .connect(student)
          .transferFrom(student.address, student2.address, 1)
      ).to.be.revertedWithCustomError(
        contract,
        "SoulboundTransferNotAllowed"
      );
    });

    it("18. Certificate cannot be transferred via safeTransferFrom", async function () {
      await expect(
        contract
          .connect(student)
          ["safeTransferFrom(address,address,uint256)"](
            student.address,
            student2.address,
            1
          )
      ).to.be.revertedWithCustomError(
        contract,
        "SoulboundTransferNotAllowed"
      );
    });

    it("19a. approve() is blocked", async function () {
      await expect(
        contract.connect(student).approve(student2.address, 1)
      ).to.be.revertedWithCustomError(
        contract,
        "SoulboundApprovalNotAllowed"
      );
    });

    it("19b. setApprovalForAll() is blocked", async function () {
      await expect(
        contract.connect(student).setApprovalForAll(student2.address, true)
      ).to.be.revertedWithCustomError(
        contract,
        "SoulboundApprovalNotAllowed"
      );
    });

    it("Certificate remains owned by student after failed transfer", async function () {
      try {
        await contract
          .connect(student)
          .transferFrom(student.address, student2.address, 1);
      } catch {
        // Expected to revert
      }

      expect(await contract.ownerOf(1)).to.equal(student.address);
    });
  });

  // =================================================================
  // REVOCATION
  // =================================================================

  describe("Revocation", function () {
    beforeEach(async function () {
      await contract.addIssuer(issuer.address);
      await contract.addIssuer(issuer2.address);
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);
    });

    it("20. Authorized issuer can revoke their certificate", async function () {
      await expect(contract.connect(issuer).revokeCertificate(1))
        .to.emit(contract, "CertificateRevoked")
        .withArgs(1, issuer.address);

      const cert = await contract.getCertificate(1);
      expect(cert.revoked).to.be.true;
    });

    it("21. Unauthorized wallet cannot revoke", async function () {
      await expect(
        contract.connect(unauthorized).revokeCertificate(1)
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedIssuer");
    });

    it("22. Issuer cannot revoke another issuer's certificate", async function () {
      await expect(
        contract.connect(issuer2).revokeCertificate(1)
      ).to.be.revertedWithCustomError(contract, "NotCertificateIssuer");
    });

    it("23. Revoked certificate remains owned by student", async function () {
      await contract.connect(issuer).revokeCertificate(1);
      expect(await contract.ownerOf(1)).to.equal(student.address);
    });

    it("24. Revoked certificate is reported as revoked", async function () {
      await contract.connect(issuer).revokeCertificate(1);

      const cert = await contract.getCertificate(1);
      expect(cert.revoked).to.be.true;
      expect(await contract.isCertificateValid(1)).to.be.false;
    });

    it("25. Duplicate revocation reverts", async function () {
      await contract.connect(issuer).revokeCertificate(1);

      await expect(
        contract.connect(issuer).revokeCertificate(1)
      ).to.be.revertedWithCustomError(contract, "CertificateAlreadyRevoked");
    });

    it("Revocation does not destroy the NFT", async function () {
      await contract.connect(issuer).revokeCertificate(1);

      // Token still exists — balanceOf and ownerOf still work
      expect(await contract.balanceOf(student.address)).to.equal(1);
      expect(await contract.ownerOf(1)).to.equal(student.address);
    });
  });

  // =================================================================
  // VERIFICATION
  // =================================================================

  describe("Verification", function () {
    beforeEach(async function () {
      await contract.addIssuer(issuer.address);
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);
    });

    it("26. Existing certificate can be queried", async function () {
      const cert = await contract.getCertificate(1);
      expect(cert.student).to.equal(student.address);
      expect(cert.metadataURI).to.equal(METADATA_URI);
      expect(cert.issuer).to.equal(issuer.address);
      expect(cert.issuedAt).to.be.gt(0);
      expect(cert.revoked).to.be.false;
    });

    it("27. Nonexistent certificate reverts on getCertificate", async function () {
      await expect(contract.getCertificate(999)).to.be.revertedWithCustomError(
        contract,
        "ERC721NonexistentToken"
      );
    });

    it("27b. Nonexistent certificate returns false on isCertificateValid", async function () {
      expect(await contract.isCertificateValid(999)).to.be.false;
    });

    it("28. Valid certificate is reported as valid", async function () {
      expect(await contract.isCertificateValid(1)).to.be.true;
    });

    it("29. Revoked certificate is reported as invalid", async function () {
      await contract.connect(issuer).revokeCertificate(1);
      expect(await contract.isCertificateValid(1)).to.be.false;
    });

    it("tokenURI reverts for nonexistent token", async function () {
      await expect(contract.tokenURI(999)).to.be.revertedWithCustomError(
        contract,
        "ERC721NonexistentToken"
      );
    });
  });

  // =================================================================
  // ISSUER REMOVAL
  // =================================================================

  describe("Issuer Removal", function () {
    it("30. Removed issuer cannot mint new certificates", async function () {
      await contract.addIssuer(issuer.address);

      // Mint one certificate successfully
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);

      // Remove issuer
      await contract.removeIssuer(issuer.address);

      // Attempt to mint should fail
      await expect(
        contract
          .connect(issuer)
          .mintCertificate(student2.address, METADATA_URI_2)
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedIssuer");
    });

    it("Removed issuer cannot revoke certificates", async function () {
      await contract.addIssuer(issuer.address);
      await contract
        .connect(issuer)
        .mintCertificate(student.address, METADATA_URI);

      // Remove issuer
      await contract.removeIssuer(issuer.address);

      // Attempt to revoke should fail
      await expect(
        contract.connect(issuer).revokeCertificate(1)
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedIssuer");
    });
  });

  // =================================================================
  // NONEXISTENT TOKEN EDGE CASES
  // =================================================================

  describe("Nonexistent Token Edge Cases", function () {
    it("Revoking nonexistent token reverts", async function () {
      await contract.addIssuer(issuer.address);

      await expect(
        contract.connect(issuer).revokeCertificate(999)
      ).to.be.revertedWithCustomError(contract, "ERC721NonexistentToken");
    });

    it("ownerOf reverts for nonexistent token", async function () {
      await expect(contract.ownerOf(999)).to.be.revertedWithCustomError(
        contract,
        "ERC721NonexistentToken"
      );
    });
  });

  // =================================================================
  // STUDENT WALLET VERIFICATION VIA EVENTS
  // =================================================================

  describe("Student Wallet Verification via Events", function () {
    beforeEach(async function () {
      await contract.addIssuer(issuer.address);
    });

    it("Discovers all certificates for a student via CertificateIssued events and tracks validity/revocation", async function () {
      // Mint 3 certificates to student
      await contract.connect(issuer).mintCertificate(student.address, "ipfs://cert-1");
      await contract.connect(issuer).mintCertificate(student.address, "ipfs://cert-2");
      await contract.connect(issuer).mintCertificate(student.address, "ipfs://cert-3");

      // Mint 1 certificate to student2
      await contract.connect(issuer).mintCertificate(student2.address, "ipfs://cert-4");

      // Query CertificateIssued events filtered by student.address
      const filter = contract.filters.CertificateIssued(null, student.address, null);
      const events = await contract.queryFilter(filter);

      expect(events.length).to.equal(3);

      // Verify token IDs and validity
      const tokenIds = events.map((e) => {
        const parsed = contract.interface.parseLog({
          topics: [...e.topics],
          data: e.data,
        });
        return Number(parsed!.args.tokenId);
      });

      expect(tokenIds).to.deep.equal([1, 2, 3]);

      // All three are valid initially
      for (const tid of tokenIds) {
        expect(await contract.isCertificateValid(tid)).to.be.true;
        const cert = await contract.getCertificate(tid);
        expect(cert.revoked).to.be.false;
      }

      // Revoke the middle certificate (#2)
      await contract.connect(issuer).revokeCertificate(2);

      // Query events again — all 3 still exist in history
      const eventsAfterRevocation = await contract.queryFilter(filter);
      expect(eventsAfterRevocation.length).to.equal(3);

      // Check status: #1 VALID, #2 REVOKED, #3 VALID
      const cert1 = await contract.getCertificate(1);
      const cert2 = await contract.getCertificate(2);
      const cert3 = await contract.getCertificate(3);

      expect(cert1.revoked).to.be.false;
      expect(await contract.isCertificateValid(1)).to.be.true;

      expect(cert2.revoked).to.be.true;
      expect(await contract.isCertificateValid(2)).to.be.false;

      expect(cert3.revoked).to.be.false;
      expect(await contract.isCertificateValid(3)).to.be.true;
    });

    it("Returns empty array for student with no certificates", async function () {
      const filter = contract.filters.CertificateIssued(null, unauthorized.address, null);
      const events = await contract.queryFilter(filter);
      expect(events.length).to.equal(0);
    });
  });
});
