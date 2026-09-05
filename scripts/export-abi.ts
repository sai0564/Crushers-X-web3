import * as fs from "fs";
import * as path from "path";

async function main() {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "SoulboundCertificate.sol",
    "SoulboundCertificate.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Artifact not found. Run 'npx hardhat compile' first.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const abi = artifact.abi;

  // Export to frontend
  const targetDir = path.join(__dirname, "..", "frontend", "src", "config");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, "SoulboundCertificate.json");
  fs.writeFileSync(targetPath, JSON.stringify({ abi }, null, 2));

  console.log(`✅ ABI exported to: ${targetPath}`);
  console.log(`   ${abi.length} ABI entries`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
