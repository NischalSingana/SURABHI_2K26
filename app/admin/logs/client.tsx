"use client";

import { useEffect, useState } from "react";
import { getActivityLogs } from "@/actions/admin/logs.action";
import { toast } from "sonner";
import { format } from "date-fns";
import { FiRefreshCw, FiUser, FiActivity, FiPackage } from "react-icons/fi";

const ACTION_LABELS: Record<string, string> = {
  ADD_CATEGORY: "Added category",
  EDIT_CATEGORY: "Edited category",
  DELETE_CATEGORY: "Deleted category",
  ADD_EVENT: "Added event",
  EDIT_EVENT: "Edited event",
  DELETE_EVENT: "Deleted event",
  UPLOAD_CATEGORY_IMAGE: "Uploaded category image",
  UPLOAD_EVENT_IMAGE: "Uploaded event image",
  REQUEST_DELETE_CATEGORY: "Requested category deletion",
  REQUEST_DELETE_EVENT: "Requested event deletion",
};

export default function LogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [limit] = useState(100);

  const loadLogs = async () => {
    setLoading(true);
    const result = await getActivityLogs({
      action: actionFilter || undefined,
      limit,
      offset: 0,
    });
    if (result.success && result.data) {
      const res = result as { data: any[]; total?: number };
      setLogs(res.data);
      setTotal(res.total ?? res.data.length);
    } else {
      toast.error(result.error ?? "Failed to load logs");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <p className="text-zinc-400 text-sm mb-6">
        Master-only view. Tracks admin/manager actions: added/edited events &amp; categories, uploads, delete requests.
      </p>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
          No activity logs found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-sm text-zinc-300 whitespace-nowrap">
                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-zinc-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">{log.userName || log.userEmail}</p>
                        <p className="text-xs text-zinc-500">{log.userEmail} · {log.userRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-sm font-medium">
                      <FiActivity className="w-3.5 h-3.5" />
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <FiPackage className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-sm text-zinc-300">{log.entityName ?? log.entityType ?? "—"}</span>
                      {log.entityId && (
                        <span className="text-xs text-zinc-500 font-mono">{log.entityId.slice(-8)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {log.details && typeof log.details === "object" ? (
                      <pre className="text-xs text-zinc-500 whitespace-pre-wrap max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </pre>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          Showing {logs.length} of {total} log entries.
        </p>
      )}
    </div>
  );
}
