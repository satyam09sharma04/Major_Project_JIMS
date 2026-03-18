const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function deployContract(name, args = []) {
	const factory = await hre.ethers.getContractFactory(name);
	const contract = await factory.deploy(...args);
	await contract.waitForDeployment();

	const address = await contract.getAddress();
	console.log(`[deploy] ${name} deployed at ${address}`);

	return { contract, address };
}

async function saveDeployment(networkName, payload) {
	const deploymentsDir = path.join(__dirname, "..", "deployments");
	if (!fs.existsSync(deploymentsDir)) {
		fs.mkdirSync(deploymentsDir, { recursive: true });
	}

	const targetPath = path.join(deploymentsDir, `${networkName}.json`);
	fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), "utf8");

	console.log(`[deploy] Deployment manifest written to ${targetPath}`);
}

async function main() {
	const networkName = hre.network.name;
	const [deployer] = await hre.ethers.getSigners();
	const deployerAddress = await deployer.getAddress();

	console.log(`[deploy] Network: ${networkName}`);
	console.log(`[deploy] Deployer: ${deployerAddress}`);

	const startingBalance = await hre.ethers.provider.getBalance(deployerAddress);
	console.log(`[deploy] Deployer balance: ${hre.ethers.formatEther(startingBalance)} ETH`);

	console.log("[deploy] Deploying PropertyRegistry...");
	const registry = await deployContract("PropertyRegistry");

	console.log("[deploy] Deploying OwnershipTransfer...");
	const transfer = await deployContract("OwnershipTransfer", [registry.address]);

	console.log("[deploy] Deploying PropertyHistory...");
	const history = await deployContract("PropertyHistory");

	console.log("[deploy] Linking OwnershipTransfer in PropertyRegistry...");
	const linkTx = await registry.contract.setTransferContract(transfer.address);
	await linkTx.wait();

	console.log("[deploy] Authorizing writers in PropertyHistory...");
	const authRegistryTx = await history.contract.setAuthorizedWriter(registry.address, true);
	await authRegistryTx.wait();
	const authTransferTx = await history.contract.setAuthorizedWriter(transfer.address, true);
	await authTransferTx.wait();

	const endingBalance = await hre.ethers.provider.getBalance(deployerAddress);

	const deployment = {
		network: networkName,
		deployedAt: new Date().toISOString(),
		deployer: deployerAddress,
		contracts: {
			PropertyRegistry: registry.address,
			OwnershipTransfer: transfer.address,
			PropertyHistory: history.address,
		},
		transactions: {
			setTransferContract: linkTx.hash,
			authorizeRegistryWriter: authRegistryTx.hash,
			authorizeTransferWriter: authTransferTx.hash,
		},
		deployerBalance: {
			startEth: hre.ethers.formatEther(startingBalance),
			endEth: hre.ethers.formatEther(endingBalance),
		},
	};

	await saveDeployment(networkName, deployment);

	console.log("\n[deploy] Completed successfully.");
	console.log(`[deploy] PropertyRegistry: ${registry.address}`);
	console.log(`[deploy] OwnershipTransfer: ${transfer.address}`);
	console.log(`[deploy] PropertyHistory: ${history.address}`);

	console.log("\n[deploy] Frontend .env values:");
	console.log(`VITE_CONTRACT_ADDRESS=${registry.address}`);
	console.log(`VITE_TRANSFER_CONTRACT_ADDRESS=${transfer.address}`);
	console.log(`VITE_HISTORY_CONTRACT_ADDRESS=${history.address}`);
}

main().catch((error) => {
	console.error("[deploy] Deployment failed:");
	console.error(error);
	process.exitCode = 1;
});

