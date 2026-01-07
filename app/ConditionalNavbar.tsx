"use client";

import { usePathname, useRouter } from "next/navigation";
import PillNav from "@/components/ui/PillNav";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

const navItems = [
    { label: "Home", href: "/" },
    { label: "Competitions", href: "/competitions" },
    { label: "Accommodation", href: "/accommodation" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
];

export default function ConditionalNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (!isPending && session?.user?.role === "JUDGE") {
            // Allow access only to /judge/* routes
            if (!pathname?.startsWith("/judge")) {
                router.replace("/judge/dashboard");
            }
        }
    }, [session, isPending, pathname, router]);

    // Hide navbar on admin routes OR if user is a judge
    if (pathname?.startsWith("/admin") || session?.user?.role === "JUDGE") {
        return null;
    }

    return (
        <PillNav
            logo="/favicon.ico"
            logoAlt="Surabhi Logo"
            items={navItems}
            baseColor="#ffffff"
            pillColor="#dc2626"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#ffffff"
            ease="power3.easeOut"
        />
    );
}
