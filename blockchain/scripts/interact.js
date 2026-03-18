const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function parseCliArgs(argv) {
	const result = {};

	for (const item of argv) {
		if (!item.includes("=")) {
			continue;
		}

		const splitIndex = item.indexOf("=");
		const key = item.slice(0, splitIndex).trim();
		const value = item.slice(splitIndex + 1).trim();

		if (key) {
			result[key] = value;
		}
	}

	return result;
}

function getDeploymentManifest(networkName) {
	const manifestPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);

	if (!fs.existsSync(manifestPath)) {
		return null;
	}

	try {
		const raw = fs.readFileSync(manifestPath, "utf8");
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function resolveAddress(name, manifest, envKey) {
	const fromManifest = manifest?.contracts?.[name] || "";
	const fromEnv = process.env[envKey] || "";
	const address = fromManifest || fromEnv;

	if (!address) {
		throw new Error(
			`Missing ${name} address. Deploy first or set ${envKey} in environment.`
		);
	}

	return address;
}

async function getContracts() {
	const networkName = hre.network.name;
	const manifest = getDeploymentManifest(networkName);

	const registryAddress = resolveAddress(
		"PropertyRegistry",
		manifest,
		"PROPERTY_REGISTRY_ADDRESS"
	);
	const transferAddress = resolveAddress(
		"OwnershipTransfer",
		manifest,
		"OWNERSHIP_TRANSFER_ADDRESS"
	);
	const historyAddress = resolveAddress(
		"PropertyHistory",
		manifest,
		"PROPERTY_HISTORY_ADDRESS"
	);

	const registry = await hre.ethers.getContractAt("PropertyRegistry", registryAddress);
	const transfer = await hre.ethers.getContractAt("OwnershipTransfer", transferAddress);
	const history = await hre.ethers.getContractAt("PropertyHistory", historyAddress);

	return {
		networkName,
		manifest,
		registry,
		transfer,
		history,
		addresses: {
			registry: registryAddress,
			transfer: transferAddress,
			history: historyAddress,
		},
	};
}

function parseUint(value, fieldName) {
	if (value == null || value === "") {
		throw new Error(`${fieldName} is required.`);
	}

	const num = Number(value);
	if (!Number.isInteger(num) || num < 0) {
		throw new Error(`${fieldName} must be a non-negative integer.`);
	}

	return num;
}

async function actionRegister(ctx, args, signer) {
	const owner = args.owner || (await signer.getAddress());
	const payload = {
		khasraNumber: args.khasra || "KH-001",
		surveyNumber: args.survey || "SV-001",
		plotNumber: args.plot || "PL-001",
		location: args.location || "Sector 1",
		area: parseUint(args.area || "1200", "area"),
		owner,
	};

	console.log("[interact] Registering property with payload:", payload);

	const tx = await ctx.registry.registerProperty(
		payload.khasraNumber,
		payload.surveyNumber,
		payload.plotNumber,
		payload.location,
		payload.area,
		payload.owner
	);
	const receipt = await tx.wait();

	const propertyId = Number(await ctx.registry.nextPropertyId()) - 1;
	console.log(`[interact] register tx: ${tx.hash}`);
	console.log(`[interact] gas used: ${receipt.gasUsed.toString()}`);
	console.log(`[interact] propertyId: ${propertyId}`);

	return propertyId;
}

async function actionGet(ctx, args) {
	const propertyId = parseUint(args.propertyId, "propertyId");
	const property = await ctx.registry.getProperty(propertyId);

	console.log(`[interact] Property ${propertyId}:`);
	console.log({
		propertyId: Number(property.propertyId),
		khasraNumber: property.khasraNumber,
		surveyNumber: property.surveyNumber,
		plotNumber: property.plotNumber,
		location: property.location,
		area: Number(property.area),
		currentOwner: property.currentOwner,
		registeredAt: Number(property.registeredAt),
		updatedAt: Number(property.updatedAt),
		exists: property.exists,
	});
}

async function actionRequestTransfer(ctx, args) {
	const propertyId = parseUint(args.propertyId, "propertyId");
	const toOwner = args.toOwner;
	if (!toOwner) {
		throw new Error("toOwner is required.");
	}

	const tx = await ctx.transfer.requestTransfer(propertyId, toOwner);
	const receipt = await tx.wait();
	const requestId = Number(await ctx.transfer.nextRequestId()) - 1;

	console.log(`[interact] request-transfer tx: ${tx.hash}`);
	console.log(`[interact] gas used: ${receipt.gasUsed.toString()}`);
	console.log(`[interact] requestId: ${requestId}`);
}

async function actionApproveTransfer(ctx, args) {
	const requestId = parseUint(args.requestId, "requestId");
	const tx = await ctx.transfer.approveTransfer(requestId);
	const receipt = await tx.wait();

	console.log(`[interact] approve-transfer tx: ${tx.hash}`);
	console.log(`[interact] gas used: ${receipt.gasUsed.toString()}`);
}

async function actionExecuteTransfer(ctx, args) {
	const requestId = parseUint(args.requestId, "requestId");
	const tx = await ctx.transfer.executeTransfer(requestId);
	const receipt = await tx.wait();

	console.log(`[interact] execute-transfer tx: ${tx.hash}`);
	console.log(`[interact] gas used: ${receipt.gasUsed.toString()}`);
}

async function actionDirectTransfer(ctx, args) {
	const propertyId = parseUint(args.propertyId, "propertyId");
	const newOwner = args.newOwner;
	if (!newOwner) {
		throw new Error("newOwner is required.");
	}

	const tx = await ctx.registry.transferOwnership(propertyId, newOwner);
	const receipt = await tx.wait();

	console.log(`[interact] direct-transfer tx: ${tx.hash}`);
	console.log(`[interact] gas used: ${receipt.gasUsed.toString()}`);
}

async function actionHistory(ctx, args) {
	const propertyId = parseUint(args.propertyId, "propertyId");
	const mode = args.mode || "count";

	if (mode === "count") {
		const count = await ctx.history.getHistoryCount(propertyId);
		console.log(`[interact] history count for property ${propertyId}: ${count.toString()}`);
		return;
	}

	if (mode === "full") {
		const records = await ctx.history.getFullHistory(propertyId);
		console.log(`[interact] history records for property ${propertyId}:`);
		console.log(records);
		return;
	}

	if (mode === "range") {
		const offset = parseUint(args.offset || "0", "offset");
		const limit = parseUint(args.limit || "10", "limit");
		const records = await ctx.history.getHistoryByRange(propertyId, offset, limit);
		console.log(`[interact] history range for property ${propertyId} offset=${offset} limit=${limit}:`);
		console.log(records);
		return;
	}

	throw new Error("Invalid history mode. Use mode=count|full|range");
}

function printHelp() {
	console.log("Usage: npx hardhat run scripts/interact.js --network <network> -- <action> key=value ...");
	console.log("");
	console.log("Actions:");
	console.log("  register khasra=KH-1 survey=SV-1 plot=PL-1 location='Noida' area=1200 owner=0x...");
	console.log("  get propertyId=1");
	console.log("  request-transfer propertyId=1 toOwner=0x...");
	console.log("  approve-transfer requestId=1");
	console.log("  execute-transfer requestId=1");
	console.log("  direct-transfer propertyId=1 newOwner=0x...");
	console.log("  history propertyId=1 mode=count|full|range offset=0 limit=10");
	console.log("  info");
}

async function main() {
	const action = process.argv[2] || "help";
	const args = parseCliArgs(process.argv.slice(3));
	const [signer] = await hre.ethers.getSigners();

	const ctx = await getContracts();

	console.log(`[interact] network: ${ctx.networkName}`);
	console.log(`[interact] signer: ${await signer.getAddress()}`);
	console.log("[interact] contract addresses:", ctx.addresses);

	if (action === "help") {
		printHelp();
		return;
	}

	if (action === "info") {
		return;
	}

	if (action === "register") {
		await actionRegister(ctx, args, signer);
		return;
	}

	if (action === "get") {
		await actionGet(ctx, args);
		return;
	}

	if (action === "request-transfer") {
		await actionRequestTransfer(ctx, args);
		return;
	}

	if (action === "approve-transfer") {
		await actionApproveTransfer(ctx, args);
		return;
	}

	if (action === "execute-transfer") {
		await actionExecuteTransfer(ctx, args);
		return;
	}

	if (action === "direct-transfer") {
		await actionDirectTransfer(ctx, args);
		return;
	}

	if (action === "history") {
		await actionHistory(ctx, args);
		return;
	}

	throw new Error(`Unknown action: ${action}`);
}

main().catch((error) => {
	console.error("[interact] Failed:");
	console.error(error);
	process.exitCode = 1;
});

