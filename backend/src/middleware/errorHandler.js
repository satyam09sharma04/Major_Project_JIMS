export const notFoundHandler = (req, _res, next) => {
	const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
	error.statusCode = 404;
	next(error);
};

export const errorHandler = (error, _req, res, _next) => {
	const statusCode = error.statusCode ?? 500;
	return res.status(statusCode).json({
		message: error.message || "Internal Server Error",
	});
};

