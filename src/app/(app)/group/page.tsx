"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGroup } from "@/components/group-provider";
import { cn } from "@/lib/utils";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Crown,
  LogOut,
} from "lucide-react";

interface Member {
  id: string;
  username: string;
  email: string;
}

interface GroupDetail {
  id: string;
  name: string;
  members: { role: string; user: Member }[];
}

export default function GroupPage() {
  const { user, logout } = useAuth();
  const { groups, activeGroup, setActiveGroup, refresh } = useGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [addUsername, setAddUsername] = useState("");
  const [renameMode, setRenameMode] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGroupDetail = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      setGroupDetail(data.group);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeGroup) {
      fetchGroupDetail(activeGroup.id);
    }
  }, [activeGroup]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      await refresh();
      setNewGroupName("");
      setShowCreate(false);
    } catch {
      setError("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: addUsername }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      setAddUsername("");
      fetchGroupDetail(activeGroup.id);
    } catch {
      setError("Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (username: string) => {
    if (!activeGroup) return;
    if (!confirm(`Remove ${username} from the group?`)) return;
    try {
      await fetch(
        `/api/groups/${activeGroup.id}/members?username=${username}`,
        { method: "DELETE" }
      );
      fetchGroupDetail(activeGroup.id);
    } catch {
      // ignore
    }
  };

  const handleRename = async () => {
    if (!activeGroup || !renameValue.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/groups/${activeGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue }),
      });
      await refresh();
      setRenameMode(false);
      fetchGroupDetail(activeGroup.id);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup) return;
    if (!confirm("Delete this group permanently?")) return;
    try {
      await fetch(`/api/groups/${activeGroup.id}`, { method: "DELETE" });
      await refresh();
      setGroupDetail(null);
    } catch {
      // ignore
    }
  };

  const isAdmin =
    groupDetail?.members.find((m) => m.user.id === user?.id)?.role === "ADMIN";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Groups</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
        >
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreateGroup}
          className="bg-white rounded-lg border p-4 mb-4"
        >
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Group selector */}
      {groups.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Active Group</label>
          <select
            value={activeGroup?.id || ""}
            onChange={(e) => {
              const g = groups.find((g) => g.id === e.target.value);
              if (g) setActiveGroup(g);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Group detail */}
      {groupDetail && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            {renameMode ? (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleRename}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setRenameMode(false)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-lg">{groupDetail.name}</h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setRenameMode(true);
                      setRenameValue(groupDetail.name);
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Rename
                  </button>
                )}
              </>
            )}
          </div>

          {/* Members */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Members ({groupDetail.members.length})
            </h4>
            <div className="space-y-2">
              {groupDetail.members.map((m) => (
                <div
                  key={m.user.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {m.user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {m.user.username}
                        {m.user.id === user?.id && (
                          <span className="text-gray-400 ml-1">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.role === "ADMIN" && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {isAdmin && m.user.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.user.username)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add member */}
          {isAdmin && (
            <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
              <input
                type="text"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="Add member by username"
                required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Danger zone */}
          {isAdmin && (
            <div className="border-t pt-3">
              <button
                onClick={handleDeleteGroup}
                className="flex items-center gap-1 text-sm text-red-600 hover:underline"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            </div>
          )}
        </div>
      )}

      {/* User info & logout */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}