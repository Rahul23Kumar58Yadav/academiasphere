// src/pages/school-admin/curriculum/CurriculumBuilder.jsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXES vs original:
//  1. Uses authFetch (from useAuth) for ALL API calls — no raw axios → no 401
//  2. All API helper functions accept authFetch as parameter
//  3. Curriculum endpoint correctly hits /curriculums (registered in routes)
//  4. SelectorScreen receives authFetch as prop so classes/subjects load correctly
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Image,
  Link,
  CheckCircle,
  Clock,
  Users,
  Target,
  Award,
  Search,
  Grid,
  List,
  Share2,
  RefreshCw,
  Layers,
  Brain,
  BookMarked,
  Music,
  X,
  AlertTriangle,
  Check,
  GripVertical,
  Loader2,
  Hash,
  Globe,
  FolderOpen,
  Eye,
  Filter,
  Zap,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// ── Constants ─────────────────────────────────────────────────────────────────
const LESSON_TYPES = [
  { value: "lecture", label: "Lecture", icon: BookOpen, color: "#6366f1" },
  { value: "practical", label: "Practical", icon: Brain, color: "#10b981" },
  {
    value: "assessment",
    label: "Assessment",
    icon: CheckCircle,
    color: "#f59e0b",
  },
  { value: "discussion", label: "Discussion", icon: Users, color: "#0ea5e9" },
  { value: "project", label: "Project", icon: Layers, color: "#8b5cf6" },
];

const RESOURCE_TYPES = [
  { value: "document", label: "Document", icon: FileText, color: "#6366f1" },
  { value: "video", label: "Video", icon: Video, color: "#ef4444" },
  { value: "image", label: "Image", icon: Image, color: "#10b981" },
  { value: "link", label: "Link", icon: Link, color: "#0ea5e9" },
  { value: "audio", label: "Audio", icon: Music, color: "#f59e0b" },
];

const STATUS_META = {
  "not-started": { label: "Not Started", color: "#94a3b8", bg: "#f1f5f9" },
  scheduled: { label: "Scheduled", color: "#f59e0b", bg: "#fffbeb" },
  "in-progress": { label: "In Progress", color: "#6366f1", bg: "#eef2ff" },
  completed: { label: "Completed", color: "#10b981", bg: "#f0fdf4" },
};

const UNIT_EMPTY = {
  title: "",
  description: "",
  duration: "",
  objectives: [""],
  standards: [""],
  status: "not-started",
};
const LESSON_EMPTY = {
  title: "",
  type: "lecture",
  duration: 45,
  description: "",
  objectives: [""],
  activities: [""],
  assessment: "",
  homework: "",
};
const RESOURCE_EMPTY = { type: "document", name: "", url: "", size: "" };

// ── Pure helpers ──────────────────────────────────────────────────────────────
const lessonTypeData = (type) =>
  LESSON_TYPES.find((t) => t.value === type) ?? LESSON_TYPES[0];
const resourceTypeData = (type) =>
  RESOURCE_TYPES.find((t) => t.value === type) ?? RESOURCE_TYPES[0];

// ── API helpers — all use authFetch, return parsed JSON ───────────────────────
const apiCall = async (authFetch, method, path, body) => {
  const res = await authFetch(path, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res) throw new Error("Session expired — please log in again.");
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const curriculumApi = {
    list:     (af, grade, subject) => apiCall(af, "GET", 
    `/curriculums?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&_=${Date.now()}`),
  listById: (af, subjectId)      => apiCall(af, "GET", 
    `/curriculums?subjectId=${encodeURIComponent(subjectId)}&limit=10&_=${Date.now()}`),
  create: (af, payload) => apiCall(af, "POST", "/curriculums", payload),
  update: (af, id, payload) =>
    apiCall(af, "PUT", `/curriculums/${id}`, payload),
  delete: (af, id) => apiCall(af, "DELETE", `/curriculums/${id}`),
  addUnit: (af, id, p) => apiCall(af, "POST", `/curriculums/${id}/units`, p),
  updateUnit: (af, id, uid, p) =>
    apiCall(af, "PUT", `/curriculums/${id}/units/${uid}`, p),
  deleteUnit: (af, id, uid) =>
    apiCall(af, "DELETE", `/curriculums/${id}/units/${uid}`),
  addLesson: (af, id, uid, p) =>
    apiCall(af, "POST", `/curriculums/${id}/units/${uid}/lessons`, p),
  updateLesson: (af, id, uid, lid, p) =>
    apiCall(af, "PUT", `/curriculums/${id}/units/${uid}/lessons/${lid}`, p),
  deleteLesson: (af, id, uid, lid) =>
    apiCall(af, "DELETE", `/curriculums/${id}/units/${uid}/lessons/${lid}`),
  addResource: (af, id, uid, lid, p) =>
    apiCall(
      af,
      "POST",
      `/curriculums/${id}/units/${uid}/lessons/${lid}/resources`,
      p,
    ),
  deleteResource: (af, id, uid, lid, rid) =>
    apiCall(
      af,
      "DELETE",
      `/curriculums/${id}/units/${uid}/lessons/${lid}/resources/${rid}`,
    ),
};

// ── Toast ─────────────────────────────────────────────────────────────────────
let _tid = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3600);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold"
          style={{
            background: t.type === "success" ? "#10b981" : "#ef4444",
            color: "#fff",
            animation: "fi .25s ease",
          }}
        >
          {t.type === "success" ? (
            <Check size={15} />
          ) : (
            <AlertTriangle size={15} />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex gap-3 items-start mb-4">
          <AlertTriangle
            size={22}
            className="text-red-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-slate-700 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm text-white bg-red-500 hover:bg-red-600 font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,35,.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[92vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inp =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50";

function DynList({ label, items, onChange }) {
  const update = (i, v) => {
    const n = [...items];
    n[i] = v;
    onChange(n);
  };
  const add = () => onChange([...items, ""]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              className={inp + " flex-1"}
              placeholder={`${label} ${i + 1}`}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
        >
          <Plus size={12} /> Add {label}
        </button>
      </div>
    </div>
  );
}

// ── Unit Form Modal ───────────────────────────────────────────────────────────
function UnitFormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ?? UNIT_EMPTY);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={initial?._id ? "Edit Unit" : "Add Unit"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-4"
      >
        <Field label="Unit Title" required>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inp}
            placeholder="e.g. Introduction to Algebra"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={inp + " resize-none"}
            placeholder="Brief overview…"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duration">
            <input
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              className={inp}
              placeholder="e.g. 4 weeks"
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={inp + " bg-white"}
            >
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <DynList
          label="Objectives"
          items={form.objectives?.length ? form.objectives : [""]}
          onChange={(v) => set("objectives", v)}
        />
        <DynList
          label="Standards"
          items={form.standards?.length ? form.standards : [""]}
          onChange={(v) => set("standards", v)}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {initial?._id ? "Save Changes" : "Add Unit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Lesson Form Modal ─────────────────────────────────────────────────────────
function LessonFormModal({ unitTitle, initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ?? LESSON_EMPTY);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={initial?._id ? "Edit Lesson" : `Add Lesson → ${unitTitle}`}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-4"
      >
        <Field label="Lesson Title" required>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inp}
            placeholder="e.g. Variables and Expressions"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={inp + " bg-white"}
            >
              {LESSON_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (min)">
            <input
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => set("duration", Number(e.target.value))}
              className={inp}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={inp + " resize-none"}
            placeholder="What will students learn?"
          />
        </Field>
        <DynList
          label="Objectives"
          items={form.objectives?.length ? form.objectives : [""]}
          onChange={(v) => set("objectives", v)}
        />
        <DynList
          label="Activities"
          items={form.activities?.length ? form.activities : [""]}
          onChange={(v) => set("activities", v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Assessment">
            <input
              value={form.assessment}
              onChange={(e) => set("assessment", e.target.value)}
              className={inp}
              placeholder="e.g. Quiz on expressions"
            />
          </Field>
          <Field label="Homework">
            <input
              value={form.homework}
              onChange={(e) => set("homework", e.target.value)}
              className={inp}
              placeholder="e.g. Pages 12-15"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {initial?._id ? "Save Changes" : "Add Lesson"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Resource Form Modal ───────────────────────────────────────────────────────
function ResourceFormModal({ onSave, onClose, saving }) {
  const [form, setForm] = useState(RESOURCE_EMPTY);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <Modal title="Add Resource" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-4"
      >
        <Field label="Type">
          <div className="flex gap-2 flex-wrap">
            {RESOURCE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("type", t.value)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                style={
                  form.type === t.value
                    ? {
                        background: t.color + "18",
                        borderColor: t.color,
                        color: t.color,
                      }
                    : { borderColor: "#e2e8f0", color: "#64748b" }
                }
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Name" required>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inp}
            placeholder="Resource name"
          />
        </Field>
        {["link", "video"].includes(form.type) && (
          <Field label="URL">
            <input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              className={inp}
              placeholder="https://…"
            />
          </Field>
        )}
        <Field label="Size">
          <input
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
            className={inp}
            placeholder="e.g. 2.4 MB (optional)"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Add Resource
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Lesson Detail Panel ───────────────────────────────────────────────────────
function LessonDetailPanel({
  lesson,
  unit,
  curriculumId,
  onClose,
  onEdit,
  onDelete,
  onResourceAdded,
  onResourceDeleted,
  toast,
  authFetch,
}) {
  const [addingResource, setAddingResource] = useState(false);
  const [savingRes, setSavingRes] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const handleAddResource = async (resForm) => {
    setSavingRes(true);
    try {
      const data = await curriculumApi.addResource(
        authFetch,
        curriculumId,
        unit._id,
        lesson._id,
        resForm,
      );
      onResourceAdded(data.lesson ?? data);
      setAddingResource(false);
      toast("Resource added");
    } catch (e) {
      toast(e.message ?? "Failed to add resource", "error");
    } finally {
      setSavingRes(false);
    }
  };

  const handleDeleteResource = async (rid) => {
    try {
      const data = await curriculumApi.deleteResource(
        authFetch,
        curriculumId,
        unit._id,
        lesson._id,
        rid,
      );
      onResourceDeleted(data.lesson ?? data);
      toast("Resource removed");
    } catch (e) {
      toast(e.message ?? "Failed", "error");
    }
  };

  const lt = lessonTypeData(lesson.type);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 flex-shrink-0 flex items-start justify-between gap-3"
          style={{
            background: lt.color + "14",
            borderBottom: `2px solid ${lt.color}30`,
          }}
        >
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: lt.color + "22" }}
            >
              <lt.icon size={18} style={{ color: lt.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: lt.color + "22", color: lt.color }}
                >
                  {lt.label}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={11} /> {lesson.duration} min
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 leading-snug">
                {lesson.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() =>
                setConfirm({
                  msg: `Delete lesson "${lesson.title}"?`,
                  fn: onDelete,
                })
              }
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 ml-1"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {lesson.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {lesson.description}
            </p>
          )}

          {lesson.objectives?.filter(Boolean).length > 0 && (
            <PanelSection
              label="Learning Objectives"
              icon={Target}
              color="#6366f1"
            >
              <ul className="space-y-1.5">
                {lesson.objectives.filter(Boolean).map((obj, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle
                      size={14}
                      className="text-indigo-400 mt-0.5 flex-shrink-0"
                    />
                    {obj}
                  </li>
                ))}
              </ul>
            </PanelSection>
          )}

          {lesson.activities?.filter(Boolean).length > 0 && (
            <PanelSection label="Activities" icon={Zap} color="#f59e0b">
              <ul className="space-y-1.5">
                {lesson.activities.filter(Boolean).map((act, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="w-4 h-4 rounded bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {act}
                  </li>
                ))}
              </ul>
            </PanelSection>
          )}

          {(lesson.assessment || lesson.homework) && (
            <div className="grid grid-cols-2 gap-3">
              {lesson.assessment && (
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-indigo-600 mb-1 uppercase">
                    Assessment
                  </p>
                  <p className="text-xs text-slate-600">{lesson.assessment}</p>
                </div>
              )}
              {lesson.homework && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 mb-1 uppercase">
                    Homework
                  </p>
                  <p className="text-xs text-slate-600">{lesson.homework}</p>
                </div>
              )}
            </div>
          )}

          <PanelSection
            label={`Resources (${lesson.resources?.length ?? 0})`}
            icon={FolderOpen}
            color="#10b981"
            action={
              <button
                onClick={() => setAddingResource(true)}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                <Plus size={12} /> Add
              </button>
            }
          >
            {!lesson.resources?.length ? (
              <p className="text-xs text-slate-400 italic">No resources yet</p>
            ) : (
              <div className="space-y-2">
                {lesson.resources.map((r) => {
                  const rt = resourceTypeData(r.type);
                  return (
                    <div
                      key={r._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: rt.color + "18" }}
                      >
                        <rt.icon size={13} style={{ color: rt.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {r.name}
                        </p>
                        {r.size && (
                          <p className="text-[10px] text-slate-400">{r.size}</p>
                        )}
                      </div>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:bg-slate-100 rounded text-slate-400"
                        >
                          <Globe size={12} />
                        </a>
                      )}
                      <button
                        onClick={() =>
                          setConfirm({
                            msg: `Remove resource "${r.name}"?`,
                            fn: () => handleDeleteResource(r._id),
                          })
                        }
                        className="p-1 rounded hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </PanelSection>
        </div>
      </div>

      {addingResource && (
        <ResourceFormModal
          onSave={handleAddResource}
          onClose={() => setAddingResource(false)}
          saving={savingRes}
        />
      )}
      {confirm && (
        <Confirm
          message={confirm.msg}
          onConfirm={() => {
            confirm.fn();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

function PanelSection({ label, icon: Icon, color, action, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          <Icon size={12} style={{ color }} />
          {label}
        </h4>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Lesson Card ───────────────────────────────────────────────────────────────
function LessonCard({ lesson, index, onEdit, onDelete, onView }) {
  const lt = lessonTypeData(lesson.type);
  return (
    <div
      className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all group cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: lt.color + "18" }}
        >
          <lt.icon size={16} style={{ color: lt.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] text-slate-400 font-medium">
              #{index + 1}
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: lt.color + "18", color: lt.color }}
            >
              {lt.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {lesson.title}
          </p>
          {lesson.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {lesson.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={10} /> {lesson.duration} min
            </span>
            {lesson.resources?.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText size={10} /> {lesson.resources.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Unit Card ─────────────────────────────────────────────────────────────────
function UnitCard({
  unit,
  index,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onViewLesson,
}) {
  const sm = STATUS_META[unit.status] ?? STATUS_META["not-started"];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div
        className="px-6 py-5 flex items-start gap-4 cursor-pointer select-none"
        onClick={onToggle}
        style={{
          background: "linear-gradient(135deg,#6366f108,#8b5cf608)",
          borderBottom: isExpanded ? "1px solid #f1f5f9" : "none",
        }}
      >
        <div className="flex-shrink-0 mt-0.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            {index + 1}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-bold text-slate-800 truncate">
              {unit.title}
            </h3>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: sm.bg, color: sm.color }}
            >
              {sm.label}
            </span>
          </div>
          {unit.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mb-2">
              {unit.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
            {unit.duration && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> {unit.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookMarked size={10} /> {unit.lessons?.length ?? 0} lessons
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-400"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
          >
            <Trash2 size={14} />
          </button>
          <div className="w-6 h-6 flex items-center justify-center text-slate-400 ml-1">
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 py-5 space-y-4">
          {unit.objectives?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Target size={11} className="text-indigo-400" /> Objectives
              </p>
              <div className="flex flex-wrap gap-2">
                {unit.objectives.filter(Boolean).map((obj, i) => (
                  <span
                    key={i}
                    className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <BookMarked size={12} className="text-orange-500" /> Lessons (
                {unit.lessons?.length ?? 0})
              </h4>
              <button
                onClick={onAddLesson}
                className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-indigo-50"
              >
                <Plus size={12} /> Add Lesson
              </button>
            </div>
            {!unit.lessons?.length ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <BookOpen size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">No lessons added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unit.lessons.map((lesson, i) => (
                  <LessonCard
                    key={lesson._id || i}
                    lesson={lesson}
                    index={i}
                    onEdit={() => onEditLesson(lesson)}
                    onDelete={() => onDeleteLesson(lesson)}
                    onView={() => onViewLesson(lesson)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Selector screen ───────────────────────────────────────────────────────────
function SelectorScreen({ authFetch, onLoad }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [classError, setClassError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/classes?isArchived=false&limit=200");
        if (!res) throw new Error("Not authenticated");
        const json = await res.json();
        setClasses(json.classes ?? json.data ?? []);
      } catch (e) {
        setClassError("Could not load classes: " + e.message);
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, [authFetch]);

  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setSelectedSubject(null);
      return;
    }
    setLoadingSubjects(true);
    setSelectedSubject(null);
    (async () => {
      try {
        const res = await authFetch(
          `/subjects?classId=${selectedClass._id}&limit=200`,
        );
        if (!res) {
          setSubjects([]);
          return;
        }
        const json = await res.json();
        setSubjects(json.subjects ?? json.data ?? []);
      } catch {
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, [selectedClass, authFetch]);

  const canLoad = selectedClass && selectedSubject;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-10 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          <BookOpen size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 mb-1">
          Curriculum Builder
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Design curriculum plans for each class and subject
        </p>

        <div className="space-y-4 text-left">
          {/* Class */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Class <span className="text-red-500">*</span>
            </label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Loading classes…
              </div>
            ) : classError ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-red-200 rounded-xl text-sm text-red-500 bg-red-50">
                <AlertTriangle size={14} /> {classError}
              </div>
            ) : (
              <select
                value={selectedClass?._id ?? ""}
                onChange={(e) =>
                  setSelectedClass(
                    classes.find((c) => c._id === e.target.value) ?? null,
                  )
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              >
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.displayName || `${c.name} - ${c.section}`}
                    {c.academicYear ? ` (${c.academicYear})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            {loadingSubjects ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Loading subjects…
              </div>
            ) : (
              <select
                value={selectedSubject?._id ?? ""}
                onChange={(e) =>
                  setSelectedSubject(
                    subjects.find((s) => s._id === e.target.value) ?? null,
                  )
                }
                disabled={!selectedClass || subjects.length === 0}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:opacity-50"
              >
                <option value="">
                  {!selectedClass
                    ? "Select a class first…"
                    : subjects.length === 0
                      ? "No subjects assigned to this class"
                      : "Select subject…"}
                </option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.code ? ` (${s.code})` : ""}
                    {s.type ? ` · ${s.type}` : ""}
                  </option>
                ))}
              </select>
            )}
            {selectedClass && !loadingSubjects && subjects.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} /> Go to <strong>Subjects</strong> and
                assign this class first.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => canLoad && onLoad(selectedClass, selectedSubject)}
          disabled={!canLoad}
          className="mt-6 w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          <BookOpen size={15} /> Load Curriculum
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function CurriculumBuilder() {
  const { authFetch } = useAuth(); // ← cookie auth, same as every other page
  const { toasts, push: toast } = useToast();

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("tree");
  const [expandedUnits, setExpandedUnits] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [unitModal, setUnitModal] = useState(null);
  const [lessonModal, setLessonModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  const classLabel = selectedClass
    ? selectedClass.displayName ||
      `${selectedClass.name} - ${selectedClass.section}`
    : "";
  const subjectLabel = selectedSubject?.name ?? "";

  // ── Load curriculum ────────────────────────────────────────────────────────
  const loadCurriculum = useCallback(
    async (cls, sub) => {
      setLoading(true);
      try {
        // Try by subjectId first (accurate), fallback to grade+subject name
        let cur = null;
        if (sub._id) {
          try {
            const data = await curriculumApi.listById(authFetch, sub._id);
            cur = Array.isArray(data.curriculums)
              ? (data.curriculums[0] ?? null)
              : (data.curriculum ?? null);
          } catch {
            cur = null;
          }
        }

        if (!cur) {
          const grade = cls.displayName || `${cls.name} - ${cls.section}`;
          const data = await curriculumApi.list(authFetch, grade, sub.name);
          cur = Array.isArray(data.curriculums)
            ? (data.curriculums[0] ?? null)
            : (data.curriculum ?? null);
        }

        setCurriculum(cur);
        if (cur?.units?.length) {
          setExpandedUnits(new Set([cur.units[0]._id]));
        }
      } catch (e) {
        toast(e.message ?? "Failed to load curriculum", "error");
        setCurriculum(null);
      } finally {
        setLoading(false);
      }
    },
    [authFetch, toast],
  );

  const handleSelect = (cls, sub) => {
    setSelectedClass(cls);
    setSelectedSubject(sub);
    loadCurriculum(cls, sub);
  };

  const refresh = () => {
    if (selectedClass && selectedSubject)
      loadCurriculum(selectedClass, selectedSubject);
  };

  const toggleUnit = (uid) => {
    setExpandedUnits((prev) => {
      const n = new Set(prev);
      n.has(uid) ? n.delete(uid) : n.add(uid);
      return n;
    });
  };

  // ── Unit CRUD ──────────────────────────────────────────────────────────────
  const handleSaveUnit = async (form) => {
    setSaving(true);
    try {
      if (!curriculum?._id) {
        // Create the curriculum first
        const data = await curriculumApi.create(authFetch, {
          grade: classLabel,
          subject: subjectLabel,
          classId: selectedClass._id,
          subjectId: selectedSubject._id,
          academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`, // ← CORRECT
        });
        setCurriculum(data.curriculum);
        await curriculumApi.addUnit(authFetch, data.curriculum._id, form);
      } else if (unitModal.unit) {
        await curriculumApi.updateUnit(
          authFetch,
          curriculum._id,
          unitModal.unit._id,
          form,
        );
      } else {
        await curriculumApi.addUnit(authFetch, curriculum._id, form);
      }
      setUnitModal(null);
      await refresh();
      toast(unitModal?.unit ? "Unit updated" : "Unit added");
    } catch (e) {
      toast(e.message ?? "Failed to save unit", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (uid) => {
    try {
      await curriculumApi.deleteUnit(authFetch, curriculum._id, uid);
      await refresh();
      toast("Unit deleted");
    } catch (e) {
      toast(e.message ?? "Failed", "error");
    }
  };

  // ── Lesson CRUD ────────────────────────────────────────────────────────────
  const handleSaveLesson = async (form) => {
    setSaving(true);
    try {
      const { unit, lesson } = lessonModal;
      if (lesson) {
        await curriculumApi.updateLesson(
          authFetch,
          curriculum._id,
          unit._id,
          lesson._id,
          form,
        );
        toast("Lesson updated");
      } else {
        await curriculumApi.addLesson(
          authFetch,
          curriculum._id,
          unit._id,
          form,
        );
        toast("Lesson added");
      }
      setLessonModal(null);
      setActiveLesson(null);
      await refresh();
    } catch (e) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (unit, lesson) => {
    try {
      await curriculumApi.deleteLesson(
        authFetch,
        curriculum._id,
        unit._id,
        lesson._id,
      );
      setActiveLesson(null);
      await refresh();
      toast("Lesson deleted");
    } catch (e) {
      toast(e.message ?? "Failed", "error");
    }
  };

  // ── Publish ────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!curriculum?._id) return;
    setSaving(true);
    try {
      await curriculumApi.update(authFetch, curriculum._id, {
        status: "published",
      });
      await refresh();
      toast("Curriculum published!");
    } catch (e) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const totalLessons =
    curriculum?.units?.reduce((s, u) => s + (u.lessons?.length ?? 0), 0) ?? 0;
  const progressPct =
    totalLessons > 0
      ? Math.round(((curriculum?.completedLessons ?? 0) / totalLessons) * 100)
      : 0;

  const filteredUnits = (curriculum?.units ?? []).filter(
    (u) =>
      !searchTerm ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lessons?.some((l) =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  // ── Selector screen ────────────────────────────────────────────────────────
  if (!selectedClass || !selectedSubject) {
    return (
      <>
        <SelectorScreen authFetch={authFetch} onLoad={handleSelect} />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2
            size={36}
            className="text-indigo-500 animate-spin mx-auto mb-3"
          />
          <p className="text-slate-400 text-sm">Loading curriculum…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.fi{animation:fi .25s ease both}`}</style>

      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              <BookOpen size={17} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-slate-800 leading-tight truncate">
                {subjectLabel}
              </h1>
              <p className="text-xs text-slate-400">
                {classLabel} · Curriculum Builder
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs">
            <Pill
              icon={Layers}
              label={`${filteredUnits.length} units`}
              color="#6366f1"
            />
            <Pill
              icon={BookMarked}
              label={`${totalLessons} lessons`}
              color="#8b5cf6"
            />
            <Pill icon={Hash} label={`${progressPct}% done`} color="#10b981" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUnitModal({ mode: "create" })}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              <Plus size={14} /> Add Unit
            </button>
            <button
              onClick={handlePublish}
              disabled={saving || !curriculum}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Share2 size={13} />
              )}
              Publish
            </button>
            <button
              onClick={() => {
                setSelectedClass(null);
                setSelectedSubject(null);
                setCurriculum(null);
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500"
              title="Change subject"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Search + view toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search units or lessons…"
              className="pl-9 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white"
            />
          </div>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
            {[
              { mode: "tree", icon: List },
              { mode: "grid", icon: Grid },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="p-2.5 transition-colors"
                style={
                  viewMode === mode
                    ? { background: "#6366f1", color: "#fff" }
                    : { color: "#94a3b8" }
                }
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredUnits.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#eef2ff,#f5f3ff)" }}
            >
              <BookOpen size={24} className="text-indigo-400" />
            </div>
            <p className="text-slate-600 font-semibold mb-1">No units yet</p>
            <p className="text-slate-400 text-sm mb-5">
              {searchTerm
                ? "No results match your search."
                : "Start building your curriculum by adding a unit."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setUnitModal({ mode: "create" })}
                className="px-5 py-2.5 text-sm font-bold text-white rounded-xl"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                }}
              >
                <Plus size={14} className="inline mr-1.5" /> Add First Unit
              </button>
            )}
          </div>
        )}

        {/* Tree view */}
        {viewMode === "tree" && filteredUnits.length > 0 && (
          <div className="space-y-4 fi">
            {filteredUnits.map((unit, i) => (
              <UnitCard
                key={unit._id ?? i}
                unit={unit}
                index={i}
                isExpanded={expandedUnits.has(unit._id)}
                onToggle={() => toggleUnit(unit._id)}
                onEdit={() => setUnitModal({ mode: "edit", unit })}
                onDelete={() =>
                  setConfirm({
                    msg: `Delete unit "${unit.title}" and all its lessons?`,
                    fn: () => handleDeleteUnit(unit._id),
                  })
                }
                onAddLesson={() => setLessonModal({ mode: "create", unit })}
                onEditLesson={(lesson) =>
                  setLessonModal({ mode: "edit", unit, lesson })
                }
                onDeleteLesson={(lesson) =>
                  setConfirm({
                    msg: `Delete lesson "${lesson.title}"?`,
                    fn: () => handleDeleteLesson(unit, lesson),
                  })
                }
                onViewLesson={(lesson) => setActiveLesson({ lesson, unit })}
              />
            ))}
          </div>
        )}

        {/* Grid view */}
        {viewMode === "grid" && filteredUnits.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fi">
            {filteredUnits.map((unit, i) => {
              const sm = STATUS_META[unit.status] ?? STATUS_META["not-started"];
              return (
                <div
                  key={unit._id ?? i}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                  style={{ borderTop: `3px solid ${sm.color}` }}
                  onClick={() => {
                    setViewMode("tree");
                    setExpandedUnits((p) => new Set([...p, unit._id]));
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-8 h-8 rounded-xl text-white text-sm font-bold flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnitModal({ mode: "edit", unit });
                          }}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-400"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirm({
                              msg: `Delete unit "${unit.title}"?`,
                              fn: () => handleDeleteUnit(unit._id),
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">
                      {unit.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {unit.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <BookMarked size={10} /> {unit.lessons?.length ?? 0}{" "}
                        lessons
                      </span>
                      {unit.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {unit.duration}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: sm.bg, color: sm.color }}
                    >
                      {sm.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {unitModal && (
        <UnitFormModal
          initial={unitModal.unit}
          onSave={handleSaveUnit}
          onClose={() => setUnitModal(null)}
          saving={saving}
        />
      )}
      {lessonModal && (
        <LessonFormModal
          unitTitle={lessonModal.unit.title}
          initial={lessonModal.lesson}
          onSave={handleSaveLesson}
          onClose={() => setLessonModal(null)}
          saving={saving}
        />
      )}
      {activeLesson && curriculum && (
        <LessonDetailPanel
          lesson={activeLesson.lesson}
          unit={activeLesson.unit}
          curriculumId={curriculum._id}
          authFetch={authFetch}
          onClose={() => setActiveLesson(null)}
          onEdit={() =>
            setLessonModal({
              mode: "edit",
              unit: activeLesson.unit,
              lesson: activeLesson.lesson,
            })
          }
          onDelete={() =>
            setConfirm({
              msg: `Delete lesson "${activeLesson.lesson.title}"?`,
              fn: () =>
                handleDeleteLesson(activeLesson.unit, activeLesson.lesson),
            })
          }
          onResourceAdded={(updatedLesson) => {
            setActiveLesson((p) => ({ ...p, lesson: updatedLesson }));
            refresh();
          }}
          onResourceDeleted={(updatedLesson) => {
            setActiveLesson((p) => ({ ...p, lesson: updatedLesson }));
            refresh();
          }}
          toast={toast}
        />
      )}
      {confirm && (
        <Confirm
          message={confirm.msg}
          onConfirm={() => {
            confirm.fn();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      <ToastStack toasts={toasts} />
    </div>
  );
}

function Pill({ icon: Icon, label, color }) {
  return (
    <span
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: color + "15", color }}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}
