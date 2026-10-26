import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: "customer" | "admin" | "user";
  addresses: string[];
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PAKISTAN_PHONE_REGEX = /^(?:\+92|0092|0)?(3\d{9})$/;

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (v: string) {
          // Normalize spaces/dashes before regex check
          const cleaned = v.replace(/[\s-]/g, "");
          return PAKISTAN_PHONE_REGEX.test(cleaned);
        },
        message: (props: { value: string }) =>
          `"${props.value}" is not a valid Pakistani mobile number. Must be in format 03XXXXXXXXX or +923XXXXXXXXX.`,
      },
      index: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["customer", "admin", "user"],
      default: "customer",
    },
    addresses: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in Next.js hot reloading
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
