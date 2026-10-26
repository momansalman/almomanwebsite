import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  user?: mongoose.Types.ObjectId;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  productName?: string;
  verifiedCustomer: boolean;
  status: "approved" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      default: "Overall Experience",
    },
    verifiedCustomer: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["approved", "pending"],
      default: "approved",
    },
  },
  {
    timestamps: true,
  }
);

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
