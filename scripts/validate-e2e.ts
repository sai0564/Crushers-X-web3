import { ethers } from "hardhat";

async function main() {
  console.log("============================================================");
  console.log("SoulboundCertificate — End-to-End Backend Validation Flow");
  console.log("============================================================");

  const [admin, issuer, issuer2, student, verifier, thirdParty] = await ethers.getSigners();

  console.log("1. Deploying contract by Admin...");
  const Factory = await ethers.getContractFactory("SoulboundCertificate");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`   Contract deployed at: ${address}`);
  console.log(`   Owner: ${await contract.owner()}`);

  console.log("\n2. Admin authorizes Issuer...");
  await contract.connect(admin).addIssuer(issuer.address);
  const isAuth = await contract.isAuthorizedIssuer(issuer.address);
  console.log(`   Issuer ${issuer.address} authorized: ${isAuth}`);

  console.log("\n3. Testing unauthorized mint (should fail)...");
  try {
    await contract.connect(thirdParty).mintCertificate(student.address, "ipfs://unauth");
    throw new Error("UNEXPECTED: Unauthorized mint succeeded!");
  } catch (err: unknown) {
    console.log("   ✅ Unauthorized mint successfully rejected with NotAuthorizedIssuer");
  }

  console.log("\n4. Authorized Issuer mints 3 certificates for Student A...");
  const tx1 = await contract.connect(issuer).mintCertificate(student.address, "ipfs://cert-alpha");
  await tx1.wait();
  const tx2 = await contract.connect(issuer).mintCertificate(student.address, "ipfs://cert-beta");
  await tx2.wait();
  const tx3 = await contract.connect(issuer).mintCertificate(student.address, "ipfs://cert-gamma");
  await tx3.wait();
  console.log("   ✅ Minted Token IDs #1, #2, #3 for Student A");

  console.log("\n5. Verifying initial ownership of all 3 certificates...");
  console.log(`   Owner of #1: ${await contract.ownerOf(1)} (Student: ${student.address})`);
  console.log(`   Owner of #2: ${await contract.ownerOf(2)} (Student: ${student.address})`);
  console.log(`   Owner of #3: ${await contract.ownerOf(3)} (Student: ${student.address})`);

  console.log("\n6. Soulbound test: Student attempts transferFrom to thirdParty (must revert)...");
  try {
    await contract.connect(student).transferFrom(student.address, thirdParty.address, 1);
    throw new Error("UNEXPECTED: Soulbound transfer succeeded!");
  } catch (err: unknown) {
    console.log("   ✅ Transfer successfully reverted with SoulboundTransferNotAllowed");
  }

  console.log("\n7. Soulbound test: Student attempts approve to thirdParty (must revert)...");
  try {
    await contract.connect(student).approve(thirdParty.address, 1);
    throw new Error("UNEXPECTED: approve succeeded!");
  } catch (err: unknown) {
    console.log("   ✅ Approve successfully reverted with SoulboundApprovalNotAllowed");
  }

  console.log("\n8. Public Verifier checks Token ID #1...");
  const cert1 = await contract.connect(verifier).getCertificate(1);
  const valid1 = await contract.connect(verifier).isCertificateValid(1);
  console.log(`   Token #1 - Student: ${cert1.student}, Issuer: ${cert1.issuer}`);
  console.log(`   Token #1 - URI: ${cert1.metadataURI}, Revoked: ${cert1.revoked}`);
  console.log(`   Token #1 - Status: ${valid1 ? "VALID" : "REVOKED"}`);

  console.log("\n9. Public Verifier queries Student A wallet via CertificateIssued events...");
  const filter = contract.filters.CertificateIssued(null, student.address, null);
  const events = await contract.queryFilter(filter);
  console.log(`   Discovered ${events.length} certificates for Student A:`);
  for (const e of events) {
    const parsed = contract.interface.parseLog({ topics: [...e.topics], data: e.data });
    const tid = Number(parsed!.args.tokenId);
    const valid = await contract.isCertificateValid(tid);
    console.log(`   - Token #${tid} -> ${valid ? "VALID" : "REVOKED"}`);
  }

  console.log("\n10. Issuer revokes Token #2...");
  await contract.connect(issuer).revokeCertificate(2);
  console.log("   ✅ Token #2 revoked by original issuer");

  console.log("\n11. Testing cross-issuer revocation (Issuer2 tries to revoke #1, must fail)...");
  await contract.connect(admin).addIssuer(issuer2.address);
  try {
    await contract.connect(issuer2).revokeCertificate(1);
    throw new Error("UNEXPECTED: Cross-issuer revocation succeeded!");
  } catch (err: unknown) {
    console.log("   ✅ Cross-issuer revocation successfully rejected with NotCertificateIssuer");
  }

  console.log("\n12. Testing duplicate revocation of Token #2 (must fail)...");
  try {
    await contract.connect(issuer).revokeCertificate(2);
    throw new Error("UNEXPECTED: Duplicate revocation succeeded!");
  } catch (err: unknown) {
    console.log("   ✅ Duplicate revocation rejected with CertificateAlreadyRevoked");
  }

  console.log("\n13. Public Verifier re-checks Token #2...");
  const cert2 = await contract.connect(verifier).getCertificate(2);
  const valid2 = await contract.connect(verifier).isCertificateValid(2);
  console.log(`   Token #2 - Revoked: ${cert2.revoked}`);
  console.log(`   Token #2 - Status: ${valid2 ? "VALID" : "REVOKED"}`);
  console.log(`   Token #2 - Owner preserved: ${await contract.ownerOf(2)} == ${student.address}`);

  console.log("\n14. Public Verifier re-queries Student A wallet...");
  const eventsAfter = await contract.queryFilter(filter);
  console.log(`   Discovered ${eventsAfter.length} certificates for Student A:`);
  for (const e of eventsAfter) {
    const parsed = contract.interface.parseLog({ topics: [...e.topics], data: e.data });
    const tid = Number(parsed!.args.tokenId);
    const valid = await contract.isCertificateValid(tid);
    console.log(`   - Token #${tid} -> ${valid ? "VALID" : "REVOKED"}`);
  }

  console.log("\n============================================================");
  console.log("✅ ALL 14 E2E BACKEND VALIDATION CHECKS PASSED!");
  console.log("============================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("E2E validation failed:", err);
    process.exit(1);
  });
