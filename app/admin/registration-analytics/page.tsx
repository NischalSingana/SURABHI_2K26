import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import RegistrationAnalyticsClient from "./client";

export default async function RegistrationAnalyticsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userRole = session?.user?.role as string | undefined;

    if (userRole !== Role.GOD && userRole !== "RNC") {
        return redirect("/admin/dashboard");
    }

    return <RegistrationAnalyticsClient />;
}
