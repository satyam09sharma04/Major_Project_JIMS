import { getPropertyHistoryTimeline } from "../services/history.service.js";

export const getPropertyHistory = async (req, res, next) => {
	try {
		const propertyId = req.params?.propertyId ?? req.query?.propertyId;
		const history = await getPropertyHistoryTimeline(propertyId);

		return res.status(200).json({
			message: "Property ownership timeline fetched successfully",
			data: history,
		});
	} catch (error) {
		return next(error);
	}
};
