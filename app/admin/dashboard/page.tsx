import Link from "next/link";

const page = async () => {
    return (
        <div className="px-4 sm:px-6 py-6">
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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


            </div>
        </div>
    );
}

export default page;