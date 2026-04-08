import api from "./api";

export const uploadDocument = async ({ propertyId, file }) => {
	const formData = new FormData();
	formData.append("propertyId", String(propertyId || "").trim());
	formData.append("document", file);

	const response = await api.post("/documents/upload", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});

	return response.data;
};

export const getDocumentsByPropertyId = async (propertyId) => {
	const response = await api.get(`/documents/property/${String(propertyId || "").trim()}`);
	return response.data;
};

export const verifyDocumentById = async (documentId) => {
	const response = await api.post(`/verify/${String(documentId || "").trim()}`);
	return response.data;
};
