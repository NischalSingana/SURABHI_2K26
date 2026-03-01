"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/lib/auth-client";
import { FiLogOut } from "react-icons/fi";
import { toast } from "sonner";

export default function AdminLayoutWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    toast.success("Logged out successfully");
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) {
    return null;
  }

  const allNavLinks = [
    { href: "/admin/dashboard", label: "Dashboard", roles: ["ADMIN", "MANAGER", "MASTER"] },
    { href: "/admin/competitions", label: "Competitions", roles: ["ADMIN", "MANAGER", "MASTER"] },
    { href: "/admin/users", label: "Users", roles: ["ADMIN", "MASTER"] },
    { href: "/admin/accommodation", label: "Stay", roles: ["ADMIN", "MASTER"] },
    { href: "/admin/analytics", label: "Analytics", roles: ["ADMIN", "MASTER"] },
    { href: "/admin/feedback", label: "Feedback", roles: ["ADMIN", "MASTER"] },
    { href: "/admin/registration-analytics", label: "Registration Analytics", roles: ["GOD"] },
    { href: "/admin/accommodation-analytics", label: "Accommodation Analytics", roles: ["GOD"] },
    { href: "/admin/judges", label: "Judges", roles: ["ADMIN", "MASTER"] },
    { href: "/admin/evaluations", label: "Evaluations", roles: ["ADMIN", "MANAGER", "MASTER"] },
    { href: "/admin/registrations/approvals", label: "Registrations", roles: ["ADMIN", "MANAGER", "MASTER"] },
    { href: "/admin/spot-register", label: "Spot Register", roles: ["ADMIN", "MANAGER", "MASTER"] },
    { href: "/admin/logs", label: "Logs", roles: ["MASTER"] },
    { href: "/admin/approval", label: "Approval", roles: ["MASTER"] },
    { href: "/admin/welcome-emails", label: "Welcome Emails", roles: ["MASTER"] },
  ];

  const navLinks = allNavLinks.filter(link => link.roles.includes(session?.user?.role));

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14 gap-2 sm:gap-4">
            <Link
              href={session?.user?.role === "GOD" ? "/admin/registration-analytics" : "/admin/dashboard"}
              className="text-white font-bold text-xl shrink-0 hidden sm:block"
            >
              {session?.user?.role === "MASTER"
                ? "Master Panel"
                : session?.user?.role === "GOD"
                  ? "Registration Analytics"
                  : session?.user?.role === "MANAGER"
                    ? "Manager Panel"
                    : "Admin Panel"}
            </Link>

            {/* Desktop Menu - scrollable, prevents overlap with right section */}
            <div className="hidden md:flex flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:h-0">
              <div className="flex items-center space-x-1 lg:space-x-2 py-1 pr-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${pathname === link.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop User Info, Back Link & Logout - always visible, no overlap */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0 ml-auto">
              <Link
                href="/"
                className="text-gray-300 hover:text-white text-sm transition-colors whitespace-nowrap"
              >
                ← Back to Site
              </Link>
              <div className="text-gray-300 text-sm border-l border-gray-600 pl-3 lg:pl-4 whitespace-nowrap">
                {session?.user?.name || session?.user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md text-sm transition-colors"
              >
                <FiLogOut size={14} />
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-gray-800 border-b border-gray-700 overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === link.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="pt-4 pb-4 border-t border-gray-700">
                <div className="flex items-center px-5">
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-white">
                      {session?.user?.name || "Admin User"}
                    </div>
                    <div className="text-sm font-medium leading-none text-gray-400 mt-1">
                      {session?.user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    href="/"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    ← Back to Site
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <FiLogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {/* Scroll container: minimal chrome to maximize content visibility */}
      <main
        className="max-w-full mx-auto sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-2 overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: "calc(100svh - 3.5rem)" }}
        data-lenis-prevent
      >
        {children}
      </main>
    </div>
  );
}
