import api from "./api";

export const transferOwnership = async ({ propertyId, newOwnerId, newOwnerWallet, chainTxHash }) => {
	const response = await api.post("/transfer", {
		propertyId: String(propertyId || "").trim(),
		newOwnerId: String(newOwnerId || "").trim(),
		newOwnerWallet: String(newOwnerWallet || "").trim(),
		chainTxHash: String(chainTxHash || "").trim(),
	});

	return response.data;
};

export default {
	transferOwnership,
};
