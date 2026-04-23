// src/pages/school-admin/ManageClasses.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Search,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Archive,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";

// ✅ consistent with classRoutes / ManageClasses
import api from "../../services/api";

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color = "#6366f1" }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: color + "22", color }}
    >
      {label}
    </span>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function Pill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Icon size={13} style={{ color }} />
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
      <span>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ManageClasses() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [showArchived, setShowArchived] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/classes");
      // support both { classes: [] } and plain array
      setClasses(Array.isArray(res.data) ? res.data : (res.data.classes ?? []));
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // ── create class ───────────────────────────────────────────────────────────
 const handleCreate = async () => {
  if (!form.name?.trim() || !form.section?.trim() || !form.academicYear?.trim()) {
    return alert("Class name, section, and academic year are required");
  }

  setSaving(true);
  try {
    await api.post("/classes", {
      name: form.name.trim(),
      section: form.section.trim(),
      academicYear: form.academicYear.trim(),
      classTeacherName: form.classTeacherName?.trim() || "",
      room: form.room?.trim() || "",
      capacity: form.capacity || 40,
      notes: form.notes?.trim() || "",
    });

    alert("Class created successfully!");
    await fetchClasses();
    setAddModal(false);
    setForm({ capacity: 40 });
  } catch (e) {
    const msg = e.response?.data?.message || "Failed to create class";
    console.error("Create failed:", e.response?.data);
    alert(msg);
  } finally {
    setSaving(false);
  }
};

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = classes
    .filter((c) => (showArchived ? c.isArchived : !c.isArchived))
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.section?.toLowerCase().includes(q) ||
        c.academicYear?.toLowerCase().includes(q) ||
        c.classTeacherName?.toLowerCase().includes(q)
      );
    });

  // ── input helper ───────────────────────────────────────────────────────────
  const inp =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50";

  const F = (key, label, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={inp}
      />
    </div>
  );

  // ── colour per grade level ─────────────────────────────────────────────────
  const cardAccent = (name = "") => {
    const n = parseInt(name.replace(/\D/g, "")) || 0;
    if (n <= 3) return { border: "#818cf8", bg: "#eef2ff", icon: "#6366f1" };
    if (n <= 6) return { border: "#34d399", bg: "#ecfdf5", icon: "#10b981" };
    if (n <= 9) return { border: "#60a5fa", bg: "#eff6ff", icon: "#3b82f6" };
    return { border: "#f472b6", bg: "#fdf2f8", icon: "#ec4899" };
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw size={28} className="text-indigo-400 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <AlertTriangle size={32} className="text-red-400" />
        <p className="text-slate-600 font-medium">{error}</p>
        <button
          onClick={fetchClasses}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Classes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} {showArchived ? "archived" : "active"} class
            {filtered.length !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* archived toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              showArchived
                ? "bg-amber-50 border-amber-200 text-amber-600"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Archive size={13} />
            {showArchived ? "Active Classes" : "Archived"}
          </button>

          {/* view toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 hover:bg-slate-50"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 hover:bg-slate-50"}`}
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              setForm({ capacity: 40 });
              setAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> New Class
          </button>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, section, teacher…"
          className="pl-9 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
        />
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <GraduationCap size={48} className="mb-3 opacity-25" />
          <p className="font-semibold text-slate-500">No classes found</p>
          <p className="text-sm mt-1">
            {search
              ? "Try a different search term"
              : "Create your first class to get started"}
          </p>
          {!search && (
            <button
              onClick={() => {
                setForm({ capacity: 40 });
                setAddModal(true);
              }}
              className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
            >
              Create Class
            </button>
          )}
        </div>
      )}

      {/* ── Grid view ────────────────────────────────────────────────────── */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((cls) => {
            const accent = cardAccent(cls.name);
            const studentCount =
              cls.students?.filter((s) => s.isActive)?.length ??
              cls.studentCount ??
              0;
            return (
              <button
                key={cls._id}
                onClick={() => navigate(`/school-admin/classes/${cls._id}`)}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all text-left p-5 relative overflow-hidden"
              >
                {/* accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: accent.border }}
                />

                <div className="flex items-start justify-between mb-4 mt-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: accent.bg }}
                  >
                    <GraduationCap size={22} style={{ color: accent.icon }} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {cls.isArchived && (
                      <Badge label="Archived" color="#94a3b8" />
                    )}
                    {cls.isPromoted && (
                      <Badge label="Promoted" color="#8b5cf6" />
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-800 leading-tight">
                  {cls.displayName || `${cls.name} — ${cls.section}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">
                  {cls.academicYear}
                </p>

                <div className="flex flex-wrap gap-3 mb-4">
                  <Pill
                    icon={Users}
                    value={studentCount}
                    label="students"
                    color="#6366f1"
                  />
                  <Pill
                    icon={BookOpen}
                    value={cls.subjects?.length ?? 0}
                    label="subjects"
                    color="#0ea5e9"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 truncate max-w-[70%]">
                    {cls.classTeacherName || (
                      <span className="italic">No class teacher</span>
                    )}
                    {cls.room && <span> · Room {cls.room}</span>}
                  </p>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── List view ────────────────────────────────────────────────────── */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  "Class",
                  "Section",
                  "Academic Year",
                  "Teacher",
                  "Room",
                  "Students",
                  "Subjects",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((cls) => {
                const accent = cardAccent(cls.name);
                const studentCount =
                  cls.students?.filter((s) => s.isActive)?.length ??
                  cls.studentCount ??
                  0;
                return (
                  <tr
                    key={cls._id}
                    onClick={() => navigate(`/school-admin/classes/${cls._id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: accent.bg }}
                        >
                          <GraduationCap
                            size={15}
                            style={{ color: accent.icon }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800">
                          {cls.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{cls.section}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {cls.academicYear || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {cls.classTeacherName || (
                        <span className="italic text-slate-300">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {cls.room || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-indigo-600">
                        {studentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {cls.subjects?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {cls.isArchived ? (
                        <Badge label="Archived" color="#94a3b8" />
                      ) : cls.isPromoted ? (
                        <Badge label="Promoted" color="#8b5cf6" />
                      ) : (
                        <Badge label="Active" color="#10b981" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Class Modal ──────────────────────────────────────────────── */}
      {addModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Create New Class
              </h3>
              <button
                onClick={() => setAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {F("name", "Class Name", "text", "e.g. Grade 10")}
                {F("section", "Section", "text", "e.g. A")}
                {F("academicYear", "Academic Year", "text", "e.g. 2024-25")}
                {F(
                  "classTeacherName",
                  "Class Teacher",
                  "text",
                  "Teacher's name",
                )}
                {F("room", "Room", "text", "Room no.")}
                {F("capacity", "Capacity", "number")}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400"
                  placeholder="Optional notes…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setAddModal(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
