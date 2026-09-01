import { useState } from "react";
import api from "../api/axios";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_OPTIONS = ["card", "upi", "paypal", "netbanking", "cod"];

const LABELS = {
  status: "Status",
  paymentMethod: "Payment",
  minAmount: "Min $",
  maxAmount: "Max $",
  startDate: "From",
  endDate: "To",
  search: "Search",
};

export default function FiltersBar({ filters, setFilters }) {
  const [nlQuery, setNlQuery] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState("");

  const update = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const removeFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleNlSubmit = async (e) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    setNlLoading(true);
    setNlError("");
    try {
      const { data } = await api.post("/orders/nl-query", { query: nlQuery });
      setFilters((prev) => ({ ...prev, ...data.filters }));
      setNlQuery("");
    } catch (err) {
      setNlError(err.response?.data?.message || "Couldn't parse that query.");
    } finally {
      setNlLoading(false);
    }
  };

  const activeEntries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== "");

  return (
    <div>
      <form className="nl-search-bar" onSubmit={handleNlSubmit}>
        <input
          value={nlQuery}
          onChange={(e) => setNlQuery(e.target.value)}
          placeholder='Try: "pending orders over 500 from last month"'
        />
        <button type="submit" disabled={nlLoading}>
          {nlLoading ? "Thinking…" : "Ask AI"}
        </button>
      </form>
      {nlError && <div className="form-error">{nlError}</div>}

      <div className="controls-bar">
        <input
          className="search-input"
          placeholder="Search order #, name, or email…"
          value={filters.search || ""}
          onChange={(e) => update("search", e.target.value)}
        />
        <select value={filters.status || ""} onChange={(e) => update("status", e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filters.paymentMethod || ""} onChange={(e) => update("paymentMethod", e.target.value)}>
          <option value="">All payments</option>
          {PAYMENT_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min $"
          style={{ width: 90 }}
          value={filters.minAmount || ""}
          onChange={(e) => update("minAmount", e.target.value)}
        />
        <input
          type="number"
          placeholder="Max $"
          style={{ width: 90 }}
          value={filters.maxAmount || ""}
          onChange={(e) => update("maxAmount", e.target.value)}
        />
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => update("startDate", e.target.value)}
        />
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => update("endDate", e.target.value)}
        />
      </div>

      {activeEntries.length > 0 && (
        <div className="active-filters">
          {activeEntries.map(([key, value]) => (
            <span key={key} className="filter-chip">
              {LABELS[key] || key}: {String(value)}
              <button onClick={() => removeFilter(key)}>×</button>
            </span>
          ))}
          <button className="clear-filters" onClick={() => setFilters({})}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
