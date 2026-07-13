/**
 * SubCategory model.
 *
 * Follows docs/DATA_RULES.md: optional fields carry `default: "" | false`
 * so older documents never expose `undefined` to API consumers.
 */

import { ISubCategory } from "@/interface/sub-category.interace";
import { Schema, models, model } from "mongoose";

const SubCategorySchema = new Schema<ISubCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    note: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SubCategory =
  models.SubCategory || model<ISubCategory>("SubCategory", SubCategorySchema);

export default SubCategory;
