import mongoose, { InferSchemaType, Model } from "mongoose";
import { transactionCategories } from "./transaction";

const dailyPresetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
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
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 180,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export type DailyPresetDocument = InferSchemaType<typeof dailyPresetSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type DailyPresetModel = Model<DailyPresetDocument>;

const DailyPreset = mongoose.model<DailyPresetDocument, DailyPresetModel>(
  "DailyPreset",
  dailyPresetSchema
);

export default DailyPreset;
