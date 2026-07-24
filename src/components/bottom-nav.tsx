"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PlusCircle,
  ShoppingCart,
  History,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/add-item", label: "Add", icon: PlusCircle },
  { href: "/shopping-list", label: "List", icon: ShoppingCart },
  { href: "/history", label: "History", icon: History },
  { href: "/group", label: "Group", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors",
                active
                  ? "text-red-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon
                className={cn("w-6 h-6", active && "text-red-600")}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}