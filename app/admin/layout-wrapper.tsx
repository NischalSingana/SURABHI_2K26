"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/accommodation", label: "Accommodation" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/judges", label: "Judges" },
    { href: "/admin/evaluations", label: "Evaluations" },
    { href: "/admin/chatbot", label: "Chatbot FAQs" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-white font-bold text-xl">
                Admin Panel
              </Link>
              <div className="ml-10 flex items-baseline space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                ← Back to Site
              </Link>
              <div className="text-gray-300 text-sm border-l border-gray-600 pl-4">
                {session?.user?.name || session?.user?.email}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Add padding-top to account for fixed navbar */}
      <main className="max-w-full mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        {children}
      </main>
    </div>
  );
}
