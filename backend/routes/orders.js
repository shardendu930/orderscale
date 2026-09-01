const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

const MAX_PAGE_SIZE = 200;

function buildFilter(query) {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.country) filter.country = query.country;

  if (query.minAmount || query.maxAmount) {
    filter.amount = {};
    if (query.minAmount) filter.amount.$gte = Number(query.minAmount);
    if (query.maxAmount) filter.amount.$lte = Number(query.maxAmount);
  }

  if (query.startDate || query.endDate) {
    filter.placedAt = {};
    if (query.startDate) filter.placedAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.placedAt.$lte = new Date(query.endDate);
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
}

// @route   GET /api/orders
// Server-side pagination + filtering + sorting — the whole point of this app
// is that this endpoint stays fast whether there are 100 rows or 1,000,000.
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, parseInt(req.query.limit) || 100);
    const sortBy = ["amount", "placedAt", "customerName", "status"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "placedAt";
    const sortDir = req.query.sortDir === "asc" ? 1 : -1;

    const filter = buildFilter(req.query);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// @route   GET /api/orders/stats
// Aggregation pipeline for the dashboard header — computed in MongoDB, not
// by pulling rows into Node and summing them in JS.
router.get("/stats", async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    const [statusBreakdown, totals] = await Promise.all([
      Order.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      ]),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      totalOrders: totals[0]?.totalOrders || 0,
      totalRevenue: totals[0]?.totalRevenue || 0,
      byStatus: statusBreakdown.map((s) => ({ status: s._id, count: s.count, revenue: s.revenue })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to compute stats", error: err.message });
  }
});

// @route   GET /api/orders/:id
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order", error: err.message });
  }
});

// @route   PATCH /api/orders/:id/status
// Inline-edit endpoint used directly from the table row.
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
});

module.exports = router;
