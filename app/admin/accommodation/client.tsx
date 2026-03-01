"use client";

import { useEffect, useState } from "react";
import { getAllBookings, approveBooking, rejectBooking, getAccommodationExcelData, getAccommodationExcelDataByDays } from "@/actions/admin/accommodation.action";
import { BookingType, Gender, PaymentStatus, BookingStatus } from "@prisma/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function AccommodationPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [excelLoading, setExcelLoading] = useState<"boys" | "girls" | null>(null);
    const [dayWiseLoading, setDayWiseLoading] = useState(false);
    const [selectedDays, setSelectedDays] = useState<number[]>([2, 3, 4, 5, 6, 7]);
    const [filter, setFilter] = useState<{
        bookingType?: BookingType;
        gender?: Gender;
        paymentStatus?: PaymentStatus;
        status?: BookingStatus;
    }>({});

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

    useEffect(() => {
        loadBookings();
    }, [filter]);

    const handleApprove = async (bookingId: string) => {
        setProcessingIds((prev) => new Set(prev).add(bookingId));
        setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: "CONFIRMED", paymentStatus: "APPROVED" } : b))
        );
        try {
            const result = await approveBooking(bookingId);
            if (result.success) {
                toast.success(result.message);
            } else {
                setBookings((prev) =>
                    prev.map((b) => (b.id === bookingId ? { ...b, status: "PENDING", paymentStatus: "PENDING" } : b))
                );
                toast.error(result.error);
            }
        } catch {
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: "PENDING", paymentStatus: "PENDING" } : b))
            );
            toast.error("Failed to approve booking");
        } finally {
            setProcessingIds((prev) => { const s = new Set(prev); s.delete(bookingId); return s; });
        }
    };

    const handleReject = async (bookingId: string) => {
        setProcessingIds((prev) => new Set(prev).add(bookingId));
        setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED", paymentStatus: "REJECTED" } : b))
        );
        try {
            const result = await rejectBooking(bookingId);
            if (result.success) {
                toast.success(result.message);
            } else {
                setBookings((prev) =>
                    prev.map((b) => (b.id === bookingId ? { ...b, status: "PENDING", paymentStatus: "PENDING" } : b))
                );
                toast.error(result.error);
            }
        } catch {
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: "PENDING", paymentStatus: "PENDING" } : b))
            );
            toast.error("Failed to reject booking");
        } finally {
            setProcessingIds((prev) => { const s = new Set(prev); s.delete(bookingId); return s; });
        }
    };

    const viewGroupMembers = (booking: any) => {
        setSelectedBooking(booking);
    };

    const handleDownloadExcel = async (gender: "boys" | "girls") => {
        setExcelLoading(gender);
        try {
            const result = await getAccommodationExcelData();
            if (!result.success || !result.boys || !result.girls) {
                toast.error(result.error || "Failed to load accommodation data");
                return;
            }
            const data = gender === "boys" ? result.boys : result.girls;
            if (data.length === 0) {
                toast.info(`No ${gender} accommodation data to export`);
                return;
            }
            const ws = XLSX.utils.json_to_sheet(
                data.map((r) => ({
                    "S.No": r.sNo,
                    Name: r.name,
                    College: r.college,
                    Competitions: r.competitions,
                    "Group Name(s)": (r as { groupNames?: string }).groupNames ?? "—",
                    "Phone Number": r.phone,
                    Gender: r.gender,
                    Email: r.email,
                    "Booking Type": r.bookingType,
                }))
            );
            const colWidths = [
                { wch: 6 },
                { wch: 22 },
                { wch: 28 },
                { wch: 50 },
                { wch: 22 },
                { wch: 14 },
                { wch: 8 },
                { wch: 28 },
                { wch: 12 },
            ];
            ws["!cols"] = colWidths;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, gender === "boys" ? "Boys" : "Girls");
            XLSX.writeFile(wb, `Accommodation_${gender === "boys" ? "Boys" : "Girls"}_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success(`${gender === "boys" ? "Boys" : "Girls"} Excel downloaded`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to download ${gender} Excel`);
        } finally {
            setExcelLoading(null);
        }
    };

    const handleDownloadDayWise = async () => {
        if (selectedDays.length === 0) {
            toast.error("Select at least one day");
            return;
        }
        setDayWiseLoading(true);
        try {
            const result = await getAccommodationExcelDataByDays(selectedDays);
            if (!result.success) {
                toast.error(result.error || "Failed to load data");
                return;
            }
            const boys = result.boys || [];
            const girls = result.girls || [];
            if (boys.length === 0 && girls.length === 0) {
                toast.info("No accommodation data for selected days");
                return;
            }
            const dayStr = selectedDays.sort((a, b) => a - b).join("-");
            const wb = XLSX.utils.book_new();
            if (boys.length > 0) {
                const ws = XLSX.utils.json_to_sheet(
                    boys.map((r) => ({
                        "S.No": r.sNo,
                        Name: r.name,
                        College: r.college,
                        State: r.state,
                        "City/Place": r.city,
                        "Category (e.g. Chitrakala, Sahitya)": r.categoryNames,
                        "Team Name": r.teamName,
                        Competitions: r.competitions,
                        "Phone Number": r.phone,
                        Email: r.email,
                        Gender: r.gender,
                        "Booking Type": r.bookingType,
                    }))
                );
                ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 35 }, { wch: 22 }, { wch: 45 }, { wch: 14 }, { wch: 28 }, { wch: 8 }, { wch: 12 }];
                XLSX.utils.book_append_sheet(wb, ws, "Boys");
            }
            if (girls.length > 0) {
                const ws = XLSX.utils.json_to_sheet(
                    girls.map((r) => ({
                        "S.No": r.sNo,
                        Name: r.name,
                        College: r.college,
                        State: r.state,
                        "City/Place": r.city,
                        "Category (e.g. Chitrakala, Sahitya)": r.categoryNames,
                        "Team Name": r.teamName,
                        Competitions: r.competitions,
                        "Phone Number": r.phone,
                        Email: r.email,
                        Gender: r.gender,
                        "Booking Type": r.bookingType,
                    }))
                );
                ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 35 }, { wch: 22 }, { wch: 45 }, { wch: 14 }, { wch: 28 }, { wch: 8 }, { wch: 12 }];
                XLSX.utils.book_append_sheet(wb, ws, "Girls");
            }
            XLSX.writeFile(wb, `Accommodation_DayWise_Mar${dayStr}_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success(`Day-wise accommodation data downloaded (Mar ${dayStr})`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to download day-wise data");
        } finally {
            setDayWiseLoading(false);
        }
    };

    const toggleDay = (day: number) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
        );
    };

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Accommodation Management</h1>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => handleDownloadExcel("boys")}
                        disabled={!!excelLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        {excelLoading === "boys" ? "Preparing..." : "Download Boys Excel"}
                    </button>
                    <button
                        onClick={() => handleDownloadExcel("girls")}
                        disabled={!!excelLoading}
                        className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-wait text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        {excelLoading === "girls" ? "Preparing..." : "Download Girls Excel"}
                    </button>
                </div>
            </div>

            {/* Day-wise export */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">Day-wise Accommodation Export (March 2026)</h3>
                <p className="text-gray-400 text-sm mb-3">Select days to filter accommodation by competition dates. Downloads Excel with Boys and Girls in separate sheets. Includes State, City, College, Category (Chitrakala, Sahitya, etc.), Team Name for groups.</p>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {[2, 3, 4, 5, 6, 7].map((day) => (
                            <label
                                key={day}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                    selectedDays.includes(day)
                                        ? "bg-amber-600/20 border-amber-500 text-amber-200"
                                        : "bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedDays.includes(day)}
                                    onChange={() => toggleDay(day)}
                                    className="rounded border-gray-500"
                                />
                                <span className="text-sm font-medium">Mar {day}</span>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={handleDownloadDayWise}
                        disabled={dayWiseLoading}
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-wait text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        {dayWiseLoading ? "Preparing..." : "Download Data"}
                    </button>
                </div>
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
                                                            disabled={processingIds.has(booking.id)}
                                                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait text-white px-3 py-1 rounded text-xs transition-colors"
                                                        >
                                                            {processingIds.has(booking.id) ? "Approving..." : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(booking.id)}
                                                            disabled={processingIds.has(booking.id)}
                                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-wait text-white px-3 py-1 rounded text-xs transition-colors"
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
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000000] flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setSelectedBooking(null)}
                >
                    <div
                        className="bg-gray-800 rounded-lg max-w-2xl w-full border border-gray-700 flex flex-col h-[90vh] max-h-[90vh] overflow-hidden my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center gap-4 p-6 pb-4 shrink-0">
                            <h2 className="text-xl font-bold text-white break-words min-w-0 pr-2">Group Members & Competitions</h2>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="text-gray-400 hover:text-white shrink-0 p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4 px-6 pb-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 overscroll-contain">
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
                                            <div key={index} className="text-sm text-gray-300 border-b border-gray-600 pb-2 last:border-b-0">
                                                <div>Name: {member.name}</div>
                                                {member.email && <div>Email: {member.email}</div>}
                                                {member.phone && <div>Phone: {member.phone}</div>}
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
