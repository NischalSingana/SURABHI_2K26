import { getCategories } from "@/actions/events.action";
import ManualRegisterForm from "./form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { FiAlertCircle } from "react-icons/fi";

export default async function ManualRegisterPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MASTER")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          You do not have permission to access the manual registration page. This functionality is restricted to Administrators and Masters only.
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
  const categories = categoriesRes.success ? (categoriesRes.data as any[]) : [];
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Manual Registration (Admin)</h1>
      <p className="mb-6 text-gray-400">Use this form to manually register a user for an event. The payment status will be marked as PENDING and requires approval.</p>
      <ManualRegisterForm categories={categories} />
    </div>
  );
}
