/**
 * UserList (cart/wishlist) model.
 *
 * Follows docs/DATA_RULES.md: optional fields carry `default: "" | false`
 * so older documents never expose `undefined` to API consumers.
 */

import { IUserList } from "@/interface/list.interface";
import { Schema, model, models, Types } from "mongoose";

const UserListSchema = new Schema<IUserList>(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: [
      {
        type: Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    listType: {
      type: String,
      enum: ["add-cart", "wish-list"],
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30,
    },
  },
  {
    timestamps: true,
  }
);

const UserList =
  models.UserList || model<IUserList>("UserList", UserListSchema);
export default UserList;
