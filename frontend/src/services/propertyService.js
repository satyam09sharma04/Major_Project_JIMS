import api from "./api";

export const createProperty = async (payload) => {
	const response = await api.post("/properties", payload);
	return response.data;
};

export const getAllProperties = async () => {
	const response = await api.get("/properties");
	return response.data;
};

export const getPropertyById = async (propertyId) => {
	const response = await api.get(`/properties/${propertyId}`);
	return response.data;
};

export const updateProperty = async (propertyId, payload) => {
	const response = await api.put(`/properties/${propertyId}`, payload);
	return response.data;
};
