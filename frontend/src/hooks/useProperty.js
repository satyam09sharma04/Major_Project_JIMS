import { useCallback, useMemo, useState } from "react";
import { toApiErrorMessage } from "../services/api";
import {
	createProperty,
	getAllProperties,
	getPropertyById,
	updateProperty,
} from "../services/propertyService";
import { transferOwnership as transferOwnershipApi } from "../services/transferService";

const useProperty = () => {
	const [properties, setProperties] = useState([]);
	const [selectedProperty, setSelectedProperty] = useState(null);
	const [transferResult, setTransferResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const clearMessages = useCallback(() => {
		setError("");
		setSuccess("");
	}, []);

	const reset = useCallback(() => {
		setProperties([]);
		setSelectedProperty(null);
		setTransferResult(null);
		setLoading(false);
		setError("");
		setSuccess("");
	}, []);

	const runAction = useCallback(async (action, fallbackError) => {
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			return await action();
		} catch (err) {
			const message = toApiErrorMessage(err, fallbackError);
			setError(message);
			throw new Error(message);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadProperties = useCallback(async () => {
		const list = await runAction(async () => {
			const response = await getAllProperties();
			return response?.data || [];
		}, "Could not load properties");

		setProperties(list);
		setSuccess(`Loaded ${list.length} propert${list.length === 1 ? "y" : "ies"}.`);
		return list;
	}, [runAction]);

	const loadPropertyById = useCallback(
		async (propertyId) => {
			const id = String(propertyId || "").trim();
			if (!id) {
				setError("Property ID is required.");
				setSelectedProperty(null);
				return null;
			}

			const property = await runAction(async () => {
				const response = await getPropertyById(id);
				return response?.data || null;
			}, "Could not load property details");

			setSelectedProperty(property);
			return property;
		},
		[runAction]
	);

	const createNewProperty = useCallback(
		async (payload) => {
			const created = await runAction(async () => {
				const response = await createProperty(payload);
				return response?.data || null;
			}, "Failed to create property.");

			setSuccess("Property created successfully.");
			if (created) {
				setProperties((prev) => [created, ...prev]);
				setSelectedProperty(created);
			}

			return created;
		},
		[runAction]
	);

	const editProperty = useCallback(
		async (propertyId, payload) => {
			const id = String(propertyId || "").trim();
			if (!id) {
				setError("Property ID is required.");
				return null;
			}

			const updated = await runAction(async () => {
				const response = await updateProperty(id, payload);
				return response?.data || null;
			}, "Failed to update property.");

			setSuccess("Property updated successfully.");

			if (updated) {
				setProperties((prev) => prev.map((item) => (item?._id === updated?._id ? updated : item)));
				setSelectedProperty((prev) => (prev?._id === updated?._id ? updated : prev));
			}

			return updated;
		},
		[runAction]
	);

	const transferOwnership = useCallback(
		async ({ propertyId, newOwnerId }) => {
			const pid = String(propertyId || "").trim();
			const ownerId = String(newOwnerId || "").trim();

			if (!pid || !ownerId) {
				setError("Property ID and New Owner ID are required.");
				return null;
			}

			const payload = await runAction(async () => {
				const response = await transferOwnershipApi({ propertyId: pid, newOwnerId: ownerId });
				return response?.data || null;
			}, "Failed to transfer ownership.");

			setTransferResult(payload);
			setSuccess("Ownership transferred successfully.");

			const nextProperty = payload?.property || null;
			if (nextProperty?._id) {
				setProperties((prev) => prev.map((item) => (item?._id === nextProperty._id ? nextProperty : item)));
				setSelectedProperty((prev) => (prev?._id === nextProperty._id ? nextProperty : prev));
			}

			return payload;
		},
		[runAction]
	);

	return useMemo(
		() => ({
			properties,
			selectedProperty,
			transferResult,
			loading,
			error,
			success,
			clearMessages,
			reset,
			setProperties,
			setSelectedProperty,
			loadProperties,
			loadPropertyById,
			createNewProperty,
			editProperty,
			transferOwnership,
		}),
		[
			clearMessages,
			createNewProperty,
			editProperty,
			error,
			loadProperties,
			loadPropertyById,
			loading,
			properties,
			reset,
			selectedProperty,
			success,
			transferOwnership,
			transferResult,
		]
	);
};

export default useProperty;

