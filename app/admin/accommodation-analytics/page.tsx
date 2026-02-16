import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import AccommodationAnalyticsClient from "./client";

export default async function AccommodationAnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (
    session?.user.role !== Role.GOD &&
    session?.user.role !== Role.ADMIN &&
    session?.user.role !== Role.MASTER
  ) {
    return redirect("/admin/dashboard");
  }

  return <AccommodationAnalyticsClient />;
}
