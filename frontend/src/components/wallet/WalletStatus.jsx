import { useMemo } from "react";
import { useWallet } from "../../context/WalletContext";

const CHAIN_NAMES = {
	"0x1": "Ethereum Mainnet",
	"0x89": "Polygon Mainnet",
	"0x13881": "Polygon Mumbai",
	"0xaa36a7": "Sepolia",
	"0x539": "Localhost 8545",
	"0x7a69": "Hardhat Local",
};

const formatAddress = (address = "") => {
	if (!address || address.length < 10) {
		return address || "-";
	}

	return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const WalletStatus = ({ account: accountProp, chainId: chainIdProp, className = "", style = {} }) => {
	const wallet = useWallet();
	const account = accountProp ?? wallet.account;
	const chainId = chainIdProp ?? wallet.chainId;
	const balance = wallet.balance;
	const loading = wallet.loading;
	const error = wallet.error;
	const connected = Boolean(account);

	const chainName = useMemo(() => {
		if (!chainId) {
			return "-";
		}

		return CHAIN_NAMES[chainId] || `Unknown (${chainId})`;
	}, [chainId]);

	return (
		<section
			className={className}
			style={{
				border: "1px solid #e2e8f0",
				borderRadius: 12,
				padding: 12,
				background: "#ffffff",
				fontFamily: "sans-serif",
				...style,
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
				<h4 style={{ margin: 0, color: "#0f172a", fontSize: 15 }}>Wallet Status</h4>
				<span
					style={{
						padding: "4px 8px",
						borderRadius: 999,
						fontSize: 12,
						fontWeight: 700,
						background: connected ? "#dcfce7" : "#e2e8f0",
						color: connected ? "#166534" : "#334155",
					}}
				>
					{connected ? "Connected" : "Disconnected"}
				</span>
			</div>

			<div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, color: "#334155" }}>
				<div>
					<strong>Address:</strong> {formatAddress(account)}
				</div>
				<div>
					<strong>Network:</strong> {chainName}
				</div>
				<div>
					<strong>Balance:</strong> {connected ? `${balance} ETH` : "-"}
				</div>
			</div>

			<div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
				<button
					type="button"
					onClick={() => wallet.syncWallet()}
					disabled={loading}
					style={{
						padding: "7px 10px",
						borderRadius: 8,
						border: "1px solid #cbd5e1",
						background: "#ffffff",
						cursor: loading ? "not-allowed" : "pointer",
						fontSize: 12,
					}}
				>
					{loading ? "Refreshing..." : "Refresh"}
				</button>
			</div>

			{error ? <p style={{ marginTop: 8, marginBottom: 0, color: "#b91c1c", fontSize: 12 }}>{error}</p> : null}
		</section>
	);
};

export default WalletStatus;
