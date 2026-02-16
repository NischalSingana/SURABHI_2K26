
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import UsersClient from "./client";

export default async function UsersPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user.role !== Role.ADMIN && session?.user.role !== Role.MASTER) {
        return redirect("/admin/competitions");
    }

    return <UsersClient currentRole={session?.user.role as Role} currentUserId={session?.user.id} />;
}
