"use client";

import { useEffect, useState } from "react";
import { useGroup } from "@/components/group-provider";
import { cn, formatDate } from "@/lib/utils";
import {
  ShoppingCart,
  X,
  Search,
  ArrowUpDown,
  ToggleLeft,
} from "lucide-react";

interface Item {
  id: string;
  name: string;
  quantity: string;
  description: string | null;
  priority: string;
  status: string;
  flag: string;
  createdAt: string;
  addedBy: { id: string; username: string };
}

export default function ShoppingListPage() {
  const { activeGroup } = useGroup();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date-desc");

  // Modal states
  const [boughtModal, setBoughtModal] = useState<string | null>(null);
  const [boughtNotes, setBoughtNotes] = useState("");
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async () => {
    if (!activeGroup) return;
    try {
      const res = await fetch(
        `/api/items?groupId=${activeGroup.id}&flag=ACTIVE`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeGroup]);

  const handleToggleStatus = async (item: Item) => {
    const newStatus = item.status === "OVER" ? "LOW" : "OVER";
    try {
      const res = await fetch(`/api/items/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleMarkBought = async () => {
    if (!boughtModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/items/${boughtModal}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "BOUGHT", boughtNotes }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== boughtModal));
      }
      setBoughtModal(null);
      setBoughtNotes("");
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCancelled = async () => {
    if (!cancelModal || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/items/${cancelModal}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          cancelledReason: cancelReason,
        }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== cancelModal));
      }
      setCancelModal(null);
      setCancelReason("");
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = items
    .filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.quantity.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "priority": {
          const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return (
            (order[a.priority as keyof typeof order] ?? 1) -
            (order[b.priority as keyof typeof order] ?? 1)
          );
        }
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status === "OVER" ? -1 : 1;
        default:
          return 0;
      }
    });

  if (!activeGroup) {
    return (
      <div className="text-center py-10 text-gray-500">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Please select or create a group first.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Shopping List</h2>

      {/* Search & Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="ALL">All</option>
            <option value="OVER">Over (Red)</option>
            <option value="LOW">Low (Orange)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="priority">Priority</option>
            <option value="name">Name (A-Z)</option>
            <option value="status">Status (Over first)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
          <p>No items found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border-2 p-4",
                item.status === "OVER"
                  ? "bg-red-50 border-red-300"
                  : "bg-orange-50 border-orange-300"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold text-white",
                        item.status === "OVER" ? "bg-red-500" : "bg-orange-500"
                      )}
                    >
                      {item.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                      {item.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.quantity}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Added by {item.addedBy.username} &middot;{" "}
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleToggleStatus(item)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ToggleLeft className="w-3.5 h-3.5" />
                  Toggle
                </button>
                <button
                  onClick={() => {
                    setBoughtModal(item.id);
                    setBoughtNotes("");
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Bought
                </button>
                <button
                  onClick={() => {
                    setCancelModal(item.id);
                    setCancelReason("");
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bought Modal */}
      {boughtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3">Mark as Bought</h3>
            <textarea
              value={boughtNotes}
              onChange={(e) => setBoughtNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setBoughtModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkBought}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3">Mark as Cancelled</h3>
            <p className="text-sm text-gray-500 mb-2">
              Reason is required for cancellation.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why are you cancelling this item?"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleMarkCancelled}
                disabled={actionLoading || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}