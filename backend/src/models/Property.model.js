import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
	{
		khasraNumber: {
			type: String,
			required: [true, "Khasra number is required"],
			trim: true,
			maxlength: [100, "Khasra number cannot exceed 100 characters"],
		},
		surveyNumber: {
			type: String,
			required: [true, "Survey number is required"],
			trim: true,
			maxlength: [100, "Survey number cannot exceed 100 characters"],
		},
		plotNumber: {
			type: String,
			required: [true, "Plot number is required"],
			trim: true,
			maxlength: [100, "Plot number cannot exceed 100 characters"],
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Owner is required"],
		},
		location: {
			type: String,
			required: [true, "Location is required"],
			trim: true,
			maxlength: [255, "Location cannot exceed 255 characters"],
		},
		area: {
			type: Number,
			required: [true, "Area is required"],
			min: [0.01, "Area must be greater than 0"],
		},
		chainPropertyId: {
			type: String,
			trim: true,
			index: true,
		},
		chainTxHash: {
			type: String,
			trim: true,
			default: "",
		},
		ownerWallet: {
			type: String,
			trim: true,
			default: "",
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

propertySchema.index({ owner: 1, createdAt: -1 });

const Property = mongoose.model("Property", propertySchema);

export default Property;
