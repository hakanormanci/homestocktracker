"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Group {
  id: string;
  name: string;
  role: string;
}

interface GroupContextType {
  groups: Group[];
  activeGroup: Group | null;
  loading: boolean;
  setActiveGroup: (group: Group) => void;
  refresh: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType>({
  groups: [],
  activeGroup: null,
  loading: true,
  setActiveGroup: () => {},
  refresh: async () => {},
});

export function useGroup() {
  return useContext(GroupContext);
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroupState] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
        const savedId = localStorage.getItem("activeGroupId");
        const found = data.groups.find((g: Group) => g.id === savedId);
        if (found) {
          setActiveGroupState(found);
        } else if (data.groups.length > 0) {
          setActiveGroupState(data.groups[0]);
          localStorage.setItem("activeGroupId", data.groups[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const setActiveGroup = (group: Group) => {
    setActiveGroupState(group);
    localStorage.setItem("activeGroupId", group.id);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <GroupContext.Provider
      value={{ groups, activeGroup, loading, setActiveGroup, refresh }}
    >
      {children}
    </GroupContext.Provider>
  );
}