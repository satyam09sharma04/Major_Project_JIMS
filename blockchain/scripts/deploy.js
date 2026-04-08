const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const { ethers, network } = hre;

const rootDir = path.join(__dirname, "..", "..");

const readArtifactAbi = (contractName) => {
	const artifactPath = path.join(
		__dirname,
		"..",
		"artifacts",
		"contracts",
		`${contractName}.sol`,
		`${contractName}.json`
	);
	const artifactRaw = fs.readFileSync(artifactPath, "utf8");
	return JSON.parse(artifactRaw).abi;
};

const writeJson = (targetPath, payload) => {
	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), "utf8");
	console.log(`[deploy] Wrote config: ${targetPath}`);
};

const deployContract = async (name, args = []) => {
	const factory = await ethers.getContractFactory(name);
	const contract = await factory.deploy(...args);
	await contract.waitForDeployment();
	const address = await contract.getAddress();
	console.log(`[deploy] ${name} deployed at ${address}`);
	return { contract, address };
};

const buildContractConfig = async ({ addresses }) => {
  const liveNetwork = await ethers.provider.getNetwork();
  const chainId = Number(liveNetwork.chainId);

  const contractsMap = {
    PropertyRegistry: {
      address: addresses.PropertyRegistry,
      abi: readArtifactAbi("PropertyRegistry"),
    },
    OwnershipTransfer: {
      address: addresses.OwnershipTransfer,
      abi: readArtifactAbi("OwnershipTransfer"),
    },
    PropertyHistory: {
      address: addresses.PropertyHistory,
      abi: readArtifactAbi("PropertyHistory"),
    },
  };

  return {
    updatedAt: new Date().toISOString(),
    network: {
      name: network.name,
      chainId,
      rpcUrl: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
    },
    contracts: contractsMap,
    ...contractsMap,
  };
};

const resolveDeployerSigner = async () => {
  const configuredSigners = await ethers.getSigners();
  if (configuredSigners.length > 0) {
    return configuredSigners[0];
  }

  try {
    const rpcAccounts = await ethers.provider.send("eth_accounts", []);
    if (!rpcAccounts?.length) {
      throw new Error("No RPC accounts available");
    }

    const fallbackSigner = await ethers.provider.getSigner(rpcAccounts[0]);
    await fallbackSigner.getAddress();
    console.log(`[deploy] Using unlocked RPC account ${rpcAccounts[0]} (Ganache/local node)`);
    return fallbackSigner;
  } catch {
    throw new Error(
      "No deployer signer available. Set PRIVATE_KEY in blockchain/.env or run a local node with unlocked accounts."
    );
  }
};

async function main() {
  const deployer = await resolveDeployerSigner();
  const deployerAddress = await deployer.getAddress();

  console.log(`[deploy] Network: ${network.name}`);
  console.log(`[deploy] Deployer: ${deployerAddress}`);

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

  const deploymentManifest = {
    network: network.name,
    deployer: deployerAddress,
    deployedAt: new Date().toISOString(),
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
  };

  const contractConfig = await buildContractConfig({
    addresses: deploymentManifest.contracts,
  });

  writeJson(path.join(__dirname, "..", "deployments", `${network.name}.json`), deploymentManifest);

  writeJson(path.join(rootDir, "blockchain", "config", "contract-config.json"), contractConfig);
  writeJson(path.join(rootDir, "frontend", "public", "contract-config.json"), contractConfig);
  writeJson(path.join(rootDir, "backend", "src", "config", "contract-config.json"), contractConfig);

  // Backward-compatible locations.
  writeJson(path.join(rootDir, "shared", "blockchain-config.json"), contractConfig);
  writeJson(path.join(rootDir, "frontend", "public", "blockchain-config.json"), contractConfig);
  writeJson(path.join(rootDir, "backend", "src", "config", "blockchain-config.json"), contractConfig);

  console.log("[deploy] Completed successfully.");
}

main().catch((error) => {
  console.error("[deploy] Deployment failed:", error);
  process.exitCode = 1;
});