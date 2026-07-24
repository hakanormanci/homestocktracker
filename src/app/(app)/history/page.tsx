"use client";

import { useEffect, useState } from "react";
import { useGroup } from "@/components/group-provider";
import { cn, formatDate } from "@/lib/utils";
import { History, Search, CheckCircle, XCircle } from "lucide-react";

interface HistoryItem {
  id: string;
  name: string;
  quantity: string;
  description: string | null;
  priority: string;
  status: string;
  createdAt: string;
  addedBy: { id: string; username: string };
  boughtBy: { id: string; username: string } | null;
  boughtAt: string | null;
  boughtNotes: string | null;
  cancelledBy: { id: string; username: string } | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
}

export default function HistoryPage() {
  const { activeGroup } = useGroup();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    if (!activeGroup) return;
    fetch(`/api/items?groupId=${activeGroup.id}&flag=INACTIVE`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGroup]);

  const filtered = items.filter((item) => {
    if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.quantity.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.cancelledReason?.toLowerCase().includes(q) ||
        item.boughtNotes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!activeGroup) {
    return (
      <div className="text-center py-10 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Please select or create a group first.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">History</h2>

      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="ALL">All</option>
          <option value="BOUGHT">Bought</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3" />
          <p>No history items found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border p-4",
                item.status === "BOUGHT"
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.status === "BOUGHT" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        item.status === "BOUGHT"
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {item.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                      {item.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold">{item.name}</h3>
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

              {item.status === "BOUGHT" && (
                <div className="mt-2 p-2 bg-white rounded-lg text-xs">
                  <p className="text-green-700">
                    <span className="font-medium">Bought by:</span>{" "}
                    {item.boughtBy?.username}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-medium">Date:</span>{" "}
                    {item.boughtAt ? formatDate(item.boughtAt) : "-"}
                  </p>
                  {item.boughtNotes && (
                    <p className="text-gray-500 mt-1">
                      <span className="font-medium">Notes:</span>{" "}
                      {item.boughtNotes}
                    </p>
                  )}
                </div>
              )}

              {item.status === "CANCELLED" && (
                <div className="mt-2 p-2 bg-white rounded-lg text-xs">
                  <p className="text-gray-700">
                    <span className="font-medium">Cancelled by:</span>{" "}
                    {item.cancelledBy?.username}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-medium">Date:</span>{" "}
                    {item.cancelledAt ? formatDate(item.cancelledAt) : "-"}
                  </p>
                  {item.cancelledReason && (
                    <p className="text-gray-500 mt-1">
                      <span className="font-medium">Reason:</span>{" "}
                      {item.cancelledReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}