import { FixedSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import AutoSizer from "react-virtualized-auto-sizer";
import api from "../api/axios";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

const COLUMNS = [
  { key: "orderNumber", label: "Order #" },
  { key: "customerName", label: "Customer" },
  { key: "itemCount", label: "Items" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "paymentMethod", label: "Payment" },
  { key: "placedAt", label: "Placed" },
  { key: "_actions", label: "" },
];

function formatMoney(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function OrdersTable({
  orders,
  total,
  hasMore,
  loadMore,
  sortBy,
  sortDir,
  onSort,
  onStatusChange,
}) {
  const itemCount = hasMore ? orders.length + 1 : orders.length;
  const isItemLoaded = (index) => !hasMore || index < orders.length;

  const handleStatusChange = async (order, newStatus) => {
    onStatusChange(order._id, newStatus); // optimistic update
    try {
      await api.patch(`/orders/${order._id}/status`, { status: newStatus });
    } catch {
      onStatusChange(order._id, order.status); // revert on failure
    }
  };

  const Row = ({ index, style }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="loading-row">
          Loading more…
        </div>
      );
    }

    const order = orders[index];
    return (
      <div style={style} className="table-row">
        <div className="cell-order">{order.orderNumber}</div>
        <div className="cell-customer">
          <span className="cname">{order.customerName}</span>
          <span className="cemail">{order.customerEmail}</span>
        </div>
        <div>{order.itemCount}</div>
        <div className="cell-amount">{formatMoney(order.amount, order.currency)}</div>
        <div>
          <span className={`status-badge status-${order.status}`}>{order.status}</span>
        </div>
        <div className="cell-payment">{order.paymentMethod}</div>
        <div className="cell-date">{formatDate(order.placedAt)}</div>
        <div>
          <select
            className="status-select"
            value={order.status}
            onChange={(e) => handleStatusChange(order, e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const isSortable = (key) => ["amount", "placedAt", "customerName", "status"].includes(key);

  return (
    <div className="table-wrap">
      <div className="table-header">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`${isSortable(col.key) ? "sortable" : ""} ${sortBy === col.key ? "active" : ""}`}
            onClick={() => isSortable(col.key) && onSort(col.key)}
          >
            {col.label}
            {sortBy === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {orders.length === 0 ? (
          <div className="empty-row">No orders match these filters.</div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <InfiniteLoader
                isItemLoaded={isItemLoaded}
                itemCount={itemCount}
                loadMoreItems={hasMore ? loadMore : () => {}}
                threshold={20}
              >
                {({ onItemsRendered, ref }) => (
                  <FixedSizeList
                    height={height}
                    width={width}
                    itemCount={itemCount}
                    itemSize={52}
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                  >
                    {Row}
                  </FixedSizeList>
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        )}
      </div>

      <div className="table-footer">
        <span>
          Showing {orders.length.toLocaleString()} of {total.toLocaleString()} orders
        </span>
        <span>Rows render virtualized — only visible rows exist in the DOM</span>
      </div>
    </div>
  );
}
