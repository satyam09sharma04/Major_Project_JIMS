require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const {
	PRIVATE_KEY,
	LOCAL_RPC_URL,
	SEPOLIA_RPC_URL,
	AMOY_RPC_URL,
	ETHERSCAN_API_KEY,
	POLYGONSCAN_API_KEY,
	CHAIN_ID_LOCAL,
	CHAIN_ID_SEPOLIA,
	CHAIN_ID_AMOY,
} = process.env;

const hasValidPrivateKey =
	typeof PRIVATE_KEY === "string"
	&& PRIVATE_KEY.trim().length > 0
	&& PRIVATE_KEY.trim() !== "your_private_key_here";

const accounts = hasValidPrivateKey ? [PRIVATE_KEY.trim()] : [];

/** @type import("hardhat/config").HardhatUserConfig */
module.exports = {
	defaultNetwork: "hardhat",
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		hardhat: {
			chainId: Number(CHAIN_ID_LOCAL || 31337),
		},
		localhost: {
			url: LOCAL_RPC_URL || "http://127.0.0.1:8545",
			chainId: Number(CHAIN_ID_LOCAL || 31337),
			accounts,
		},
		sepolia: {
			url: SEPOLIA_RPC_URL || "",
			chainId: Number(CHAIN_ID_SEPOLIA || 11155111),
			accounts,
		},
		amoy: {
			url: AMOY_RPC_URL || "",
			chainId: Number(CHAIN_ID_AMOY || 80002),
			accounts,
		},
	},
	etherscan: {
		apiKey: {
			sepolia: ETHERSCAN_API_KEY || "",
			polygonAmoy: POLYGONSCAN_API_KEY || "",
		},
		customChains: [
			{
				network: "amoy",
				chainId: Number(CHAIN_ID_AMOY || 80002),
				urls: {
					apiURL: "https://api-amoy.polygonscan.com/api",
					browserURL: "https://amoy.polygonscan.com",
				},
			},
		],
	},
	paths: {
		sources: "./contracts",
		tests: "./test",
		cache: "./cache",
		artifacts: "./artifacts",
	},
	mocha: {
		timeout: 60000,
	},
};

