"use client";

import { useEffect, useState } from "react";
import {
  getDeleteRequests,
  approveDeleteRequest,
  rejectDeleteRequest,
} from "@/actions/admin/approval.action";
import { toast } from "sonner";
import { format } from "date-fns";
import { FiRefreshCw, FiCheck, FiX, FiUser, FiTrash2 } from "react-icons/fi";

type DeleteRequest = {
  id: string;
  requestedById: string;
  requestedByEmail: string;
  requestedByName: string | null;
  requestedByRole: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  categoryId: string | null;
  status: string;
  createdAt: Date;
};

export default function ApprovalClient() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"PENDING" | "ALL">("PENDING");
  const [actingId, setActingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const result = await getDeleteRequests(viewMode);
    if (result.success && result.data) {
      setRequests(result.data as DeleteRequest[]);
    } else {
      toast.error(result.error ?? "Failed to load delete requests");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [viewMode]);

  const handleApprove = async (id: string) => {
    setActingId(id);
    const result = await approveDeleteRequest(id);
    setActingId(null);
    if (result.success) {
      toast.success(result.message ?? "Delete approved");
      loadRequests();
    } else {
      toast.error(result.error ?? "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    const result = await rejectDeleteRequest(id);
    setActingId(null);
    if (result.success) {
      toast.success(result.message ?? "Request rejected");
      loadRequests();
    } else {
      toast.error(result.error ?? "Failed to reject");
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white">Delete Approval</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode("PENDING")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === "PENDING" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Pending
              {pending.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">
                  {pending.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode("ALL")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === "ALL" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              All
            </button>
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <p className="text-zinc-400 text-sm mb-6">
        Master only. When managers/admins delete a category or competition, the request appears here. Approve to delete, or reject to keep it.
      </p>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
          {viewMode === "PENDING" ? "No pending delete requests." : "No delete requests yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FiUser className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="font-medium text-white">{req.requestedByName || req.requestedByEmail}</span>
                  <span className="text-xs text-zinc-500">({req.requestedByEmail})</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">{req.requestedByRole}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <FiTrash2 className="w-4 h-4 shrink-0" />
                  <span>
                    Requested deletion of <strong className="text-zinc-300">{req.entityType}</strong>
                    {req.entityName && <> &quot;{req.entityName}&quot;</>}
                    {req.entityId && <span className="text-zinc-500 font-mono ml-1">({req.entityId.slice(-8)})</span>}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {format(new Date(req.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {req.status === "PENDING" ? (
                  <>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={!!actingId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FiCheck className="w-4 h-4" />
                      {actingId === req.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={!!actingId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                ) : (
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      req.status === "APPROVED"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {req.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
