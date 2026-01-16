import IndividualRegistrationsTable from "@/components/admin/IndividualRegistrationsTable";

export default function IndividualRegistrationsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Individual Registrations</h1>
            <IndividualRegistrationsTable />
        </div>
    );
}
