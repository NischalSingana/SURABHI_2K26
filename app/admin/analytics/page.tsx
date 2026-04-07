
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import AnalyticsClient from "./client";

export default async function AnalyticsPage(props: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user.role !== Role.ADMIN && session?.user.role !== Role.MASTER) {
        return redirect("/admin/competitions");
    }

    return <AnalyticsClient {...props} />;
}
