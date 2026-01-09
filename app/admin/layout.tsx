import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/generated/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminLayoutWrapper from "./layout-wrapper";

async function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  const allowedRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.MASTER];
  if (!session || !allowedRoles.includes(session.user.role as Role)) {
    return redirect("/login");
  }

  return <AdminLayoutWrapper session={session}>{children}</AdminLayoutWrapper>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <AdminAuthCheck>{children}</AdminAuthCheck>
    </Suspense>
  );
}
