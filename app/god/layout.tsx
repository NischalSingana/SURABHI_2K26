"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Loader from "@/components/ui/Loader";

export default function GodLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending) {
            if (!session?.user) {
                router.push("/auth/login");
            } else if (session.user.role !== "GOD") {
                router.push("/");
            }
        }
    }, [session, isPending, router]);

    if (isPending) {
        return <Loader />;
    }

    if (!session?.user || session.user.role !== "GOD") {
        return null;
    }

    return <>{children}</>;
}
