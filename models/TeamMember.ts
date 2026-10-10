import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TeamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    bio: { type: String, default: "" },
    photo: { type: String, default: "" },
    visible: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    imageRefs: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

export type TeamMemberDoc = InferSchemaType<typeof TeamMemberSchema>;
export const TeamMember: Model<TeamMemberDoc> =
  models.TeamMember || model("TeamMember", TeamMemberSchema);
