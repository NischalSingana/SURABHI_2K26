import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import RegistrationApprovalsClient from "./RegistrationApprovalsClient";

export default async function RegistrationApprovals() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return redirect("/admin/dashboard");
    }

    return <RegistrationApprovalsClient />;
}
