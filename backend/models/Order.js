const mongoose = require("mongoose");

// Customer fields are intentionally denormalized onto the order (no populate())
// so that filtering/sorting/searching 100k+ rows stays a single indexed query
// instead of a join, which is the right tradeoff for a read-heavy admin panel.
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },

    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    country: { type: String, required: true },

    itemCount: { type: Number, required: true },
    amount: { type: Number, required: true }, // in smallest currency unit-agnostic decimal
    currency: { type: String, default: "USD" },

    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "paypal", "netbanking", "cod"],
      required: true,
    },

    placedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexes for the exact operations the admin panel performs at scale:
// filtering by status/payment/date range, sorting by amount/date, and text search.
orderSchema.index({ status: 1, placedAt: -1 });
orderSchema.index({ paymentMethod: 1 });
orderSchema.index({ amount: 1 });
orderSchema.index({ placedAt: -1 });
orderSchema.index({ orderNumber: "text", customerName: "text", customerEmail: "text" });

module.exports = mongoose.model("Order", orderSchema);
