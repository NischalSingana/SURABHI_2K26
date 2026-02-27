"use client";

import { useEffect, useState } from "react";
import { getAccommodationAnalytics } from "@/actions/admin/accommodation-analytics.action";
import {
  HiBuildingOffice2,
  HiUserGroup,
  HiUser,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiChartBar,
  HiMapPin,
  HiEye,
  HiXMark,
} from "react-icons/hi2";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Stats {
  totalBookings: number;
  totalGuests: number;
  byGender: { MALE: number; FEMALE: number };
  byType: { INDIVIDUAL: number; GROUP: number };
  byStatus: {
    PENDING: number;
    CONFIRMED: number;
    CANCELLED: number;
    REJECTED: number;
  };
  byCollege: { name: string; bookings: number; male: number; female: number; guests: number }[];
}

interface AccommodationBookingItem {
  primaryName: string;
  totalMembers: number;
  gender: string;
  status: string;
  competitions?: string[];
  user?: { collage?: string | null } | null;
}

export default function AccommodationAnalyticsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMembers, setViewingMembers] = useState<any | null>(null);

  const handleDownloadAccommodationReportPdf = () => {
    if (!stats) return;

    try {
      const doc = new jsPDF("l", "mm", "a4");
      const typedBookings = bookings as AccommodationBookingItem[];
      const timestamp = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).toUpperCase();

      doc.setFontSize(16);
      doc.text("Accommodation Analytics Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${timestamp}`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [["Metric", "Count"]],
        body: [
          ["Total Bookings", String(stats.totalBookings)],
          ["Total Guests", String(stats.totalGuests)],
          ["Male Bookings", String(stats.byGender.MALE)],
          ["Female Bookings", String(stats.byGender.FEMALE)],
          ["Pending", String(stats.byStatus.PENDING)],
          ["Confirmed", String(stats.byStatus.CONFIRMED)],
        ],
        theme: "grid",
        headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 2.5, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
        columnStyles: { 1: { halign: "right" } },
      });

      let currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 28) + 6;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("College-wise Summary", 14, currentY);
      currentY += 2;

      autoTable(doc, {
        startY: currentY,
        head: [["College", "Bookings", "Male", "Female", "Total Guests"]],
        body: stats.byCollege.map((c) => [c.name, String(c.bookings), String(c.male), String(c.female), String(c.guests)]),
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.2, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
      });

      currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 6;
      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(12);
      doc.text("Guest-wise Competition Details", 14, currentY);
      currentY += 2;

      autoTable(doc, {
        startY: currentY,
        head: [["Name", "College", "Gender", "Guests", "Status", "Competitions"]],
        body: typedBookings.map((b) => [
          b.primaryName || "—",
          (b.user?.collage || "Unknown").toString(),
          (b.gender || "—").toString(),
          String(b.totalMembers || 0),
          (b.status || "—").toString(),
          Array.isArray(b.competitions) && b.competitions.length > 0
            ? b.competitions.join(", ")
            : "No active physical competition",
        ]),
        theme: "grid",
        headStyles: { fillColor: [142, 68, 173], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
      });

      doc.save(`Accommodation_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Accommodation analytics PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate accommodation report PDF");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await getAccommodationAnalytics();
      if (result.success && result.data) {
        setStats(result.data.stats);
        setBookings(result.data.bookings);
      } else {
        toast.error(result.error || "Failed to load analytics");
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Loader />;

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-400">
        No accommodation analytics data available.
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: HiBuildingOffice2,
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Total Guests",
      value: stats.totalGuests,
      icon: HiUserGroup,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Male Accommodation",
      value: stats.byGender.MALE,
      icon: HiUser,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Female Accommodation",
      value: stats.byGender.FEMALE,
      icon: HiUser,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Individual",
      value: stats.byType.INDIVIDUAL,
      icon: HiUser,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Group",
      value: stats.byType.GROUP,
      icon: HiUserGroup,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Pending",
      value: stats.byStatus.PENDING,
      icon: HiClock,
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Confirmed",
      value: stats.byStatus.CONFIRMED,
      icon: HiCheckCircle,
      color: "from-green-500 to-teal-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Cancelled / Rejected",
      value: stats.byStatus.CANCELLED + stats.byStatus.REJECTED,
      icon: HiXCircle,
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Accommodation Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Other colleges physical participants only (KL, international & virtual excluded)
          </p>
        </div>
        <button
          onClick={handleDownloadAccommodationReportPdf}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Accommodation PDF
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${card.bgColor} border border-white/10 rounded-xl p-4 backdrop-blur-sm`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <Icon className="text-lg text-white" />
                </div>
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  {card.title}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
            </motion.div>
          );
        })}
      </div>

      {/* By College */}
      {stats.byCollege.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <HiMapPin />
            By College
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">College</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Bookings</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Male</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Female</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Guests</th>
                </tr>
              </thead>
              <tbody>
                {stats.byCollege.map((c) => (
                  <tr key={c.name} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white">{c.name}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{c.bookings}</td>
                    <td className="py-3 px-4 text-right text-blue-300">{c.male}</td>
                    <td className="py-3 px-4 text-right text-pink-300">{c.female}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{c.guests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
      >
        <h2 className="text-lg font-bold text-white p-4 border-b border-white/10 flex items-center gap-2">
          <HiChartBar />
          All Bookings
        </h2>
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No bookings found</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900/95 backdrop-blur z-10">
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">College</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Gender</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Guests</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white">{b.primaryName}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {(b.user?.collage as string) || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          b.gender === "MALE"
                            ? "text-blue-400"
                            : "text-pink-400"
                        }
                      >
                        {b.gender}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{b.bookingType}</td>
                    <td className="py-3 px-4 text-gray-300">{b.totalMembers}</td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          b.status === "CONFIRMED"
                            ? "text-green-400"
                            : b.status === "PENDING"
                              ? "text-yellow-400"
                              : "text-gray-500"
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setViewingMembers(b)}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <HiEye size={14} />
                        View all members
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* View Members Modal */}
      {viewingMembers && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setViewingMembers(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">
                Members — {viewingMembers.primaryName}
              </h3>
              <button
                onClick={() => setViewingMembers(null)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <HiXMark size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Guest 1 (Primary)</p>
                  <p className="text-white font-medium">{viewingMembers.primaryName}</p>
                  <p className="text-gray-400 text-sm">{viewingMembers.primaryEmail}</p>
                  <p className="text-gray-400 text-sm">{viewingMembers.primaryPhone}</p>
                </div>
                {Array.isArray(viewingMembers.groupMembers) &&
                  viewingMembers.groupMembers.map(
                    (m: { name?: string; phone?: string }, i: number) => (
                      <div key={i} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Guest {i + 2}</p>
                        <p className="text-white font-medium">{m.name || "—"}</p>
                        <p className="text-gray-400 text-sm">{m.phone || "—"}</p>
                      </div>
                    )
                  )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
}
