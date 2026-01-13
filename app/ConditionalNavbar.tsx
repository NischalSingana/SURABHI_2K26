"use client";

import { usePathname, useRouter } from "next/navigation";
import PillNav from "@/components/ui/PillNav";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import { isRegistrationComplete } from "@/lib/registration-check";

const navItems = [
    { label: "Home", href: "/" },
    { label: "Competitions", href: "/competitions" },
    { label: "Accommodation", href: "/accommodation" },
    { label: "Gallery", href: "/gallery" },
    { label: "Sponsors", href: "/sponsors" },
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

        // Redirect to registration if user is authenticated but hasn't completed registration
        if (!isPending && session?.user && !isRegistrationComplete(session.user)) {
            // Allow access to register, login, and auth callback routes
            const allowedRoutes = ["/register", "/login", "/auth"];
            const isAllowedRoute = allowedRoutes.some(route => pathname?.startsWith(route));

            if (!isAllowedRoute) {
                router.replace("/register");
            }
        }
    }, [session, isPending, pathname, router]);

    // Hide navbar on admin routes, if user is a judge, OR if registration is incomplete
    if (
        pathname?.startsWith("/admin") ||
        session?.user?.role === "JUDGE" ||
        (session?.user && !isRegistrationComplete(session.user))
    ) {
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
