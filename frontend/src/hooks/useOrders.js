import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";

const PAGE_SIZE = 150;

export function useOrders(filters, sortBy, sortDir) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToFetch, reset) => {
      const myRequestId = ++requestId.current;
      if (reset) setLoading(true);

      const params = { ...filters, page: pageToFetch, limit: PAGE_SIZE, sortBy, sortDir };
      const { data } = await api.get("/orders", { params });

      if (myRequestId !== requestId.current) return; // a newer request superseded this one

      setOrders((prev) => (reset ? data.orders : [...prev, ...data.orders]));
      setTotal(data.total);
      setPage(data.page);
      setHasMore(data.page < data.totalPages);
      setLoading(false);
    },
    [filters, sortBy, sortDir]
  );

  // Filters or sort changed — reset and refetch from page 1
  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore) return Promise.resolve();
    return fetchPage(page + 1, false);
  }, [fetchPage, hasMore, page]);

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
  }, []);

  return { orders, total, hasMore, loading, loadMore, updateOrderStatus };
}
