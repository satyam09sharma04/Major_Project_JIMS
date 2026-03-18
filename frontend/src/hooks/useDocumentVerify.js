import { useCallback, useMemo, useState } from "react";
import api from "../services/api";

const normalizeError = (error, fallback) => {
	if (!error) {
		return fallback;
	}

	return (
		error?.response?.data?.message ||
		error?.data?.message ||
		error?.message ||
		fallback
	);
};

const includesQuery = (value, query) => {
	if (value == null) {
		return false;
	}

	return String(value).toLowerCase().includes(query);
};

const useDocumentVerify = (initialPropertyId = "") => {
	const [propertyId, setPropertyId] = useState(initialPropertyId);
	const [query, setQuery] = useState("");
	const [documents, setDocuments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshingId, setRefreshingId] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");

	const clearMessages = useCallback(() => {
		setError("");
		setInfo("");
	}, []);

	const clearAll = useCallback(() => {
		setPropertyId("");
		setQuery("");
		setDocuments([]);
		setLoading(false);
		setRefreshingId("");
		setError("");
		setInfo("");
	}, []);

	const filteredDocuments = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) {
			return documents;
		}

		return documents.filter((doc) => {
			const fields = [
				doc?.fileName,
				doc?.fileType,
				doc?.verification?.status,
				doc?.verification?.riskLevel,
				doc?.verification?.summary,
				...(Array.isArray(doc?.verification?.flags) ? doc.verification.flags : []),
			];

			return fields.some((value) => includesQuery(value, normalized));
		});
	}, [documents, query]);

	const loadDocuments = useCallback(
		async (nextPropertyId) => {
			const candidate = (nextPropertyId ?? propertyId).trim();

			if (!candidate) {
				setError("Please enter property ID.");
				setDocuments([]);
				return [];
			}

			setLoading(true);
			setError("");
			setInfo("");

			try {
				const response = await api.get(`/documents/property/${candidate}`);
				const list = response?.data?.data || [];
				setPropertyId(candidate);
				setDocuments(list);
				setInfo(`Loaded ${list.length} document(s).`);
				return list;
			} catch (err) {
				const message = normalizeError(err, "Failed to load documents for verification.");
				setError(message);
				setDocuments([]);
				throw new Error(message);
			} finally {
				setLoading(false);
			}
		},
		[propertyId]
	);

	const reRunVerification = useCallback(
		async (documentId) => {
			if (!documentId) {
				return null;
			}

			const activePropertyId = propertyId.trim();
			if (!activePropertyId) {
				setError("Property ID is required before re-running verification.");
				return null;
			}

			setRefreshingId(documentId);
			setError("");
			setInfo("");

			try {
				await api.post(`/verify/${documentId}`);
				const refreshed = await loadDocuments(activePropertyId);
				setInfo("Verification re-run completed.");
				return refreshed;
			} catch (err) {
				if (err?.response?.status === 404) {
					const message =
						"Verify endpoint is not mounted yet. Current page still shows stored verification results.";
					setError(message);
					throw new Error(message);
				}

				const message = normalizeError(err, "Failed to re-run verification.");
				setError(message);
				throw new Error(message);
			} finally {
				setRefreshingId("");
			}
		},
		[loadDocuments, propertyId]
	);

	return {
		propertyId,
		setPropertyId,
		query,
		setQuery,
		documents,
		setDocuments,
		filteredDocuments,
		loading,
		refreshingId,
		error,
		info,
		clearMessages,
		clearAll,
		loadDocuments,
		reRunVerification,
	};
};

export default useDocumentVerify;

