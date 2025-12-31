"use client";

import { usePathname } from "next/navigation";
import PillNav from "@/components/ui/PillNav";

const navItems = [
    { label: "Home", href: "/" },
    { label: "Events", href: "/events" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
];

export default function ConditionalNavbar() {
    const pathname = usePathname();

    // Hide navbar on admin routes
    if (pathname?.startsWith("/admin")) {
        return null;
    }

    return (
        <PillNav
            logo="/favicon.ico"
            logoAlt="Surabhi Logo"
            items={navItems}
            baseColor="#ffffff"
            pillColor="#ff6b35"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#ffffff"
            ease="power3.easeOut"
        />
    );
}
