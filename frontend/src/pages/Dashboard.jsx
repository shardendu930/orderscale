import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../hooks/useOrders";
import StatsBar from "../components/StatsBar";
import FiltersBar from "../components/FiltersBar";
import OrdersTable from "../components/OrdersTable";

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("placedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [stats, setStats] = useState(null);

  const { orders, total, hasMore, loading, loadMore, updateOrderStatus } = useOrders(
    filters,
    sortBy,
    sortDir
  );

  useEffect(() => {
    api.get("/orders/stats", { params: filters }).then(({ data }) => setStats(data));
  }, [filters]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <div className="brand">
          Order<span className="dot">Scale</span>
        </div>
        <div className="right">
          <span>{admin?.email}</span>
          <button className="logout-link" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className="dash-body">
        <StatsBar stats={stats} />
        <FiltersBar filters={filters} setFilters={setFilters} />

        {loading ? (
          <div className="table-wrap">
            <div className="loading-row">Loading orders…</div>
          </div>
        ) : (
          <OrdersTable
            orders={orders}
            total={total}
            hasMore={hasMore}
            loadMore={loadMore}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            onStatusChange={updateOrderStatus}
          />
        )}
      </div>
    </div>
  );
}
