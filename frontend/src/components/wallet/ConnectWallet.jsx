import { useMemo } from "react";
import { useWallet } from "../../context/WalletContext";

const shortAddress = (address = "") => {
	if (!address || address.length < 10) {
		return address;
	}

	return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ConnectWallet = ({ onConnected, onDisconnected, className = "", style = {} }) => {
	const { account, chainId, loading, error, isConnected, connectWallet, disconnectWallet } = useWallet();


	const buttonLabel = useMemo(() => {
		if (loading) {
			return "Connecting...";
		}

		if (isConnected) {
			return `Connected: ${shortAddress(account)}`;
		}

		return "Connect MetaMask";
	}, [account, isConnected, loading]);

	const handleConnect = async () => {
		const result = await connectWallet();
		if (result?.account) {
			onConnected?.({ account: result.account, chainId: result.chainId || "" });
		}
	};

	const handleDisconnect = () => {
		disconnectWallet();
		onDisconnected?.();
	};

	return (
		<div className={className} style={{ fontFamily: "sans-serif", ...style }}>
			<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
				<button
					type="button"
					onClick={isConnected ? handleDisconnect : handleConnect}
					disabled={loading}
					style={{
						padding: "10px 14px",
						borderRadius: 8,
						border: "1px solid #0f172a",
						background: isConnected ? "#ffffff" : "#0f172a",
						color: isConnected ? "#0f172a" : "#ffffff",
						cursor: loading ? "not-allowed" : "pointer",
						fontSize: 13,
						fontWeight: 700,
					}}
				>
					{isConnected ? "Disconnect" : buttonLabel}
				</button>

				{isConnected ? (
					<span style={{ fontSize: 13, color: "#475569" }}>
						{shortAddress(account)} {chainId ? `| Chain: ${chainId}` : ""}
					</span>
				) : null}
			</div>

			{error ? <p style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</p> : null}
		</div>
	);
};

export default ConnectWallet;
