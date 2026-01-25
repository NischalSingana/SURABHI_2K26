import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import ApprovalClient from "./client";

export default async function ApprovalPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== Role.MASTER) {
    return redirect("/admin/dashboard");
  }

  return <ApprovalClient />;
}
