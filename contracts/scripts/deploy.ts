import { ethers } from "hardhat";

async function main() {
  const usdc = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  const arbitrator = process.env.ARBITRATOR_ADDRESS;
  if (!arbitrator) throw new Error("ARBITRATOR_ADDRESS is required (use a multisig, not the deployer key)");

  const Factory = await ethers.getContractFactory("FlowPayEscrow");
  const escrow = await Factory.deploy(usdc, arbitrator);
  await escrow.waitForDeployment();
  console.log("FlowPayEscrow deployed to:", await escrow.getAddress());
  console.log("Arbitrator:", arbitrator);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
