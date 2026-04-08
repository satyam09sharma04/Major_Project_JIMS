const { spawn } = require("child_process");
const path = require("path");

const blockchainDir = path.resolve(__dirname, "..");

const runDeploy = () => {
	return new Promise((resolve, reject) => {
		const deploy = spawn("npx", ["hardhat", "run", "scripts/deploy.js", "--network", "localhost"], {
			cwd: blockchainDir,
			stdio: "inherit",
			shell: true,
		});

		deploy.on("exit", (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(new Error(`Deploy failed with exit code ${code}`));
		});
	});
};

const main = async () => {
	console.log("[bootstrap] Starting local Hardhat node...");
	const node = spawn("npx", ["hardhat", "node"], {
		cwd: blockchainDir,
		stdio: ["ignore", "pipe", "pipe"],
		shell: true,
	});

	let deployed = false;

	node.stdout.on("data", async (chunk) => {
		const text = chunk.toString();
		process.stdout.write(text);

		if (!deployed && text.includes("Started HTTP and WebSocket JSON-RPC server")) {
			deployed = true;
			try {
				console.log("[bootstrap] Node ready. Deploying contracts...");
				await runDeploy();
				console.log("[bootstrap] Contracts deployed. Keep this terminal running.");
			} catch (error) {
				console.error("[bootstrap] Deployment failed:", error.message);
				node.kill("SIGTERM");
				process.exit(1);
			}
		}
	});

	node.stderr.on("data", (chunk) => {
		process.stderr.write(chunk.toString());
	});

	node.on("exit", (code) => {
		console.log(`[bootstrap] Hardhat node exited with code ${code}`);
		process.exit(code || 0);
	});
};

main().catch((error) => {
	console.error("[bootstrap] Fatal error:", error);
	process.exit(1);
});
