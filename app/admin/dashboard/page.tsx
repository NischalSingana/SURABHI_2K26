import Link from "next/link";

const page = async () => {
    return (
        <div className="px-4 py-6">
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/admin/events"
                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 border border-gray-700"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                            <svg
                                className="w-8 h-8 text-white"
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
                        <h2 className="text-xl font-semibold text-white">Events Management</h2>
                        <p className="text-gray-400 text-center text-sm">
                            Create, update, and manage event categories and events
                        </p>
                    </div>
                </Link>

                <Link
                    href="/admin/users"
                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 border border-gray-700"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                            <svg
                                className="w-8 h-8 text-white"
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
                        <h2 className="text-xl font-semibold text-white">Users Management</h2>
                        <p className="text-gray-400 text-center text-sm">
                            Manage user registrations, approvals, and payment status
                        </p>
                    </div>
                </Link>

                <Link
                    href="/admin/accommodation"
                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 border border-gray-700"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                            <svg
                                className="w-8 h-8 text-white"
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
                        <h2 className="text-xl font-semibold text-white">Accommodation</h2>
                        <p className="text-gray-400 text-center text-sm">
                            Manage accommodation bookings and approvals
                        </p>
                    </div>
                </Link>

                <Link
                    href="/admin/analytics"
                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 border border-gray-700"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                            <svg
                                className="w-8 h-8 text-white"
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
                        <h2 className="text-xl font-semibold text-white">Analytics</h2>
                        <p className="text-gray-400 text-center text-sm">
                            View statistics, reports, and insights
                        </p>
                    </div>
                </Link>

                <Link
                    href="/admin/contact"
                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 border border-gray-700"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                            <svg
                                className="w-8 h-8 text-white"
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
                        <h2 className="text-xl font-semibold text-white">Contact & FAQs</h2>
                        <p className="text-gray-400 text-center text-sm">
                            Manage contact details and FAQs
                        </p>
                    </div>
                </Link>

                <Link
                    href="/admin/judges"
                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 border border-gray-700"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white">Manage Judges</h2>
                        <p className="text-gray-400 text-center text-sm">
                            Create and manage judge accounts
                        </p>
                    </div>
                </Link>

                <Link
                    href="/admin/evaluations"
                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 border border-gray-700"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white">Evaluations</h2>
                        <p className="text-gray-400 text-center text-sm">
                            View event scores and results
                        </p>
                    </div>
                </Link>

                <Link
                    href="/admin/verify-tickets"
                    className="bg-gradient-to-br from-red-900/40 to-orange-900/40 hover:from-red-900/60 hover:to-orange-900/60 transition-all rounded-lg p-6 border-2 border-red-600/50 shadow-lg shadow-red-600/20"
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white">Verify Tickets</h2>
                        <p className="text-gray-300 text-center text-sm font-medium">
                            Scan QR codes to verify participant tickets
                        </p>
                        <div className="mt-2 px-3 py-1 bg-red-600/20 border border-red-600/50 rounded-full">
                            <span className="text-red-400 text-xs font-bold">QUICK ACCESS</span>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

export default page;