import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadDir = path.resolve("uploads/documents");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		const safeName = file.originalname.replace(/\s+/g, "_");
		cb(null, `${Date.now()}-${safeName}`);
	},
});

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]);

const fileFilter = (_req, file, cb) => {
	if (!allowedMimeTypes.has(file.mimetype)) {
		const error = new Error("Only PDF and image files are allowed");
		error.statusCode = 400;
		cb(error);
		return;
	}

	cb(null, true);
};

const uploader = multer({
	storage,
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
	fileFilter,
});

export const uploadSingleDocument = uploader.single("document");

