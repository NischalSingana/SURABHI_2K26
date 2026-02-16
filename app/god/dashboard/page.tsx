"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
    FiLogOut, FiUser, FiUsers, FiCalendar, FiDollarSign,
    FiCheckCircle, FiXCircle, FiClock, FiTrendingUp, FiShield
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

interface DashboardStats {
    totalUsers: number;
    totalAdmins: number;
    totalJudges: number;
    totalManagers: number;
    totalMasters: number;
    totalEvents: number;
    totalRegistrations: number;
    pendingApprovals: number;
    totalRevenue: number;
}

export default function GodDashboard() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/login");
        } else if (session?.user?.role !== "GOD") {
            router.push("/");
        } else {
            fetchDashboardData();
        }
    }, [session, isPending, router]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/god/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                toast.error("Failed to load dashboard data");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push("/");
        toast.success("Logged out successfully");
    };

    if (isPending || loading) {
        return <Loader />;
    }

    if (!session?.user || session.user.role !== "GOD") {
        return null;
    }

    const statCards = [
        {
            title: "Total Users",
            value: stats?.totalUsers || 0,
            icon: FiUsers,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Admins",
            value: stats?.totalAdmins || 0,
            icon: FiShield,
            color: "from-purple-500 to-pink-500",
            bgColor: "bg-purple-500/10"
        },
        {
            title: "Judges",
            value: stats?.totalJudges || 0,
            icon: FiUser,
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-500/10"
        },
        {
            title: "Managers",
            value: stats?.totalManagers || 0,
            icon: FiUser,
            color: "from-orange-500 to-red-500",
            bgColor: "bg-orange-500/10"
        },
        {
            title: "Masters",
            value: stats?.totalMasters || 0,
            icon: FiShield,
            color: "from-yellow-500 to-amber-500",
            bgColor: "bg-yellow-500/10"
        },
        {
            title: "Total Events",
            value: stats?.totalEvents || 0,
            icon: FiCalendar,
            color: "from-red-500 to-orange-500",
            bgColor: "bg-red-500/10"
        },
        {
            title: "Registrations",
            value: stats?.totalRegistrations || 0,
            icon: FiTrendingUp,
            color: "from-indigo-500 to-purple-500",
            bgColor: "bg-indigo-500/10"
        },
        {
            title: "Pending Approvals",
            value: stats?.pendingApprovals || 0,
            icon: FiClock,
            color: "from-yellow-500 to-orange-500",
            bgColor: "bg-yellow-500/10"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                                God Dashboard
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Ultimate System Control
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium">{session?.user?.name || "God"}</p>
                                <p className="text-xs text-gray-400">{session?.user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all"
                            >
                                <FiLogOut />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`${card.bgColor} border border-white/10 rounded-xl p-6 backdrop-blur-sm`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color} bg-opacity-20`}>
                                        <Icon className="text-2xl text-white" />
                                    </div>
                                </div>
                                <h3 className="text-gray-400 text-sm font-medium mb-1">{card.title}</h3>
                                <p className="text-3xl font-bold text-white">{card.value.toLocaleString()}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                >
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push("/admin/dashboard")}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-left"
                        >
                            <h3 className="font-semibold mb-1">Admin Dashboard</h3>
                            <p className="text-sm text-gray-400">Access admin panel</p>
                        </button>
                        <button
                            onClick={() => router.push("/admin/users")}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-left"
                        >
                            <h3 className="font-semibold mb-1">User Management</h3>
                            <p className="text-sm text-gray-400">Manage all users</p>
                        </button>
                        <button
                            onClick={() => router.push("/admin/analytics")}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-left"
                        >
                            <h3 className="font-semibold mb-1">Analytics</h3>
                            <p className="text-sm text-gray-400">View system analytics</p>
                        </button>
                    </div>
                </motion.div>

                {/* System Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                >
                    <h2 className="text-xl font-bold mb-4">System Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Role</p>
                            <p className="text-lg font-semibold text-red-400">GOD</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Email</p>
                            <p className="text-lg font-semibold">{session?.user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">User ID</p>
                            <p className="text-lg font-semibold font-mono text-sm">{session?.user?.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Status</p>
                            <p className="text-lg font-semibold text-green-400 flex items-center gap-2">
                                <FiCheckCircle />
                                Active
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
