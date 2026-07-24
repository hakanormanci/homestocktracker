"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/components/group-provider";

export default function AddItemPage() {
  const { activeGroup } = useGroup();
  const router = useRouter();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("OVER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) {
      setError("Please select or create a group first");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: activeGroup.id,
          name,
          quantity,
          description,
          priority,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setName("");
      setQuantity("");
      setDescription("");
      setPriority("MEDIUM");
      setStatus("OVER");

      setTimeout(() => {
        setSuccess(false);
        router.push("/shopping-list");
      }, 1500);
    } catch {
      setError("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  if (!activeGroup) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-lg mb-2">No group selected</p>
        <p className="text-sm">Please create or join a group first.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Add Item</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
          Item added successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Milk, Eggs, Bread"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            placeholder="e.g., 2 kg, 3 packs, 1 liter"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brand, store, flavor, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <div className="flex gap-3">
            <label
              className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                status === "OVER"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="status"
                value="OVER"
                checked={status === "OVER"}
                onChange={(e) => setStatus(e.target.value)}
                className="sr-only"
              />
              <span className="font-semibold">Over (Red)</span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                status === "LOW"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="status"
                value="LOW"
                checked={status === "LOW"}
                onChange={(e) => setStatus(e.target.value)}
                className="sr-only"
              />
              <span className="font-semibold">Low (Orange)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Item"}
        </button>
      </form>
    </div>
  );
}