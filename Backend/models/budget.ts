import mongoose, { InferSchemaType, Model } from "mongoose";

export const budgetPeriods = ["now", "week", "month"] as const;

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    period: {
      type: String,
      enum: budgetPeriods,
      required: true,
      default: "month",
    },
    startDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1 }, { unique: true });

export type BudgetDocument = InferSchemaType<typeof budgetSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type BudgetModel = Model<BudgetDocument>;

const Budget = mongoose.model<BudgetDocument, BudgetModel>("Budget", budgetSchema);

export default Budget;
