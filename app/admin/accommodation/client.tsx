"use client";

import { useEffect, useState } from "react";
import { getAllBookings, approveBooking, rejectBooking } from "@/actions/admin/accommodation.action";
import { BookingType, Gender, PaymentStatus, BookingStatus } from "@prisma/client";
import { toast } from "sonner";

export default function AccommodationPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [filter, setFilter] = useState<{
        bookingType?: BookingType;
        gender?: Gender;
        paymentStatus?: PaymentStatus;
        status?: BookingStatus;
    }>({});

    useEffect(() => {
        loadBookings();
    }, [filter]);

    const loadBookings = async () => {
        setLoading(true);
        const result = await getAllBookings(filter);
        if (result.success) {
            setBookings(result.bookings || []);
        } else {
            toast.error(result.error || "Failed to load bookings");
        }
        setLoading(false);
    };

    const handleApprove = async (bookingId: string) => {
        const result = await approveBooking(bookingId);
        if (result.success) {
            toast.success(result.message);
            loadBookings();
        } else {
            toast.error(result.error);
        }
    };

    const handleReject = async (bookingId: string) => {
        const result = await rejectBooking(bookingId);
        if (result.success) {
            toast.success(result.message);
            loadBookings();
        } else {
            toast.error(result.error);
        }
    };

    const viewGroupMembers = (booking: any) => {
        setSelectedBooking(booking);
    };

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Accommodation Management</h1>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Booking Type
                        </label>
                        <select
                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                            value={filter.bookingType || ""}
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    bookingType: e.target.value ? (e.target.value as BookingType) : undefined,
                                })
                            }
                        >
                            <option value="">All</option>
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="GROUP">Group</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Gender
                        </label>
                        <select
                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                            value={filter.gender || ""}
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    gender: e.target.value ? (e.target.value as Gender) : undefined,
                                })
                            }
                        >
                            <option value="">All</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                            value={filter.status || ""}
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    status: e.target.value ? (e.target.value as BookingStatus) : undefined,
                                })
                            }
                        >
                            <option value="">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
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

            {/* Bookings Table */}
            {loading ? (
                <div className="text-center text-white py-12">Loading...</div>
            ) : bookings.length === 0 ? (
                <div className="text-center text-gray-400 py-12">No bookings found</div>
            ) : (
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Competitions
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Gender
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Members
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {bookings.map((booking) => {
                                    const individualEvents = booking.user?.individualRegistrations || [];
                                    const groupEvents = booking.user?.groupRegistrations || [];
                                    const allEvents = [...individualEvents, ...groupEvents];
                                    
                                    return (
                                    <tr key={booking.id} className="hover:bg-gray-700/50">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                                            <div>
                                                <div className="font-medium">{booking.user.name || "N/A"}</div>
                                                <div className="text-gray-400 text-xs">{booking.user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-300 max-w-xs">
                                            {allEvents.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {allEvents.slice(0, 3).map((reg: any, idx: number) => (
                                                        <div key={idx} className="text-xs bg-blue-900/20 text-blue-300 px-2 py-1 rounded border border-blue-800/30">
                                                            <div className="font-medium truncate">{reg.event?.name || "Unknown Event"}</div>
                                                            <div className="text-blue-400/70 text-[10px]">
                                                                {reg.event?.Category?.name || "Category"}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {allEvents.length > 3 && (
                                                        <div className="text-[10px] text-gray-500 italic">
                                                            +{allEvents.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-xs italic">No approved registrations</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <span
                                                className={`inline-flex text-xs px-2 py-1 rounded-full ${booking.bookingType === "GROUP"
                                                        ? "bg-purple-900/20 text-purple-400"
                                                        : "bg-blue-900/20 text-blue-400"
                                                    }`}
                                            >
                                                {booking.bookingType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {booking.gender}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <span>{booking.totalMembers}</span>
                                                {booking.bookingType === "GROUP" && (
                                                    <button
                                                        onClick={() => viewGroupMembers(booking)}
                                                        className="text-blue-400 hover:text-blue-300 text-xs underline"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <div className="text-xs">
                                                <div>{booking.primaryPhone}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex text-xs px-2 py-1 rounded-full ${booking.status === "CONFIRMED"
                                                        ? "bg-green-900/20 text-green-400"
                                                        : booking.status === "CANCELLED"
                                                            ? "bg-red-900/20 text-red-400"
                                                            : "bg-yellow-900/20 text-yellow-400"
                                                    }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                {booking.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(booking.id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(booking.id)}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-4 text-sm text-gray-400">
                Total Bookings: {bookings.length}
            </div>

            {/* Group Members Modal */}
            {selectedBooking && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedBooking(null)}
                >
                    <div
                        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Group Members & Competitions</h2>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-700 rounded p-4">
                                <h3 className="text-white font-semibold mb-2">Primary Contact</h3>
                                <div className="text-sm text-gray-300 space-y-1">
                                    <div>Name: {selectedBooking.primaryName}</div>
                                    <div>Email: {selectedBooking.primaryEmail}</div>
                                    <div>Phone: {selectedBooking.primaryPhone}</div>
                                </div>
                            </div>
                            
                            {/* Competitions for Primary User */}
                            {(() => {
                                const primaryUserEvents = [
                                    ...(selectedBooking.user?.individualRegistrations || []),
                                    ...(selectedBooking.user?.groupRegistrations || [])
                                ];
                                
                                if (primaryUserEvents.length > 0) {
                                    return (
                                        <div className="bg-gray-700 rounded p-4">
                                            <h3 className="text-white font-semibold mb-2">Primary Contact's Competitions</h3>
                                            <div className="space-y-2">
                                                {primaryUserEvents.map((reg: any, idx: number) => (
                                                    <div key={idx} className="bg-blue-900/20 rounded p-2 text-sm">
                                                        <div className="text-blue-300 font-medium">{reg.event?.name || "Unknown Event"}</div>
                                                        <div className="text-blue-400/70 text-xs">
                                                            {reg.event?.Category?.name || "Category"} • {reg.event?.venue || "Venue TBD"}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            {selectedBooking.groupMembers && Array.isArray(selectedBooking.groupMembers) && (
                                <div className="bg-gray-700 rounded p-4">
                                    <h3 className="text-white font-semibold mb-2">
                                        Additional Members ({selectedBooking.groupMembers.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedBooking.groupMembers.map((member: any, index: number) => (
                                            <div key={index} className="text-sm text-gray-300 border-b border-gray-600 pb-2">
                                                <div>Name: {member.name}</div>
                                                <div>Email: {member.email}</div>
                                                <div>Phone: {member.phone}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
