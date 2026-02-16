"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, approveUser, rejectUser, updatePaymentStatus, updateUserRole } from "@/actions/admin/users.action";
import { PaymentStatus, Role } from "@prisma/client";
import { toast } from "sonner";
import { FiSearch, FiUsers, FiGlobe, FiMapPin } from "react-icons/fi";
import { useSession } from "@/lib/auth-client";

type User = {
    id: string;
    name: string | null;
    email: string;
    collage: string | null;
    paymentStatus: PaymentStatus;
    isApproved: boolean;
    role: Role;
    isInternational?: boolean;
    country?: string | null;
    _count?: {
        individualRegistrations: number;
        groupRegistrations: number;
    };
};

export default function UsersPage({ currentRole, currentUserId }: { currentRole: Role; currentUserId?: string }) {
    const router = useRouter();
    const { refetch: refetchSession } = useSession();
    const isMaster = currentRole === Role.MASTER;
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"kl" | "other" | "international">("kl");
    const [searchKL, setSearchKL] = useState("");
    const [searchOther, setSearchOther] = useState("");
    const [searchInternational, setSearchInternational] = useState("");
    const [filter, setFilter] = useState<{
        paymentStatus?: PaymentStatus;
        isApproved?: boolean;
    }>({});

    useEffect(() => {
        loadUsers();
    }, [filter]);

    const loadUsers = async () => {
        setLoading(true);
        const result = await getAllUsers(filter);
        if (result.success) {
            setAllUsers(result.users || []);
        } else {
            toast.error(result.error || "Failed to load users");
        }
        setLoading(false);
    };

    // Separate users: KL, other domestic, international
    const klUsers = allUsers.filter(user => user.email.endsWith("@kluniversity.in") && !user.isInternational);
    const internationalUsers = allUsers.filter(user => !!user.isInternational);
    const otherUsers = allUsers.filter(user =>
        !user.email.endsWith("@kluniversity.in") && !user.isInternational
    );

    // Filter by search
    const filteredKLUsers = klUsers.filter(user =>
        user.name?.toLowerCase().includes(searchKL.toLowerCase()) ||
        user.email.toLowerCase().includes(searchKL.toLowerCase()) ||
        user.collage?.toLowerCase().includes(searchKL.toLowerCase())
    );

    const filteredOtherUsers = otherUsers.filter(user =>
        user.name?.toLowerCase().includes(searchOther.toLowerCase()) ||
        user.email.toLowerCase().includes(searchOther.toLowerCase()) ||
        user.collage?.toLowerCase().includes(searchOther.toLowerCase())
    );

    const filteredInternationalUsers = internationalUsers.filter(user =>
        user.name?.toLowerCase().includes(searchInternational.toLowerCase()) ||
        user.email.toLowerCase().includes(searchInternational.toLowerCase()) ||
        user.country?.toLowerCase().includes(searchInternational.toLowerCase())
    );

    const handleApprove = async (userId: string) => {
        const result = await approveUser(userId);
        if (result.success) {
            toast.success(result.message);
            loadUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleReject = async (userId: string) => {
        const result = await rejectUser(userId);
        if (result.success) {
            toast.success(result.message);
            loadUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handlePaymentStatusChange = async (userId: string, status: PaymentStatus) => {
        const result = await updatePaymentStatus(userId, status);
        if (result.success) {
            toast.success(result.message);
            loadUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            toast.success(result.message);
            loadUsers();
            // If admin changed their own role, refetch session so UI reflects immediately
            if (currentUserId && userId === currentUserId) {
                await refetchSession({ query: { disableCookieCache: true } });
                router.refresh();
            }
        } else {
            toast.error(result.error);
        }
    };

    const UserTable = ({ users, isKL, isInternationalTab }: { users: User[], isKL: boolean; isInternationalTab?: boolean }) => (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {isInternationalTab ? "Country" : "College"}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Competitions
                            </th>
                            {(!isKL || isInternationalTab) && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Payment Status
                                    </th>
                                </>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Approval
                            </th>
                            {isMaster && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Role
                                </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-700/50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                                    {user.name || "N/A"}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {user.email}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {isInternationalTab ? (user.country || "N/A") : (user.collage || "N/A")}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {(user._count?.individualRegistrations || 0) + (user._count?.groupRegistrations || 0)}
                                </td>
                                {(!isKL || isInternationalTab) && (
                                    <>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <select
                                                value={user.paymentStatus}
                                                onChange={(e) =>
                                                    handlePaymentStatusChange(user.id, e.target.value as PaymentStatus)
                                                }
                                                className={`text-xs px-2 py-1 rounded-full border ${user.paymentStatus === "APPROVED"
                                                    ? "bg-green-900/20 text-green-400 border-green-700"
                                                    : user.paymentStatus === "REJECTED"
                                                        ? "bg-red-900/20 text-red-400 border-red-700"
                                                        : "bg-yellow-900/20 text-yellow-400 border-yellow-700"
                                                    }`}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="APPROVED">Approved</option>
                                                <option value="REJECTED">Rejected</option>
                                            </select>
                                        </td>
                                    </>
                                )}
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex text-xs px-2 py-1 rounded-full ${user.isApproved
                                            ? "bg-green-900/20 text-green-400"
                                            : "bg-red-900/20 text-red-400"
                                            }`}
                                    >
                                        {user.isApproved ? "Approved" : "Not Approved"}
                                    </span>
                                </td>
                                {isMaster && (
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
                                        >
                                            <option value="USER">User</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="MASTER">Master</option>
                                            <option value="JUDGE">Judge</option>
                                            <option value="GOD">GOD</option>
                                        </select>
                                    </td>
                                )}
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <div className="flex gap-2">
                                        {!user.isApproved && (
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {user.isApproved && (
                                            <button
                                                onClick={() => handleReject(user.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Users Management</h1>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Payment Status
                        </label>
                        <select
                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                            value={filter.paymentStatus || ""}
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    paymentStatus: e.target.value ? (e.target.value as PaymentStatus) : undefined,
                                })
                            }
                        >
                            <option value="">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Approval Status
                        </label>
                        <select
                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                            value={filter.isApproved === undefined ? "" : filter.isApproved.toString()}
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    isApproved: e.target.value === "" ? undefined : e.target.value === "true",
                                })
                            }
                        >
                            <option value="">All</option>
                            <option value="true">Approved</option>
                            <option value="false">Not Approved</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => setFilter({})}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-md px-4 py-2 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs: KL, International (separate), Other College */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                    onClick={() => setActiveTab("kl")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "kl"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                >
                    <FiUsers />
                    KL University Students
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {klUsers.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("international")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "international"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                >
                    <FiMapPin />
                    International Students
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {internationalUsers.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("other")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "other"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                >
                    <FiGlobe />
                    Other College Students
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {otherUsers.length}
                    </span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === "kl" ? "KL University" : activeTab === "international" ? "International" : "Other College"} students...`}
                        value={activeTab === "kl" ? searchKL : activeTab === "international" ? searchInternational : searchOther}
                        onChange={(e) =>
                            activeTab === "kl" ? setSearchKL(e.target.value) : activeTab === "international" ? setSearchInternational(e.target.value) : setSearchOther(e.target.value)
                        }
                        className="w-full bg-gray-800 text-white rounded-lg pl-12 pr-4 py-3 border border-gray-700 focus:border-red-600 focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center text-white py-12">Loading...</div>
            ) : activeTab === "kl" ? (
                filteredKLUsers.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-lg border border-gray-700">
                        No KL University students found
                    </div>
                ) : (
                    <>
                        <UserTable users={filteredKLUsers} isKL={true} />
                        <div className="mt-4 text-sm text-gray-400">
                            Showing {filteredKLUsers.length} of {klUsers.length} KL University students
                        </div>
                    </>
                )
            ) : activeTab === "international" ? (
                filteredInternationalUsers.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-lg border border-gray-700">
                        No international students found
                    </div>
                ) : (
                    <>
                        <UserTable users={filteredInternationalUsers} isKL={false} isInternationalTab={true} />
                        <div className="mt-4 text-sm text-gray-400">
                            Showing {filteredInternationalUsers.length} of {internationalUsers.length} international students
                        </div>
                    </>
                )
            ) : (
                filteredOtherUsers.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-lg border border-gray-700">
                        No other college students found
                    </div>
                ) : (
                    <>
                        <UserTable users={filteredOtherUsers} isKL={false} />
                        <div className="mt-4 text-sm text-gray-400">
                            Showing {filteredOtherUsers.length} of {otherUsers.length} other college students
                        </div>
                    </>
                )
            )}
        </div>
    );
}
