// src/pages/school-admin/SubjectsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, Check,
  AlertCircle, ChevronDown, GraduationCap, Tag, Hash, Layers,
} from "lucide-react";

// ── API instance (matches ManageClasses / ClassDashboard pattern) ─────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";
const api = axios.create({ baseURL: API, withCredentials: true });

// ── helpers ───────────────────────────────────────────────────────────────────
const SUBJECT_TYPES = ["Core", "Elective", "Language", "Co-Curricular", "Vocational"];

const TYPE_COLORS = {
  Core:           "bg-blue-100 text-blue-700",
  Elective:       "bg-purple-100 text-purple-700",
  Language:       "bg-green-100 text-green-700",
  "Co-Curricular":"bg-orange-100 text-orange-700",
  Vocational:     "bg-pink-100 text-pink-700",
};

const EMPTY_FORM = {
  name: "", code: "", description: "",
  type: "Core", maxMarks: 100, passMarks: 33, assignedClasses: [],
};

const CLASS_SUGGESTIONS = [
  "Class 1","Class 2","Class 3","Class 4","Class 5","Class 6",
  "Class 7","Class 8","Class 9","Class 10","Class 11","Class 12",
];

// ── module-level counter so IDs are always unique ─────────────────────────────
let _toastId = 0;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${t.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
      >
        {t.type === "success"
          ? <Check className="w-4 h-4 flex-shrink-0" />
          : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
        <span className="flex-1">{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
  </div>
);

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ subject, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
        <Trash2 className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-center font-semibold text-gray-900 text-lg">Delete Subject?</h3>
      <p className="text-center text-gray-500 text-sm mt-2">
        <strong>{subject?.name}</strong> will be removed. This action can be undone by an admin.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

// ── Subject Form Modal ────────────────────────────────────────────────────────
const SubjectFormModal = ({ mode, initial, onSave, onClose, saving }) => {
  const [form, setForm]               = useState(initial || EMPTY_FORM);
  const [classInput, setClassInput]   = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addClassTag = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!form.assignedClasses.some((c) => c.className === trimmed))
      set("assignedClasses", [...form.assignedClasses, { className: trimmed }]);
    setClassInput("");
    setShowSuggestions(false);
  };

  const removeClassTag = (className) =>
    set("assignedClasses", form.assignedClasses.filter((c) => c.className !== className));

  const suggestions = CLASS_SUGGESTIONS.filter(
    (s) =>
      s.toLowerCase().includes(classInput.toLowerCase()) &&
      !form.assignedClasses.some((c) => c.className === s),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "create" ? "Add New Subject" : "Edit Subject"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="px-6 py-5 space-y-5">
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. MATH"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Subject Type
            </label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white pr-9"
              >
                {SUBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description or notes…"
              rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Marks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Max Marks</label>
              <input
                type="number" min={1} value={form.maxMarks}
                onChange={(e) => set("maxMarks", Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pass Marks</label>
              <input
                type="number" min={0} value={form.passMarks}
                onChange={(e) => set("passMarks", Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Assigned Classes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Assigned Classes
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
              {form.assignedClasses.length === 0
                ? <span className="text-xs text-gray-400 italic">No classes assigned yet</span>
                : form.assignedClasses.map((c) => (
                    <span
                      key={c.className}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      <GraduationCap className="w-3 h-3" />
                      {c.className}
                      <button type="button" onClick={() => removeClassTag(c.className)} className="ml-0.5 hover:text-blue-900 transition">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={classInput}
                onChange={(e) => { setClassInput(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addClassTag(classInput); }
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
                placeholder="Type or select a class…"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s} type="button" onMouseDown={() => addClassTag(s)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Press Enter or select from dropdown to add</p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Check className="w-4 h-4" />}
              {saving ? "Saving…" : mode === "create" ? "Create Subject" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SubjectsPage = () => {
  const [subjects,     setSubjects]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("All");
  const [modal,        setModal]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [toasts,       setToasts]       = useState([]);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const toast = (message, type = "success") => {
    const id = ++_toastId;                                          // always unique
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)              params.search = search;
      if (filterType !== "All") params.type  = filterType;

      const { data } = await api.get("/subjects", { params });
      setSubjects(data.subjects || []);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to load subjects", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  // ── Create / Update ────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    try {
      setSaving(true);
      if (modal.mode === "create") {
        const { data } = await api.post("/subjects", form);
        setSubjects((prev) => [data.subject, ...prev]);
        toast("Subject created successfully");
      } else {
        const { data } = await api.put(`/subjects/${modal.subject._id}`, form);
        setSubjects((prev) =>
          prev.map((s) => (s._id === data.subject._id ? data.subject : s))
        );
        toast("Subject updated successfully");
      }
      setModal(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to save subject", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/subjects/${deleteTarget._id}`);
      setSubjects((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      toast("Subject deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to delete subject", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:    subjects.length,
    core:     subjects.filter((s) => s.type === "Core").length,
    elective: subjects.filter((s) => s.type === "Elective").length,
    language: subjects.filter((s) => s.type === "Language").length,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage curriculum subjects and class assignments</p>
          </div>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ── Stats Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Subjects", value: stats.total,    icon: BookOpen, color: "blue"   },
            { label: "Core",           value: stats.core,     icon: Layers,   color: "indigo" },
            { label: "Elective",       value: stats.elective, icon: Tag,      color: "purple" },
            { label: "Language",       value: stats.language, icon: Hash,     color: "green"  },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects by name or code…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
            />
          </div>
          <div className="relative">
            <select
              value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer"
            >
              <option value="All">All Types</option>
              {SUBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No subjects yet</h3>
            <p className="text-gray-500 text-sm mb-6">Add your first subject to get started building the curriculum.</p>
            <button
              onClick={() => setModal({ mode: "create" })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Subject","Code","Type","Classes","Marks","Actions"].map((h) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === "Actions" ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{subject.name}</p>
                            {subject.description && (
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{subject.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{subject.code}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[subject.type] || "bg-gray-100 text-gray-600"}`}>
                          {subject.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {subject.assignedClasses.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">None</span>
                          ) : (
                            <>
                              {subject.assignedClasses.slice(0, 3).map((c) => (
                                <span key={c.className} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                                  {c.className}
                                </span>
                              ))}
                              {subject.assignedClasses.length > 3 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
                                  +{subject.assignedClasses.length - 3}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-600">
                          <span className="font-medium text-gray-900">{subject.maxMarks}</span>
                          {" / pass "}
                          <span className="font-medium text-gray-900">{subject.passMarks}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ mode: "edit", subject })}
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition" title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(subject)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition" title="Delete"
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

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {subjects.map((subject) => (
                <div key={subject._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{subject.name}</p>
                        <p className="text-xs font-mono text-gray-500">{subject.code}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[subject.type] || "bg-gray-100 text-gray-600"}`}>
                      {subject.type}
                    </span>
                  </div>
                  {subject.assignedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {subject.assignedClasses.map((c) => (
                        <span key={c.className} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs">
                          {c.className}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Max: <strong>{subject.maxMarks}</strong> · Pass: <strong>{subject.passMarks}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ mode: "edit", subject })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(subject)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {modal && (
        <SubjectFormModal
          mode={modal.mode}
          initial={
            modal.mode === "edit"
              ? {
                  name:             modal.subject.name,
                  code:             modal.subject.code,
                  description:      modal.subject.description || "",
                  type:             modal.subject.type,
                  maxMarks:         modal.subject.maxMarks,
                  passMarks:        modal.subject.passMarks,
                  assignedClasses:  modal.subject.assignedClasses || [],
                }
              : EMPTY_FORM
          }
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          subject={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default SubjectsPage;