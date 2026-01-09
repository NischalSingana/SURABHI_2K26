
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@/lib/generated/prisma";
import { redirect } from "next/navigation";
import SponsorsClient from "./client";

export default async function SponsorsPage(props: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user.role !== Role.ADMIN && session?.user.role !== Role.MASTER) {
        return redirect("/admin/competitions");
    }

    return <SponsorsClient {...props} />;
}
