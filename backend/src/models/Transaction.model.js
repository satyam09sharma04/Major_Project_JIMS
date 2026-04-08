import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
	{
		property: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Property",
			required: [true, "Property is required"],
		},
		fromOwner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Current owner is required"],
		},
		toOwner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "New owner is required"],
		},
		transferredAt: {
			type: Date,
			default: Date.now,
		},
		chainTxHash: {
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

transactionSchema.index({ property: 1, transferredAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
