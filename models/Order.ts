import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    variantId: String,
    name: { type: String, required: true },
    variantName: String,
    image: String,
    unitCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineCents: { type: Number, required: true, min: 0 },
    isGift: { type: Boolean, default: false },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    accessTokenHash: { type: String, required: true, select: false },
    items: { type: [OrderItemSchema], required: true },
    subtotalCents: { type: Number, required: true },
    shippingCents: { type: Number, default: 0 },
    totalCents: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
    },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    notes: String,
    paymentMethod: { type: String, default: "manual" },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_payment", index: true },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "customer.email": 1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export const Order: Model<OrderDoc> = models.Order || model("Order", OrderSchema);
