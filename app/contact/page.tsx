import { getContactCategories } from "@/actions/contact.action";
import ContactClient from "./ContactClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Surabhi 2026",
  description: "Get in touch with the Surabhi 2026 team. Contact coordinators for events, accommodation, and registration inquiries.",
};

export default async function ContactPage() {
  const { data: categories, success } = await getContactCategories();

  if (!success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center p-8 bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-bold text-red-500 mb-2">Unavailable</h2>
          <p className="text-zinc-400">Unable to load contact information at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <ContactClient categories={categories || []} />
  );
}