import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
	{
		property: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Property",
			required: [true, "Property reference is required"],
		},
		fileName: {
			type: String,
			required: [true, "File name is required"],
			trim: true,
		},
		filePath: {
			type: String,
			required: [true, "File path is required"],
			trim: true,
		},
		fileType: {
			type: String,
			required: [true, "File type is required"],
			enum: {
				values: ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"],
				message: "Only PDF and image files are allowed",
			},
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
		verification: {
			status: {
				type: String,
				enum: ["PENDING", "COMPLETED", "FAILED"],
				default: "PENDING",
			},
			riskScore: {
				type: Number,
				min: 0,
				max: 100,
			},
			riskLevel: {
				type: String,
				enum: ["LOW", "MEDIUM", "HIGH"],
			},
			source: {
				type: String,
				enum: ["ai", "heuristic"],
			},
			matchPercentage: {
				type: Number,
				min: 0,
				max: 100,
			},
			matchedFields: {
				type: mongoose.Schema.Types.Mixed,
			},
			flags: {
				type: [String],
				default: [],
			},
			summary: {
				type: String,
				default: "",
			},
			extractedText: {
				type: String,
				default: "",
			},
			verifiedAt: {
				type: Date,
			},
			errorMessage: {
				type: String,
				default: "",
			},
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

documentSchema.index({ property: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
