import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@/lib/generated/prisma";
import { Suspense } from "react";
import TicketVerificationClient from "./TicketVerificationClient";

export default async function TicketVerificationPage() {
    const headersList = await headers();
    const session = await auth.api.getSession({
        headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
        redirect("/");
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
            <TicketVerificationClient />
        </Suspense>
    );
}
