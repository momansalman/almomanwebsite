import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  urduName?: string;
  category: string;
  price: number;
  packSize: string;
  description: string;
  image: string;
  inStock: boolean;
  featured?: boolean;
  availableSizes?: string[];
  availableHeights?: string[];
  availableWidths?: string[];
  availablePackSizes?: string[];
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    urduName: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    packSize: {
      type: String,
      required: true,
      default: "12 Pieces",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    availableSizes: {
      type: [String],
      default: [],
    },
    availableHeights: {
      type: [String],
      default: [],
    },
    availableWidths: {
      type: [String],
      default: [],
    },
    availablePackSizes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
