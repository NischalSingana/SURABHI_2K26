import { getContactCategories } from "@/actions/contact.action";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@/lib/generated/prisma";
import { redirect } from "next/navigation";
import ContactManagementClient from "./ContactManagementClient";

export default async function ContactAdminPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user.role !== Role.ADMIN && session?.user.role !== Role.MASTER) {
        return redirect("/admin/competitions");
    }

    const { data: categories, success } = await getContactCategories();

    if (!success) {
        return (
            <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-xl">
                <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Data</h2>
                <p className="text-gray-400">Please try refreshing the page or contact support.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Contact Coordinators</h1>
                <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-rose-600 rounded-full" />
            </div>

            <ContactManagementClient initialCategories={categories || []} />
        </div>
    );
}
