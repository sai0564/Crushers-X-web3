import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("SoulboundCertificate — Deployment");
  console.log("=".repeat(60));
  console.log(`Network:  ${network.name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("-".repeat(60));

  const Factory = await ethers.getContractFactory("SoulboundCertificate");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log(`✅ Contract deployed at: ${contractAddress}`);
  console.log(`   Owner:               ${deployer.address}`);
  console.log("-".repeat(60));

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${filePath}`);

  // Also output in a format easy to copy for frontend
  console.log("");
  console.log("=".repeat(60));
  console.log("Frontend Configuration:");
  console.log("=".repeat(60));
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_CHAIN_ID=${deploymentInfo.chainId}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
