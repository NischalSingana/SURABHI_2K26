"use client";

import { useState, useEffect } from "react";
import {
  getFestDays,
  getDayWiseParticipants,
  sendWelcomeEmailTest,
  sendWelcomeEmailsForDay,
} from "@/actions/admin/welcome-emails.action";
import { toast } from "sonner";
import { FiMail, FiSend, FiUsers } from "react-icons/fi";

interface FestDay {
  value: string;
  label: string;
}

export default function WelcomeEmailsClient() {
  const [days, setDays] = useState<FestDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [testEmail, setTestEmail] = useState<string>("singananischal@gmail.com");
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    getFestDays().then((res) => {
      if (res.success && res.days) {
        setDays(res.days);
        if (res.days.length > 0 && !selectedDay) {
          setSelectedDay(res.days[0].value);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (selectedDay) {
      setLoadingParticipants(true);
      getDayWiseParticipants(selectedDay).then((res) => {
        setLoadingParticipants(false);
        if (res.success && res.count !== undefined) {
          setParticipantCount(res.count);
        } else {
          setParticipantCount(0);
        }
      });
    } else {
      setParticipantCount(0);
    }
  }, [selectedDay]);

  const handleSendTest = async () => {
    if (!selectedDay || !testEmail.trim()) {
      toast.error("Please select a day and enter test email");
      return;
    }
    setSendingTest(true);
    const res = await sendWelcomeEmailTest(testEmail.trim(), selectedDay);
    setSendingTest(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error || "Failed to send test email");
    }
  };

  const handleSendAll = async () => {
    if (!selectedDay) {
      toast.error("Please select a day");
      return;
    }
    if (participantCount === 0) {
      toast.error("No participants found for this day");
      return;
    }
    const confirm = window.confirm(
      `Send welcome emails to ${participantCount} participants for ${days.find((d) => d.value === selectedDay)?.label}?`
    );
    if (!confirm) return;
    setSendingAll(true);
    const res = await sendWelcomeEmailsForDay(selectedDay);
    setSendingAll(false);
    if (res.success) {
      toast.success(res.message);
      if (res.sent !== undefined) {
        setParticipantCount((p) => Math.max(0, p - (res.sent || 0)));
      }
    } else {
      toast.error(res.error || "Failed to send welcome emails");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Emails</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Send day-wise welcome emails to competition participants with fest info, entry pass, and competition details.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Select Day</label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-2 text-zinc-400">
            <FiUsers size={16} />
            <span>{loadingParticipants ? "Loading..." : `${participantCount} participants`}</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiMail size={18} />
            Send Test Email
          </h3>
          <p className="text-zinc-400 text-sm mb-3">
            Send a sample welcome email to verify the template before sending to all participants.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test email address"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={handleSendTest}
              disabled={sendingTest || !selectedDay}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sendingTest ? "Sending..." : "Send Test"}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiSend size={18} />
            Send Welcome Emails
          </h3>
          <p className="text-zinc-400 text-sm mb-3">
            Send welcome emails to all {participantCount} participants for the selected day. Each email includes the
            entry pass PDF, competition details, venue info, and spot registration instructions.
          </p>
          <button
            onClick={handleSendAll}
            disabled={sendingAll || !selectedDay || participantCount === 0}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sendingAll ? "Sending..." : `Send to ${participantCount} Participants`}
          </button>
        </div>
      </div>
    </div>
  );
}
