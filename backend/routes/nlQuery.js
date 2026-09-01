const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

const SYSTEM_INSTRUCTION = `You convert a plain-English request about e-commerce orders into a JSON filter object.
Only output raw JSON, nothing else — no markdown, no explanation.

Allowed keys (all optional, omit any that don't apply):
- status: one of "pending","processing","shipped","delivered","cancelled","refunded"
- paymentMethod: one of "card","upi","paypal","netbanking","cod"
- minAmount: number
- maxAmount: number
- startDate: ISO date string (YYYY-MM-DD)
- endDate: ISO date string (YYYY-MM-DD)
- search: string (for names, emails, order numbers)

Today's date is ${new Date().toISOString().slice(0, 10)}. Resolve relative dates
("last month", "this week", "past 7 days") against today's date.

Example: "pending orders over 5000 from last month"
-> {"status":"pending","minAmount":5000,"startDate":"2026-08-01","endDate":"2026-08-31"}`;

// @route   POST /api/orders/nl-query
// Turns a plain-English sentence into the same filter shape /api/orders already
// accepts as query params — the frontend just merges this into its filter state.
router.post("/nl-query", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message:
          "Natural-language search isn't configured. Add GEMINI_API_KEY to enable it.",
      });
    }

    const { query } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ message: "query is required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(query);
    const text = result.response
      .text()
      .trim()
      .replace(/^```json\s*|```$/g, "");

    let filters;
    try {
      filters = JSON.parse(text);
    } catch {
      return res
        .status(502)
        .json({ message: "Couldn't parse the AI response into filters" });
    }

    res.json({ filters });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Natural-language query failed", error: err.message });
  }
});

module.exports = router;
