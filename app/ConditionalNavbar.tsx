"use client";

import { usePathname, useRouter } from "next/navigation";
import PillNav from "@/components/ui/PillNav";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
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
    const [isServerConfirmedRegistered, setIsServerConfirmedRegistered] = useState(false);

    useEffect(() => {
        if (!isPending && session?.user?.role === "JUDGE") {
            // Allow access only to /judge/* routes
            if (!pathname?.startsWith("/judge")) {
                router.replace("/judge/dashboard");
            }
            return;
        }

        const checkRegistrationAndRedirect = async () => {
            // Skip registration check for admin roles (GOD, ADMIN, MASTER, MANAGER)
            const adminRoles = ["GOD", "ADMIN", "MASTER", "MANAGER"];
            if (!isPending && session?.user && adminRoles.includes(session.user.role)) {
                return;
            }

            // Redirect to registration if user is authenticated but hasn't completed registration
            if (!isPending && session?.user) {
                // First check locally based on session
                if (isRegistrationComplete(session.user)) {
                    return;
                }

                // If session says incomplete, double check with server to avoid stale session issues
                try {
                    const response = await fetch("/api/check-registration", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: session.user.id }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.isRegistered) {
                            // User is actually registered on server, so don't redirect
                            setIsServerConfirmedRegistered(true);
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Failed to verify registration status", e);
                }

                // If we get here, both session and server (or server failed) think we are incomplete
                // Allow access to register, login, and auth callback routes
                const allowedRoutes = ["/register", "/login", "/auth"];
                const isAllowedRoute = allowedRoutes.some(route => pathname?.startsWith(route));

                if (!isAllowedRoute) {
                    router.replace("/register");
                }
            }
        };

        checkRegistrationAndRedirect();
    }, [session, isPending, pathname, router]);

    // Hide navbar on admin routes, if user is a judge, OR if registration is incomplete (but not for admin roles)
    const adminRoles = ["GOD", "ADMIN", "MASTER", "MANAGER"];
    const isAdminRole = session?.user?.role && adminRoles.includes(session.user.role);
    
    if (
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/god") ||
        session?.user?.role === "JUDGE" ||
        (session?.user && !isAdminRole && !isRegistrationComplete(session.user) && !isServerConfirmedRegistered)
    ) {
        return null;
    }

    return (
        <PillNav
            logo="/surabhi-logo.png"
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
