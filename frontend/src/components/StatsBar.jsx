function formatCurrency(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

export default function StatsBar({ stats }) {
  if (!stats) return null;

  const byStatus = Object.fromEntries(stats.byStatus.map((s) => [s.status, s.count]));

  const cards = [
    { label: "Total orders", value: stats.totalOrders.toLocaleString(), cls: "" },
    { label: "Total revenue", value: formatCurrency(stats.totalRevenue), cls: "" },
    { label: "Pending", value: (byStatus.pending || 0).toLocaleString(), cls: "status-pending" },
    { label: "Delivered", value: (byStatus.delivered || 0).toLocaleString(), cls: "status-delivered" },
    { label: "Cancelled/refunded", value: ((byStatus.cancelled || 0) + (byStatus.refunded || 0)).toLocaleString(), cls: "status-cancelled" },
  ];

  return (
    <div className="stat-row">
      {cards.map((c) => (
        <div key={c.label} className={`stat-card ${c.cls}`}>
          <div className="label">{c.label}</div>
          <div className="value">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
