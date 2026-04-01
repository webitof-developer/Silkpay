"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Send,
  Users,
  UserCog,
  Store,
  Settings,
  Activity,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { isAdmin } from "@/services/authService";
import { BrandWordmark } from "@/components/brand/BrandMark";

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  {
    href: "/transactions",
    label: "Transactions",
    icon: ArrowRightLeft,
    adminOnly: false,
  },
  { href: "/payouts", label: "Payouts", icon: Send, adminOnly: false },
  {
    href: "/beneficiaries",
    label: "Beneficiaries",
    icon: Users,
    adminOnly: false,
  },
  { href: "/users", label: "User Management", icon: UserCog, adminOnly: true },
  { href: "/merchant", label: "Merchant Center", icon: Store, adminOnly: true },
  { href: "/backend-status", label: "Backend Status", icon: Activity, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/5 bg-sidebar">
        <div className="flex h-20 items-center justify-center border-b border-white/5 bg-transparent">
          <BrandWordmark iconClassName="h-8 w-8" textClassName="text-xl" />
        </div>
        <NavContent pathname={pathname} />
        <div className="border-t border-white/5 px-4 py-4">
          <div className="rounded-xl bg-white/5 px-3 py-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Made by
            </p>

            <a
              href="https://webitof.com"
              target="_blank"
              className="mt-1 text-sm  text-green cursor-pointer  transition-all duration-300 font-semibold"
            >
              ❤️{" "}
              <span className="hover:underline hover:text-white text-muted-foreground">
                Webitof
              </span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

export function NavContent({ pathname }) {
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    setUserIsAdmin(isAdmin());
  }, []);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && !userIsAdmin) {
      return false; // Hide admin-only items from non-admins
    }
    return true;
  });

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul className="space-y-3 px-3">
        {filteredNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <li key={item.href} className="mb-1.5">
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-all duration-300 group overflow-hidden",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive ? "scale-100" : "group-hover:scale-100",
                  )}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
