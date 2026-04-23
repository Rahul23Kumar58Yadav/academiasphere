// src/pages/school-admin/ManageStudents.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  CheckCircle,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth"; 

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = "/api/v1";
// ─── Mock fallback ────────────────────────────────────────────────────────────
const MOCK = [
  {
    id: "m1",
    studentId: "STU001",
    name: "John Doe",
    email: "john@ex.com",
    phone: "+91 9000000001",
    class: "Grade 10-A",
    rollNo: "101",
    dob: "2008-05-15",
    gender: "Male",
    bloodGroup: "O+",
    parentName: "Robert Doe",
    parentPhone: "+91 9000000002",
    enrollmentDate: "2023-04-01",
    status: "Active",
    attendance: 95,
    gpa: 3.8,
    fees: "Paid",
  },
  {
    id: "m2",
    studentId: "STU002",
    name: "Jane Smith",
    email: "jane@ex.com",
    phone: "+91 9000000003",
    class: "Grade 10-B",
    rollNo: "102",
    dob: "2008-07-20",
    gender: "Female",
    bloodGroup: "A+",
    parentName: "Michael Smith",
    parentPhone: "+91 9000000004",
    enrollmentDate: "2023-04-01",
    status: "Active",
    attendance: 92,
    gpa: 3.9,
    fees: "Paid",
  },
  {
    id: "m3",
    studentId: "STU003",
    name: "Alice Johnson",
    email: "alice@ex.com",
    phone: "+91 9000000005",
    class: "Grade 9-A",
    rollNo: "103",
    dob: "2009-03-10",
    gender: "Female",
    bloodGroup: "B+",
    parentName: "David Johnson",
    parentPhone: "+91 9000000006",
    enrollmentDate: "2023-04-01",
    status: "Inactive",
    attendance: 88,
    gpa: 3.6,
    fees: "Pending",
  },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => {
  const c =
    {
      blue: "bg-blue-50 text-blue-600 ring-blue-100",
      green: "bg-green-50 text-green-600 ring-green-100",
      red: "bg-red-50 text-red-600 ring-red-100",
      yellow: "bg-yellow-50 text-yellow-600 ring-yellow-100",
    }[color] || "bg-blue-50 text-blue-600 ring-blue-100";
  const [bg, text, ring] = c.split(" ");
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg} ring-1 ${ring}`}>
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ManageStudents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch } = useAuth();
  // ── toast from navigation state (set by StudentEnrollment on success) ──────
  const [toast, setToast] = useState(location.state?.toast || null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── data ────────────────────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalActive: 0, totalInactive: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── ui ──────────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // ── derived stats ────────────────────────────────────────────────────────────
  const pendingFees = students.filter((s) => s.fees === "Pending").length;

  // ── fetch from your existing getStudents controller ───────────────────────
  // ── fetch from your existing getStudents controller ───────────────────────
const loadStudents = useCallback(async () => {
  setIsLoading(true);
  setApiError(null);

  try {
    // Use authFetch — it automatically attaches the JWT token
    const res = await authFetch(
      `/students?limit=200&status=all&_t=${Date.now()}`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const rawList = json.success ? (json.students || json.data || []) : [];
    const total   = json.total ?? rawList.length;

    // Backend already maps the data, so rawList items are already shaped
    // Just normalise any missing fields defensively
    const normalised = rawList.map((doc) => ({
      id:             doc.id || doc._id?.toString() || "",
      studentId:      doc.studentId || doc.admissionNo || doc._id?.toString() || "",
      name:           doc.name || `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || "Unnamed",
      email:          doc.email        || "—",
      phone:          doc.phone        || "—",
      class:          doc.class        || (doc.section ? `${doc.grade}-${doc.section}` : doc.grade) || "—",
      rollNo:         doc.rollNo       || "—",
      dob:            doc.dob          || "—",
      gender:         doc.gender       || "—",
      bloodGroup:     doc.bloodGroup   || "—",
      attendance:     doc.attendance   ?? 0,
      gpa:            doc.gpa          ?? 0,
      fees:           doc.fees         || "Pending",
      status:         doc.status       || "Inactive",
      address:        doc.address      || "—",
      parentName:     doc.parentName   || "—",
      parentPhone:    doc.parentPhone  || "—",
      enrollmentDate: doc.enrollmentDate || "—",
    }));

    setStudents(normalised);
    setTotalCount(total);
    setStats({
      totalActive:   normalised.filter((s) => s.status === "Active").length,
      totalInactive: normalised.filter((s) => s.status === "Inactive").length,
    });

  } catch (err) {
    console.error("Failed to load students:", err);
    setApiError("Could not load students from server. Please try refreshing.");
    // Remove MOCK fallback so you don't see fake data on auth failure
    setStudents([]);
    setTotalCount(0);
    setStats({ totalActive: 0, totalInactive: 0 });
  } finally {
    setIsLoading(false);
  }
}, [authFetch]);

 useEffect(() => {
  loadStudents();
}, []); 

 useEffect(() => {
  if (location.state?.toast) {
    loadStudents();
    // Clear navigation state so it doesn't re-trigger
    window.history.replaceState({}, document.title);
  }
}, [location.state?.toast]);

  // ── filtering + sorting ────────────────────────────────────────────────────
  useEffect(() => {
    let list = [...students];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q),
      );
    }
    if (selectedClass !== "all")
      list = list.filter((s) => s.class === selectedClass);
    if (selectedStatus !== "all")
      list = list.filter((s) => s.status === selectedStatus);
    list.sort((a, b) => {
      const d = sortConfig.direction === "asc" ? 1 : -1;
      return a[sortConfig.key] < b[sortConfig.key]
        ? -d
        : a[sortConfig.key] > b[sortConfig.key]
          ? d
          : 0;
    });
    setFilteredStudents(list);
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedStatus, students, sortConfig]);

  const classOptions = [...new Set(students.map((s) => s.class))].sort();
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const idxFirst = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredStudents.slice(idxFirst, idxFirst + ITEMS_PER_PAGE);

  // ── handlers ────────────────────────────────────────────────────────────────
  const toggleSort = (key) =>
    setSortConfig((p) => ({
      key,
      direction: p.key === key && p.direction === "asc" ? "desc" : "asc",
    }));
  const toggleSelect = (id) =>
    setSelectedStudents((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () =>
    setSelectedStudents(
      selectedStudents.length === paginated.length
        ? []
        : paginated.map((s) => s.id),
    );

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      // Your controller soft-deletes (sets status=inactive)
      const res = await fetch(`${API_BASE}/school-admin/students/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setStudents((p) => p.filter((s) => s.id !== id));
        setTotalCount((p) => Math.max(0, p - 1));
      } else alert("Failed to delete. Try again.");
    } catch {
      setStudents((p) => p.filter((s) => s.id !== id));
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedStudents.length} student(s)?`))
      return;
    await Promise.allSettled(
      selectedStudents.map((id) =>
        fetch(`${API_BASE}/school-admin/students/${id}`, {
          method: "DELETE",
          credentials: "include",
        }),
      ),
    );
    setStudents((p) => p.filter((s) => !selectedStudents.includes(s.id)));
    setTotalCount((p) => Math.max(0, p - selectedStudents.length));
    setSelectedStudents([]);
  };

  const exportCSV = () => {
    const h = [
      "ID",
      "Name",
      "Email",
      "Class",
      "Roll No",
      "Status",
      "Attendance",
      "GPA",
      "Fees",
    ];
    const rows = filteredStudents.map((s) => [
      s.studentId,
      s.name,
      s.email,
      s.class,
      s.rollNo,
      s.status,
      `${s.attendance}%`,
      s.gpa,
      s.fees,
    ]);
    const csv = [h, ...rows].map((r) => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "students.csv",
    });
    a.click();
  };

  const badge = (v) =>
    v === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  const feesBadge = (v) =>
    v === "Paid"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  const sortIcon = (k) =>
    sortConfig.key !== k ? " ↕" : sortConfig.direction === "asc" ? " ↑" : " ↓";

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Success toast ─────────────────────────────────────────────── */}
      {toast && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 shadow-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span className="font-medium">{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isLoading
              ? "Loading…"
              : `${totalCount.toLocaleString()} student${totalCount !== 1 ? "s" : ""} enrolled`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              // Force no-cache fetch
              loadStudents();
            }}
            title="Refresh"
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => navigate("/school-admin/students/enroll")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* ── API error banner ───────────────────────────────────────────── */}
      {apiError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {apiError}
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={totalCount}
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Active"
          value={stats.totalActive}
          color="green"
        />
        <StatCard
          icon={UserX}
          label="Inactive"
          value={stats.totalInactive}
          color="red"
        />
        <StatCard
          icon={AlertCircle}
          label="Fees Pending"
          value={pendingFees}
          color="yellow"
        />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or email…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Classes</option>
            {classOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {selectedStudents.length > 0 && (
          <div className="mt-3 flex items-center justify-between px-4 py-2.5 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              {selectedStudents.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={bulkDelete}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedStudents([])}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading students…</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Users className="w-12 h-12 text-gray-200" />
            <p className="text-gray-500 font-medium">No students found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || selectedClass !== "all" || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : 'Click "Add Student" to enroll the first student'}
            </p>
            {!searchTerm &&
              selectedClass === "all" &&
              selectedStatus === "all" && (
                <button
                  onClick={() => navigate("/school-admin/students/enroll")}
                  className="mt-1 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add First Student
                </button>
              )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          paginated.length > 0 &&
                          selectedStudents.length === paginated.length
                        }
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-blue-600"
                      />
                    </th>
                    {[
                      ["studentId", "ID"],
                      ["name", "Student"],
                      ["class", "Class"],
                      [null, "Contact"],
                      ["attendance", "Attendance"],
                      ["gpa", "GPA"],
                      ["fees", "Fees"],
                      ["status", "Status"],
                      [null, "Actions"],
                    ].map(([k, l]) => (
                      <th
                        key={l}
                        onClick={() => k && toggleSort(k)}
                        className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${k ? "cursor-pointer hover:text-gray-700 select-none" : ""}`}
                      >
                        {l}
                        {k && sortIcon(k)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {s.studentId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{s.class}</p>
                        <p className="text-xs text-gray-400">
                          Roll: {s.rollNo}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {s.phone}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${s.attendance >= 85 ? "bg-green-500" : s.attendance >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${s.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                            {s.attendance}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {s.gpa}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${feesBadge(s.fees)}`}
                        >
                          {s.fees}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge(s.status)}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setShowViewModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStudent(s.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
              <p className="text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {idxFirst + 1}
                </span>
                –
                <span className="font-medium text-gray-700">
                  {Math.min(idxFirst + ITEMS_PER_PAGE, filteredStudents.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {filteredStudents.length}
                </span>
                {filteredStudents.length !== totalCount && (
                  <span className="text-gray-400">
                    {" "}
                    (filtered from {totalCount})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium ${currentPage === i + 1 ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-white text-gray-600"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── View modal ────────────────────────────────────────────────── */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">
                Student Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.studentId} · {selectedStudent.class}
                  </p>
                  <span
                    className={`mt-1 inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${badge(selectedStudent.status)}`}
                  >
                    {selectedStudent.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Roll No", selectedStudent.rollNo],
                  ["DOB", selectedStudent.dob],
                  ["Gender", selectedStudent.gender],
                  ["Blood Group", selectedStudent.bloodGroup],
                  ["Email", selectedStudent.email],
                  ["Phone", selectedStudent.phone],
                  ["Address", selectedStudent.address],
                  ["Parent", selectedStudent.parentName],
                  ["Parent Phone", selectedStudent.parentPhone],
                  ["Enrolled", selectedStudent.enrollmentDate],
                  ["Attendance", `${selectedStudent.attendance}%`],
                  ["GPA", selectedStudent.gpa],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {l}
                    </p>
                    <p className="text-sm font-medium text-gray-800 break-words">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ────────────────────────────────────────────────── */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Student</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Editing <strong>{selectedStudent.name}</strong>
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigate(`/school-admin/students/${selectedStudent.id}/edit`);
                  setShowEditModal(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Open Edit Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
