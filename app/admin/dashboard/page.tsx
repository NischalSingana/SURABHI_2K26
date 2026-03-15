import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
const page = async () => {
    const headersList = await headers();
    const session = await auth.api.getSession({
        headers: headersList,
    });

    const userRole = session?.user?.role as string | undefined;

    // Redirect GOD role users directly to registration analytics
    if (userRole === Role.GOD) {
        redirect("/admin/registration-analytics");
    }

    // Admin has full access, Manager has limited access
    const isManager = userRole === "MANAGER";
    const isAdmin = userRole === "ADMIN" || userRole === "MASTER";
    const isRnc = userRole === "RNC";
    const canRegistrationsMgmt = isAdmin || isRnc;
    const canAccommodationMgmt = isAdmin || isRnc;
    const canAnalyticsDashboard = isAdmin || isRnc;
    const canSpotRegister = userRole === "MASTER" || userRole === "RNC";

    const roleLabel =
        userRole === "MASTER"
            ? "Master"
            : userRole === "ADMIN"
                ? "Admin"
                : userRole === "MANAGER"
                    ? "Manager"
                    : userRole === "RNC"
                        ? "R&C"
                    : "Admin";

    return (
        <div className="px-4 sm:px-6 pt-4 pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{roleLabel} Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(isAdmin || isManager) && (
                    <Link
                        href="/admin/competitions"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg
                                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Competitions Management</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Create, update, and manage competition categories and competitions
                            </p>
                        </div>
                    </Link>
                )}

                {isAdmin && (
                    <Link
                        href="/admin/users"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg
                                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Users Management</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Manage user registrations, approvals, and payment status
                            </p>
                        </div>
                    </Link>
                )}

                {canRegistrationsMgmt && (
                    <Link
                        href="/admin/registrations/approvals"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Registrations Management</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                View and approve event registrations
                            </p>
                        </div>
                    </Link>
                )}

                {canAccommodationMgmt && (
                    <Link
                        href="/admin/accommodation"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg
                                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Accommodation</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Manage accommodation bookings and approvals
                            </p>
                        </div>
                    </Link>
                )}

                {isAdmin && (
                    <Link
                        href="/admin/feedback"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Competition Feedback</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Release feedback collection, view responses, download reports
                            </p>
                        </div>
                    </Link>
                )}

                {isAdmin && (
                    <Link
                        href="/admin/feedback-analytics"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Feedback Analytics</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                View general anonymous feedback, ratings, and download reports
                            </p>
                        </div>
                    </Link>
                )}

                {canAnalyticsDashboard && (
                    <Link
                        href="/admin/analytics"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg
                                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Analytics</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                View statistics, reports, and insights
                            </p>
                        </div>
                    </Link>
                )}

                {isAdmin && (
                    <Link
                        href="/admin/contact"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg
                                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Contact & FAQs</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Manage contact details and FAQs
                            </p>
                        </div>
                    </Link>
                )}

                {canSpotRegister && (
                    <Link
                        href="/admin/spot-register"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Spot Registration</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Register participants on-site with email, payment, and competition selection
                            </p>
                        </div>
                    </Link>
                )}

                {(isAdmin || isManager) && (
                    <Link
                        href="/admin/judges"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Manage Judges</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Create and manage judge accounts
                            </p>
                        </div>
                    </Link>
                )}

                {(isAdmin || isManager) && (
                    <Link
                        href="/admin/evaluations"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Evaluations</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                View event scores and results
                            </p>
                        </div>
                    </Link>
                )}

                {isAdmin && (
                    <Link
                        href="/admin/sponsors"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Sponsors Management</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Manage sponsors, upload images, and track sponsorship amounts
                            </p>
                        </div>
                    </Link>
                )}

                {isAdmin && (
                    <Link
                        href="/admin/chatbot"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Chatbot</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Manage chatbot categories and FAQs
                            </p>
                        </div>
                    </Link>
                )}

                {session?.user?.role === "MASTER" && (
                    <Link
                        href="/admin/logs"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Activity Logs</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                View admin activity logs and system events
                            </p>
                        </div>
                    </Link>
                )}

                {session?.user?.role === "MASTER" && (
                    <Link
                        href="/admin/welcome-emails"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Welcome Emails</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Send day-wise welcome emails with entry pass to participants
                            </p>
                        </div>
                    </Link>
                )}

                {isAdmin && (
                    <Link
                        href="/admin/thankyou-emails"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Thank You Emails</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Send post-event appreciation emails and ask for feedback
                            </p>
                        </div>
                    </Link>
                )}

                {session?.user?.role === "MASTER" && (
                    <Link
                        href="/admin/approval"
                        className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 sm:p-6 border border-gray-700 active:scale-95 transform duration-100"
                    >
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Approval</h2>
                            <p className="text-gray-400 text-center text-xs sm:text-sm">
                                Approve or reject delete requests
                            </p>
                        </div>
                    </Link>
                )}




            </div>
        </div>
    );
}

export default page;