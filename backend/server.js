require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const nlQueryRoutes = require("./routes/nlQuery");

connectDB();

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "orderscale-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orders", nlQueryRoutes); // adds POST /api/orders/nl-query

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`OrderScale server running on port ${PORT}`));
