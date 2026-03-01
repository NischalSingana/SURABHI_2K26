import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import WelcomeEmailsClient from "./client";

export default async function WelcomeEmailsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user?.role !== Role.MASTER) {
    return redirect("/admin/dashboard");
  }

  return <WelcomeEmailsClient />;
}
