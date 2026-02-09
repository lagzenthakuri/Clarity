import mongoose, { InferSchemaType, Model } from "mongoose";

export const transactionCategories = [
  "Food",
  "Transportation",
  "Housing",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Education",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
] as const;

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      enum: transactionCategories,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export type TransactionDocument = InferSchemaType<typeof transactionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type TransactionModel = Model<TransactionDocument>;

const Transaction = mongoose.model<TransactionDocument, TransactionModel>(
  "Transaction",
  transactionSchema
);

export default Transaction;
