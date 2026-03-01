import { getCategories } from "@/actions/events.action";
import { Category, Event } from "@prisma/client";
import SpotRegisterForm from "./SpotRegisterForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { FiAlertCircle } from "react-icons/fi";

type CategoryWithEvents = Category & { Event: Event[] };

export default async function SpotRegisterPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  const allowedRoles = ["ADMIN", "MASTER", "MANAGER"];
  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          You do not have permission to access the spot registration page. This is restricted to Managers, Admins, and Masters.
        </p>
        <Link
          href="/admin/dashboard"
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium border border-zinc-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const categoriesRes = await getCategories(true);
  const categories = categoriesRes.success ? (categoriesRes.data as CategoryWithEvents[]) : [];

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold mb-2 text-white">Spot Registration</h1>
      <p className="mb-6 text-gray-400">
        Register participants on-site. Enter email to fetch user details, edit if needed, then select competition and complete payment.
      </p>
      <SpotRegisterForm categories={categories} />
    </div>
  );
}
