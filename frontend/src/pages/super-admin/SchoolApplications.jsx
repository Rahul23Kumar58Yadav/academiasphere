import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";   // ← Import useAuth

const SchoolApplications = () => {
  const { authFetch, logout, user } = useAuth();   // ← Use context

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ==================== FETCH APPLICATIONS ====================
  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `/super-admin/applications?status=${filter}`
      );

      if (!res) {
        // authFetch already handled logout on 401
        return;
      }

      if (!res.ok) {
        if (res.status === 401) {
          logout("session_expired");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setApps(data.applications || data || []);
    } catch (err) {
      console.error("❌ Failed to fetch applications:", err);
      // You can add a toast notification here later
    } finally {
      setLoading(false);
    }
  };

  // ==================== APPROVE APPLICATION ====================
  const handleApprove = async (id) => {
    if (!id) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`/super-admin/applications/${id}/approve`, {
        method: "PUT",
      });

      if (!res) return; // authFetch handled logout

      if (res.ok) {
        alert("School approved successfully!");
        fetchApps();        // Refresh list
        setSelected(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Failed to approve school");
      }
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Error approving school. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== REJECT APPLICATION ====================
  const handleReject = async () => {
    if (!rejectModal?._id) return;

    setActionLoading(true);
    try {
      const res = await authFetch(
        `/super-admin/applications/${rejectModal._id}/reject`,
        {
          method: "PUT",
          body: JSON.stringify({ reason }),
        }
      );

      if (!res) return;

      if (res.ok) {
        alert("Application rejected successfully!");
        setRejectModal(null);
        setReason("");
        fetchApps();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Failed to reject application");
      }
    } catch (err) {
      console.error("Reject failed:", err);
      alert("Error rejecting application. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch applications when filter changes
  useEffect(() => {
    fetchApps();
  }, [filter]);

  const STATUS_COLORS = {
    pending: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
    approved: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
    rejected: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
  };

  const S = STATUS_COLORS;

  return (
    <div style={{ padding: 32, fontFamily: "'Sora', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#0a0f2e",
              marginBottom: 4,
            }}
          >
            School Applications
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Review, approve, or reject school registration requests
          </p>
        </div>
        <button
          onClick={fetchApps}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            border: "1.5px solid #e2e8f0",
            background: "white",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 20px",
              borderRadius: 100,
              border: "1.5px solid",
              fontFamily: "inherit",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              borderColor: filter === s ? "#1a56db" : "#e2e8f0",
              background: filter === s ? "#1a56db" : "white",
              color: filter === s ? "white" : "#64748b",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
          Loading applications...
        </div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
          <Building2
            size={40}
            style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}
          />
          No {filter} applications found
        </div>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8faff" }}>
                {[
                  "School",
                  "Location",
                  "Admin Contact",
                  "Board",
                  "Applied",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app, i) => {
                const sc = S[app.status] || S.pending;
                return (
                  <tr
                    key={app._id}
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      background: i % 2 === 0 ? "white" : "#fafbff",
                    }}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#0a0f2e",
                          marginBottom: 2,
                        }}
                      >
                        {app.name}
                      </div>
                      {app.schoolCode && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#1a56db",
                            fontWeight: 600,
                          }}
                        >
                          {app.schoolCode}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "0.85rem",
                        color: "#64748b",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={13} /> {app.address?.city},{" "}
                        {app.address?.state}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "#0a0f2e",
                        }}
                      >
                        {app.adminName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          marginTop: 2,
                        }}
                      >
                        {app.adminEmail}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 100,
                          background: "rgba(26,86,219,0.08)",
                          color: "#1a56db",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                        }}
                      >
                        {app.type}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "0.82rem",
                        color: "#64748b",
                      }}
                    >
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 100,
                          background: sc.bg,
                          color: sc.text,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: sc.dot,
                          }}
                        />
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setSelected(app)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1.5px solid #e2e8f0",
                            background: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          <Eye size={13} /> View
                        </button>

                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(app._id)}
                              disabled={actionLoading}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "#d1fae5",
                                color: "#065f46",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: "0.78rem",
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModal(app)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "#fee2e2",
                                color: "#991b1b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: "0.78rem",
                                fontWeight: 700,
                              }}
                            >
                              <XCircle size={13} /> Reject
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
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,15,46,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 36,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    color: "#0a0f2e",
                  }}
                >
                  {selected.name}
                </h2>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.85rem",
                    marginTop: 4,
                  }}
                >
                  {selected.address?.city}, {selected.address?.state}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  fontSize: "1.1rem",
                }}
              >
                ×
              </button>
            </div>

            {[
              ["Board / Type", selected.type],
              ["Category", selected.category],
              ["School Type", selected.schoolType],
              ["Established", selected.established || "—"],
              ["Website", selected.website || "—"],
              ["Admin Name", selected.adminName],
              ["Admin Email", selected.adminEmail],
              ["Admin Phone", selected.adminPhone],
              [
                "Applied On",
                new Date(selected.createdAt).toLocaleString("en-IN"),
              ],
              ["Status", selected.status],
              selected.rejectionReason && [
                "Rejection Reason",
                selected.rejectionReason,
              ],
            ]
              .filter(Boolean)
              .map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "0.88rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#64748b" }}>{k}</span>
                  <span
                    style={{
                      color: "#0a0f2e",
                      textAlign: "right",
                      maxWidth: "60%",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}

            {selected.status === "pending" && (
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                  onClick={() => {
                    handleApprove(selected._id);
                  }}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 10,
                    border: "none",
                    background: "#10b981",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle size={18} />{" "}
                  {actionLoading ? "Approving..." : "Approve School"}
                </button>
                <button
                  onClick={() => {
                    setRejectModal(selected);
                    setSelected(null);
                  }}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 10,
                    border: "1.5px solid #fecaca",
                    background: "white",
                    color: "#dc2626",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <XCircle size={18} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,15,46,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 36,
              width: "100%",
              maxWidth: 440,
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#0a0f2e",
                marginBottom: 8,
              }}
            >
              Reject Application
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.88rem",
                marginBottom: 20,
              }}
            >
              Rejecting <strong>{rejectModal.name}</strong>. The applicant will
              be notified by email.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional: explain the reason for rejection..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontFamily: "inherit",
                fontSize: "0.9rem",
                resize: "vertical",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{
                  flex: 1,
                  padding: 13,
                  borderRadius: 10,
                  border: "1.5px solid #e2e8f0",
                  background: "white",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: 13,
                  borderRadius: 10,
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolApplications;
