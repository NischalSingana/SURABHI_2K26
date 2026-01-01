"use client";

import { useEffect, useState } from "react";
import { getAllUsers, approveUser, rejectUser, updatePaymentStatus } from "@/actions/admin/users.action";
import { PaymentStatus, Role } from "@/lib/generated/prisma";
import { toast } from "sonner";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
            setUsers(result.users || []);
        } else {
            toast.error(result.error || "Failed to load users");
        }
        setLoading(false);
    };

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

            {/* Users Table */}
            {loading ? (
                <div className="text-center text-white py-12">Loading...</div>
            ) : users.length === 0 ? (
                <div className="text-center text-gray-400 py-12">No users found</div>
            ) : (
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
                                        College
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Events
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Payment Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Txn ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Proof
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Approval
                                    </th>
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
                                            {user.collage || "N/A"}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {user._count?.registeredEvents || 0}
                                        </td>
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
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {user.transactionId || "-"}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            {user.paymentProof ? (
                                                <a
                                                    href={user.paymentProof}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
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
                </div>
            )}

            <div className="mt-4 text-sm text-gray-400">
                Total Users: {users.length}
            </div>
        </div>
    );
}
