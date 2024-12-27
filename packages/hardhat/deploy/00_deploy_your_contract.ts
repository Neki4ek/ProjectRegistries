import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployHotelBooking: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🛫 Deploying HotelBooking...");
  console.log("Deployer address:", deployer);

  try {
    const hotelBooking = await deploy("HotelBooking", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });

    console.log("🚀 HotelBooking deployed to:", hotelBooking.address);

    const deployedCode = await hre.ethers.provider.getCode(hotelBooking.address);
    if (deployedCode === "0x") {
      throw new Error("Contract deployment failed - no code at address");
    }

    const contract = await hre.ethers.getContractAt("HotelBooking", hotelBooking.address);

    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    console.log("Deployer address:", deployer);
    
    if (owner.toLowerCase() !== deployer.toLowerCase()) {
      console.log("Transferring ownership to deployer...");
      await contract.transferOwnership(deployer);
      console.log("Ownership transferred to:", deployer);
    }

    const roomCount = await contract.getRoomCount();
    console.log("Initial room count:", roomCount.toString());

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
};

export default deployHotelBooking;

deployHotelBooking.tags = ["HotelBooking"]; 