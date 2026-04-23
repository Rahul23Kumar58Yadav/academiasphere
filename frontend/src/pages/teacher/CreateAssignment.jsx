// src/pages/teacher/assignments/TeacherAssignments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X, Filter, Clock, Users, TrendingUp,
  FileText, CheckCircle2, AlertCircle, Archive, Edit2,
  Trash2, Send, Eye, MoreVertical, ChevronDown, Loader2,
  BookOpen, GraduationCap, User, Link as LinkIcon,
  CheckCircle, Upload, Tag, Save, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { assignmentAPI, schoolAPI } from '../../services/assignment';
import {
  getDifficultyColor,
  getDaysRemaining,
  getCompletionPercentage,
  MOCK_ASSIGNMENTS,
} from '../../shared/assignmentSchema';

const ASSIGNMENT_TYPES = [
  { value: 'homework',     label: 'Homework',     icon: '📝' },
  { value: 'project',      label: 'Project',      icon: '🎯' },
  { value: 'quiz',         label: 'Quiz',         icon: '📋' },
  { value: 'lab',          label: 'Lab Work',     icon: '🔬' },
  { value: 'presentation', label: 'Presentation', icon: '📊' },
  { value: 'essay',        label: 'Essay',        icon: '✍️' },
];
const SUBMISSION_TYPES = [
  { value: 'file', label: 'File Upload' },
  { value: 'text', label: 'Text Entry' },
  { value: 'link', label: 'Link / URL' },
  { value: 'both', label: 'File + Text' },
];
const PRI_STYLES = {
  urgent: { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  high:   { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  normal: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  low:    { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
};
const STAT_STYLES = {
  published: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Published' },
  draft:     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Draft'     },
  closed:    { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Closed'    },
};
const TYPE_ICONS = {
  homework:'📝', project:'🎯', quiz:'📋',
  lab:'🔬', presentation:'📊', essay:'✍️', other:'📌',
};
const EMPTY = {
  title:'', subject:'', class:'', section:[],
  description:'', instructions:'', dueDate:'', dueTime:'23:59',
  totalMarks:100, passingMarks:40, assignmentType:'homework',
  submissionType:'file', allowLateSubmission:false, latePenalty:10,
  rubric:[], attachments:[], tags:[], priority:'normal',
  estimatedTime:60, difficulty:'medium', learningObjectives:[],
  resources:[], notifyStudents:true, notifyParents:false,
};

// ═════════════════════════════════════════════════════════════════════════════
export default function TeacherAssignments() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // list
  const [list,        setList]        = useState([]);
  const [stats,       setStats]       = useState({ total:0, published:0, drafts:0, overdue:0 });
  const [listLoading, setListLoading] = useState(true);
  const [menuId,      setMenuId]      = useState(null);

  // filters
  const [search,    setSearch]    = useState('');
  const [fStatus,   setFStatus]   = useState('all');
  const [fSubject,  setFSubject]  = useState('all');
  const [fPriority, setFPriority] = useState('all');
  const [showF,     setShowF]     = useState(false);

  // drawer
  const [open,    setOpen]    = useState(false);
  const [mode,    setMode]    = useState('create');
  const [editId,  setEditId]  = useState(null);
  const [tab,     setTab]     = useState('basic');

  // dynamic options
  const [subjects,  setSubjects]  = useState([]);
  const [classes,   setClasses]   = useState([]);
  const [sections,  setSections]  = useState([]);
  const [optsLoad,  setOptsLoad]  = useState(false);

  // form
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  // temp inputs
  const [tag,   setTag]   = useState('');
  const [obj,   setObj]   = useState('');
  const [res,   setRes]   = useState({ title:'', url:'' });
  const [rub,   setRub]   = useState({ criteria:'', points:'', description:'' });

  // ── fetch list ─────────────────────────────────────────────────────────────
const fetchList = useCallback(async () => {
  setListLoading(true);
  try {
    const [aR, sR] = await Promise.all([
      assignmentAPI.getAll(),
      assignmentAPI.stats(),
    ]);
    // Guard: ensure we always set an array
    const assignments = Array.isArray(aR.data?.data) ? aR.data.data
                      : Array.isArray(aR.data)       ? aR.data
                      : [];
    const statsData = sR.data?.data ?? sR.data ?? { total:0, published:0, drafts:0, overdue:0 };
    setList(assignments);
    setStats(statsData);
  } catch {
    setList(MOCK_ASSIGNMENTS);
    setStats({
      total:     MOCK_ASSIGNMENTS.length,
      published: MOCK_ASSIGNMENTS.filter(a => (a.status||'published')==='published').length,
      drafts:    MOCK_ASSIGNMENTS.filter(a => a.status==='draft').length,
      overdue:   MOCK_ASSIGNMENTS.filter(a => getDaysRemaining(a.dueDate)<0).length,
    });
  } finally { setListLoading(false); }
}, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── fetch dynamic dropdown options ────────────────────────────────────────
  const fetchOpts = useCallback(async () => {
    setOptsLoad(true);
    try {
      const [sR, cR] = await Promise.all([
        schoolAPI.getTeacherSubjects(user._id),
        schoolAPI.getSchoolClasses(user.schoolId),
      ]);
      setSubjects(sR.data.data.subjects);
      setClasses(cR.data.data.classes);
      setSections(cR.data.data.sections);
    } catch {
      setSubjects(['Mathematics','Science','English','Hindi','Social Studies','Computer Science']);
      setClasses(['Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']);
      setSections(['A','B','C','D']);
    } finally { setOptsLoad(false); }
  }, [user._id, user.schoolId, token]);

  // ── open / close drawer ────────────────────────────────────────────────────
  const openCreate = () => {
    setMode('create'); setEditId(null); setForm(EMPTY); setTab('basic');
    setOpen(true); fetchOpts();
  };
  const openEdit = (a) => {
    setMode('edit');
    setEditId(a.id ?? a._id);
    setForm({
      title: a.title, subject: a.subject, class: a.class??a.grade,
      section: a.section??a.sections??[], description: a.description??'',
      instructions: a.instructions??'', dueDate: a.dueDate?.slice(0,10)??'',
      dueTime: a.dueTime??'23:59', totalMarks: a.points??a.maxMarks??100,
      passingMarks: a.passingMarks??40, assignmentType: a.assignmentType??a.type??'homework',
      submissionType: a.submissionType??'file', allowLateSubmission: a.allowLateSubmission??false,
      latePenalty: a.latePenalty??10, rubric: a.rubric??[], attachments: a.attachments??[],
      tags: a.tags??[], priority: a.priority??'normal', estimatedTime: a.estimatedTime??60,
      difficulty: a.difficulty??'medium', learningObjectives: a.learningObjectives??[],
      resources: a.resources??[], notifyStudents: a.notifyStudents??true, notifyParents: a.notifyParents??false,
    });
    setTab('basic'); setOpen(true); fetchOpts(); setMenuId(null);
  };

  const fc = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type==='checkbox' ? checked : value }));
  };
  const toggleSec = s => setForm(p => ({
    ...p, section: p.section.includes(s) ? p.section.filter(x=>x!==s) : [...p.section, s],
  }));

  const addTag = () => { const t=tag.trim(); if(t&&!form.tags.includes(t)){setForm(p=>({...p,tags:[...p.tags,t]}));setTag('');} };
  const addObj = () => { if(obj.trim()){setForm(p=>({...p,learningObjectives:[...p.learningObjectives,obj.trim()]}));setObj('');} };
  const addRes = () => { if(res.title&&res.url){setForm(p=>({...p,resources:[...p.resources,{...res,id:Date.now()}]}));setRes({title:'',url:''});} };
  const addRub = () => { if(rub.criteria&&rub.points){setForm(p=>({...p,rubric:[...p.rubric,{criteria:rub.criteria,points:+rub.points,description:rub.description}]}));setRub({criteria:'',points:'',description:''});} };
  const onFiles = e => {
    const files = Array.from(e.target.files).map(f=>({id:Date.now()+Math.random(),name:f.name,size:`${(f.size/1024).toFixed(1)} KB`,type:f.type,url:'#'}));
    setForm(p=>({...p,attachments:[...p.attachments,...files]}));
  };

  const validate = () => {
    if(!form.title.trim())    { toast.error('Enter a title');             setTab('basic');   return false; }
    if(!form.subject)         { toast.error('Select a subject');          setTab('basic');   return false; }
    if(!form.class)           { toast.error('Select a class');            setTab('basic');   return false; }
    if(!form.section.length)  { toast.error('Select at least 1 section'); setTab('basic');   return false; }
    if(!form.dueDate)         { toast.error('Set a due date');            setTab('details'); return false; }
    if(+form.passingMarks>+form.totalMarks){ toast.error('Passing marks > total'); setTab('details'); return false; }
    return true;
  };

  const mkPayload = status => ({
    teacherId:   user._id,
    teacherName: user.name,
    schoolId:    user.schoolId,
    title:       form.title.trim(),
    subject:     form.subject,
    grade:       form.class,
    sections:    form.section,
    description: form.description,
    instructions:form.instructions,
    dueDate:     new Date(`${form.dueDate}T${form.dueTime}:00`).toISOString(),
    maxMarks:    +form.totalMarks, passingMarks:+form.passingMarks,
    assignmentType:form.assignmentType, submissionType:form.submissionType,
    allowLateSubmission:form.allowLateSubmission, latePenalty:+form.latePenalty,
    priority:form.priority, difficulty:form.difficulty, estimatedTime:+form.estimatedTime,
    tags:form.tags, learningObjectives:form.learningObjectives,
    rubric:form.rubric, resources:form.resources,
    attachments:form.attachments.map(a=>({name:a.name,size:a.size,url:a.url})),
    notifyStudents:form.notifyStudents, notifyParents:form.notifyParents,
    status,
  });

  const saveDraft = async () => {
    setSaving(true);
    try {
      if(mode==='edit'){
        const r = await assignmentAPI.update(editId, mkPayload('draft'), token);
        setList(p=>p.map(a=>(a.id??a._id)===editId ? r.data.data : a));
      } else {
        const r = await assignmentAPI.create(mkPayload('draft'));
        setList(p=>[r.data.data,...p]);
        setStats(s=>({...s,total:s.total+1,drafts:s.drafts+1}));
      }
      toast.success('Draft saved'); setOpen(false);
    } catch { toast.error('Failed to save draft'); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    if(!validate()) return;
    setSaving(true);
    try {
      if(mode==='edit'){
        const r = await assignmentAPI.update(editId, mkPayload('draft')) 
        setList(p=>p.map(a=>(a.id??a._id)===editId ? r.data.data : a));
      } else {
        const r = await assignmentAPI.create(mkPayload('published'), token);
        setList(p=>[r.data.data,...p]);
        setStats(s=>({...s,total:s.total+1,published:s.published+1}));
      }
      toast.success(mode==='edit'?'Updated!':'Published!'); setOpen(false);
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const deleteA = async id => {
    if(!window.confirm('Delete this assignment?')) return;
    try {
      await assignmentAPI.remove(id);
      setList(p=>p.filter(a=>(a.id??a._id)!==id));
      setStats(s=>({...s,total:s.total-1}));
      toast.success('Deleted');
    } catch { toast.error('Could not delete'); }
    setMenuId(null);
  };

  const quickPublish = async id => {
    try {
      await assignmentAPI.publish(id);
      setList(p=>p.map(a=>(a.id??a._id)===id?{...a,status:'published'}:a));
      setStats(s=>({...s,drafts:s.drafts-1,published:s.published+1}));
      toast.success('Published!');
    } catch { toast.error('Could not publish'); }
    setMenuId(null);
  };

  const allSubjects = ['all',...new Set(list.map(a=>a.subject))];
  const filtered = list.filter(a=>{
    const q=search.toLowerCase();
    return (!q||a.title.toLowerCase().includes(q)||a.subject.toLowerCase().includes(q))
      &&(fStatus==='all'||(a.status||'published')===fStatus)
      &&(fSubject==='all'||a.subject===fSubject)
      &&(fPriority==='all'||a.priority===fPriority);
  });
  const activeFCount=[fStatus,fSubject,fPriority].filter(f=>f!=='all').length;
  const rubricTotal=form.rubric.reduce((s,r)=>s+r.points,0);
  const today=new Date().toISOString().split('T')[0];

  // pending count badge
  const pendingCount = list.reduce((acc, a) => {
    const subs = typeof a.submissions === 'number' ? a.submissions : (a.submissions?.length ?? 0);
    const graded = typeof a.graded === 'number' ? a.graded : 0;
    return acc + Math.max(0, subs - graded);
  }, 0);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome, <span className="font-semibold text-indigo-600">{user?.name}</span>
              {stats.total > 0 && ` · ${stats.total} assignment${stats.total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center gap-3">

            {/* ★ PENDING ASSIGNMENT button – navigates to PendingReview ★ */}
            <button
              onClick={() => navigate('/teacher/assignments/pending')}
              className="relative flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-amber-400
                         text-amber-600 rounded-xl font-semibold text-sm
                         hover:bg-amber-50 active:scale-95 transition-all"
            >
              <ClipboardList size={17} strokeWidth={2.5} />
              Pending Review
              {/* live badge showing ungraded count */}
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-amber-500 text-white
                                 text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>

            {/* ★ CREATE ASSIGNMENT button – opens the drawer ★ */}
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl
                         font-semibold text-sm hover:bg-indigo-700 active:scale-95
                         transition-all shadow-md shadow-indigo-200"
            >
              <Plus size={18} strokeWidth={2.5} />
              Create Assignment
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {icon:<FileText size={20} className="text-indigo-600"/>,   bg:'bg-indigo-50', label:'Total',     v:stats.total,     sub:'assignments'},
          {icon:<CheckCircle2 size={20} className="text-green-600"/>, bg:'bg-green-50',  label:'Published', v:stats.published, sub:'live'},
          {icon:<Archive size={20} className="text-yellow-600"/>,     bg:'bg-yellow-50', label:'Drafts',    v:stats.drafts,    sub:'unpublished'},
          {icon:<AlertCircle size={20} className="text-red-500"/>,    bg:'bg-red-50',    label:'Overdue',   v:stats.overdue,   sub:'past due'},
        ].map(({icon,bg,label,v,sub})=>(
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{v}</p>
              <p className="text-xs text-gray-500">{label} <span className="text-gray-400">· {sub}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & filters ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search assignments…"
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"/>
            {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14}/></button>}
          </div>
          <button onClick={()=>setShowF(f=>!f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
              showF||activeFCount>0?'bg-indigo-50 border-indigo-300 text-indigo-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={14}/>Filters
            {activeFCount>0&&<span className="px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded-full">{activeFCount}</span>}
          </button>
          <span className="text-sm text-gray-400 ml-auto hidden sm:block">{filtered.length} result{filtered.length!==1?'s':''}</span>
        </div>
        {showF&&(
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              {lbl:'Status',  val:fStatus,   set:setFStatus,  opts:[['all','All Statuses'],['published','Published'],['draft','Draft'],['closed','Closed']]},
              {lbl:'Subject', val:fSubject,  set:setFSubject, opts:allSubjects.map(s=>[s,s==='all'?'All Subjects':s])},
              {lbl:'Priority',val:fPriority, set:setFPriority,opts:[['all','All'],['urgent','Urgent'],['high','High'],['normal','Normal'],['low','Low']]},
            ].map(({lbl,val,set,opts})=>(
              <div key={lbl}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{lbl}</p>
                <div className="relative">
                  <select value={val} onChange={e=>set(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-indigo-400 outline-none pr-7">
                    {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── List ── */}
      {listLoading?(
        <div className="flex items-center justify-center h-48 gap-3 bg-white rounded-xl border border-gray-100">
          <Loader2 className="animate-spin text-indigo-600" size={26}/>
          <p className="text-gray-500 font-medium">Loading…</p>
        </div>
      ):filtered.length===0?(
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={28} className="text-indigo-400"/>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {search||activeFCount>0?'No results':'No assignments yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {search||activeFCount>0?'Try different filters.':'Click the button above to create your first one.'}
          </p>
          {!(search||activeFCount>0)&&(
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700">
              <Plus size={16}/>Create Assignment
            </button>
          )}
        </div>
      ):(
        <div className="space-y-3">
          {filtered.map(a=>{
            const id=(a.id??a._id);
            const status=a.status||'published';
            const days=getDaysRemaining(a.dueDate);
            const subs=typeof a.submissions==='number'?a.submissions:(a.submissions?.length??0);
            const pct=getCompletionPercentage(subs,a.totalStudents||60);
            const pri=PRI_STYLES[a.priority]??PRI_STYLES.normal;
            const st=STAT_STYLES[status]??STAT_STYLES.published;
            const overdue=days<0&&status==='published';
            return(
              <div key={id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                    {TYPE_ICONS[a.assignmentType??a.type]??'📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{a.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {a.subject} · {a.class??a.grade}
                          {(a.section?.length>0||a.sections?.length>0)&&
                            ` · Sec ${(a.section||a.sections).join(', ')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>{st.label}</span>
                        <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${pri.bg} ${pri.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`}/>{a.priority}
                        </span>
                        {/* ⋮ menu */}
                        <div className="relative">
                          <button onClick={()=>setMenuId(p=>p===id?null:id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical size={16} className="text-gray-500"/>
                          </button>
                          {menuId===id&&(
                            <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                              <MI icon={<Edit2 size={14}/>}  label="Edit"    onClick={()=>openEdit(a)}/>
                              {status==='draft'&&<MI icon={<Send size={14}/>} label="Publish" color="text-indigo-600" onClick={()=>quickPublish(id)}/>}
                              {/* View Submissions shortcut */}
                              <MI
                                icon={<ClipboardList size={14}/>}
                                label="View Submissions"
                                color="text-amber-600"
                                onClick={()=>{ navigate('/teacher/assignments/pending'); setMenuId(null); }}
                              />
                              <div className="h-px bg-gray-100 mx-3 my-1"/>
                              <MI icon={<Trash2 size={14}/>} label="Delete"  color="text-red-500" onClick={()=>deleteA(id)}/>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {a.description&&<p className="text-sm text-gray-400 mt-2 line-clamp-1">{a.description}</p>}
                    <div className="flex items-center flex-wrap gap-4 mt-3">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${overdue?'text-red-600':days<=2?'text-orange-500':'text-gray-500'}`}>
                        <Clock size={12}/>
                        {overdue?`Overdue ${Math.abs(days)}d`:days===0?'Due today':`${days}d left`}
                        <span className="font-normal text-gray-400">· {new Date(a.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <TrendingUp size={12}/>{a.points??a.maxMarks} marks
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users size={12}/>{subs} submitted
                      </span>
                      {a.totalStudents>0&&(
                        <div className="flex items-center gap-2 ml-auto">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct>=80?'bg-green-500':pct>=50?'bg-indigo-500':'bg-orange-400'}`}
                              style={{width:`${pct}%`}}/>
                          </div>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {menuId&&<div className="fixed inset-0 z-20" onClick={()=>setMenuId(null)}/>}

      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-OVER DRAWER
      ═══════════════════════════════════════════════════════════════════ */}
      {open&&(
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={()=>setOpen(false)}/>
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {mode==='edit'?'Edit Assignment':'Create Assignment'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <User size={11}/>{user?.name} · {user?.role}
                </p>
              </div>
              <button onClick={()=>setOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500"/>
              </button>
            </div>

            <div className="flex border-b border-gray-100 px-6 bg-gray-50/50 shrink-0">
              {[
                {k:'basic',   l:'Basic Info'},
                {k:'details', l:'Details'},
                {k:'grading', l:'Grading'},
                {k:'files',   l:'Files & Links'},
              ].map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    tab===t.k?'border-indigo-600 text-indigo-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {t.l}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* ── Basic Info ── */}
              {tab==='basic'&&<>
                <FL label="Teacher">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <User size={14} className="text-gray-400"/>
                    <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
                    <span className="ml-auto text-xs text-gray-400 italic">auto from account</span>
                  </div>
                </FL>

                <FL label="Assignment Title" req>
                  <input name="title" value={form.title} onChange={fc}
                    placeholder="e.g., Chapter 5 – Algebraic Expressions"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"/>
                </FL>

                <div className="grid grid-cols-2 gap-4">
                  <FL label="Subject" req>
                    <Sel name="subject" value={form.subject} onChange={fc} loading={optsLoad} icon={<BookOpen size={14}/>}>
                      <option value="">Select Subject</option>
                      {subjects.map(s=><option key={s} value={s}>{s}</option>)}
                    </Sel>
                  </FL>
                  <FL label="Class" req>
                    <Sel name="class" value={form.class} onChange={fc} loading={optsLoad} icon={<GraduationCap size={14}/>}>
                      <option value="">Select Class</option>
                      {classes.map(c=><option key={c} value={c}>{c}</option>)}
                    </Sel>
                  </FL>
                </div>

                <FL label="Sections" req>
                  <div className="flex flex-wrap gap-2">
                    {sections.map(s=>(
                      <button key={s} type="button" onClick={()=>toggleSec(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          form.section.includes(s)?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        Sec {s}
                      </button>
                    ))}
                  </div>
                  {form.section.length>0&&<p className="text-xs text-indigo-600 mt-1.5 font-medium">Selected: {form.section.join(', ')}</p>}
                </FL>

                <FL label="Assignment Type">
                  <div className="grid grid-cols-3 gap-2">
                    {ASSIGNMENT_TYPES.map(t=>(
                      <button key={t.value} type="button"
                        onClick={()=>setForm(p=>({...p,assignmentType:t.value}))}
                        className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                          form.assignmentType===t.value?'border-indigo-600 bg-indigo-50':'border-gray-200 hover:border-gray-300'}`}>
                        <div className="text-lg">{t.icon}</div>
                        <div className="text-xs font-semibold text-gray-700 mt-0.5">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </FL>

                <FL label="Description">
                  <textarea name="description" value={form.description} onChange={fc}
                    rows="2" placeholder="Brief overview for students…"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none outline-none"/>
                </FL>

                <FL label="Tags">
                  <div className="flex gap-2 mb-2">
                    <input value={tag} onChange={e=>setTag(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())}
                      placeholder="e.g. algebra, chapter-5"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    <button onClick={addTag} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={16}/></button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map(t=>(
                      <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                        <Tag size={10}/>{t}
                        <button onClick={()=>setForm(p=>({...p,tags:p.tags.filter(x=>x!==t)}))}><X size={10}/></button>
                      </span>
                    ))}
                  </div>
                </FL>
              </>}

              {/* ── Details ── */}
              {tab==='details'&&<>
                <FL label="Detailed Instructions">
                  <textarea name="instructions" value={form.instructions} onChange={fc}
                    rows="4" placeholder="Step-by-step instructions…"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none outline-none"/>
                </FL>

                <div className="grid grid-cols-2 gap-4">
                  <FL label="Due Date" req>
                    <input type="date" name="dueDate" value={form.dueDate} onChange={fc} min={today}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"/>
                  </FL>
                  <FL label="Due Time">
                    <input type="time" name="dueTime" value={form.dueTime} onChange={fc}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"/>
                  </FL>
                  <FL label="Total Marks">
                    <input type="number" name="totalMarks" value={form.totalMarks} onChange={fc} min="1"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"/>
                  </FL>
                  <FL label="Passing Marks">
                    <input type="number" name="passingMarks" value={form.passingMarks} onChange={fc} min="0"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"/>
                  </FL>
                  <FL label="Est. Time (mins)">
                    <input type="number" name="estimatedTime" value={form.estimatedTime} onChange={fc} min="1"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"/>
                  </FL>
                  <FL label="Submission Type">
                    <select name="submissionType" value={form.submissionType} onChange={fc}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      {SUBMISSION_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </FL>
                  <FL label="Difficulty">
                    <select name="difficulty" value={form.difficulty} onChange={fc}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      {['easy','medium','hard'].map(d=><option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}
                    </select>
                  </FL>
                  <FL label="Priority">
                    <select name="priority" value={form.priority} onChange={fc}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      {['low','normal','high','urgent'].map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </FL>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Allow Late Submission</span>
                  <input type="checkbox" name="allowLateSubmission" checked={form.allowLateSubmission} onChange={fc}
                    className="w-5 h-5 text-indigo-600 rounded cursor-pointer"/>
                </div>
                {form.allowLateSubmission&&(
                  <FL label="Late Penalty (% per day)">
                    <input type="number" name="latePenalty" value={form.latePenalty} onChange={fc} min="0" max="100"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                  </FL>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[['notifyStudents','Notify Students'],['notifyParents','Notify Parents']].map(([n,l])=>(
                    <div key={n} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">{l}</span>
                      <input type="checkbox" name={n} checked={form[n]} onChange={fc}
                        className="w-5 h-5 text-indigo-600 rounded cursor-pointer"/>
                    </div>
                  ))}
                </div>

                <FL label="Learning Objectives">
                  <div className="flex gap-2 mb-2">
                    <input value={obj} onChange={e=>setObj(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addObj())}
                      placeholder="What will students learn?"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    <button onClick={addObj} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={16}/></button>
                  </div>
                  {form.learningObjectives.map((o,i)=>(
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg mb-1">
                      <CheckCircle size={14} className="text-green-600 shrink-0"/>
                      <span className="flex-1 text-sm">{o}</span>
                      <button onClick={()=>setForm(p=>({...p,learningObjectives:p.learningObjectives.filter((_,j)=>j!==i)}))}
                        className="text-red-400 hover:text-red-600"><X size={13}/></button>
                    </div>
                  ))}
                </FL>
              </>}

              {/* ── Grading ── */}
              {tab==='grading'&&<>
                <p className="text-sm text-gray-500">Break down marks across criteria.</p>
                {form.rubric.length>0&&(
                  <div className="space-y-2">
                    {form.rubric.map((r,i)=>(
                      <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.criteria}
                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">{r.points} pts</span>
                          </p>
                          {r.description&&<p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                        </div>
                        <button onClick={()=>setForm(p=>({...p,rubric:p.rubric.filter((_,j)=>j!==i)}))}
                          className="text-red-400 hover:text-red-600 ml-3"><X size={14}/></button>
                      </div>
                    ))}
                    <div className={`flex justify-between px-3 py-2 rounded-lg text-sm font-semibold ${
                      rubricTotal!==+form.totalMarks?'bg-orange-50 text-orange-600':'bg-green-50 text-green-700'}`}>
                      <span>Rubric total</span>
                      <span>{rubricTotal} / {form.totalMarks} pts{rubricTotal!==+form.totalMarks&&' ⚠ mismatch'}</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <input value={rub.criteria} onChange={e=>setRub(p=>({...p,criteria:e.target.value}))}
                    placeholder="Criteria" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  <input type="number" value={rub.points} onChange={e=>setRub(p=>({...p,points:e.target.value}))}
                    placeholder="Points" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  <div className="flex gap-2">
                    <input value={rub.description} onChange={e=>setRub(p=>({...p,description:e.target.value}))}
                      placeholder="Description (opt)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    <button onClick={addRub} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shrink-0"><Plus size={16}/></button>
                  </div>
                </div>
              </>}

              {/* ── Files & Links ── */}
              {tab==='files'&&<>
                <FL label="Upload Attachments">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center hover:border-indigo-400 transition-colors">
                    <input type="file" multiple onChange={onFiles} id="f-up" className="hidden"/>
                    <label htmlFor="f-up" className="cursor-pointer block">
                      <Upload size={24} className="mx-auto text-gray-400 mb-2"/>
                      <p className="text-sm font-semibold text-gray-700">Click to upload</p>
                      <p className="text-xs text-gray-400">PDF, DOC, images</p>
                    </label>
                  </div>
                  {form.attachments.map(f=>(
                    <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mt-2">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-indigo-600"/>
                        <div><p className="text-sm font-semibold text-gray-900">{f.name}</p><p className="text-xs text-gray-400">{f.size}</p></div>
                      </div>
                      <button onClick={()=>setForm(p=>({...p,attachments:p.attachments.filter(a=>a.id!==f.id)}))}
                        className="text-red-400 hover:text-red-600"><X size={14}/></button>
                    </div>
                  ))}
                </FL>

                <FL label="Resource Links">
                  <div className="flex gap-2 mb-2">
                    <input value={res.title} onChange={e=>setRes(p=>({...p,title:e.target.value}))}
                      placeholder="Title" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    <input type="url" value={res.url} onChange={e=>setRes(p=>({...p,url:e.target.value}))}
                      placeholder="https://…" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    <button onClick={addRes} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shrink-0"><Plus size={16}/></button>
                  </div>
                  {form.resources.map(r=>(
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-1">
                      <div className="flex items-center gap-2">
                        <LinkIcon size={14} className="text-blue-600"/>
                        <div><p className="text-sm font-semibold text-gray-900">{r.title}</p><p className="text-xs text-gray-400 truncate max-w-xs">{r.url}</p></div>
                      </div>
                      <button onClick={()=>setForm(p=>({...p,resources:p.resources.filter(x=>x.id!==r.id)}))}
                        className="text-red-400 hover:text-red-600"><X size={14}/></button>
                    </div>
                  ))}
                </FL>
              </>}
            </div>

            {/* footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button onClick={()=>setOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button onClick={saveDraft} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {saving?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>} Save Draft
                </button>
                <button onClick={publish} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm
                             hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 active:scale-95 transition-all">
                  {saving?<Loader2 size={15} className="animate-spin"/>:<Send size={15}/>}
                  {mode==='edit'?'Update':'Publish'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const FL = ({label,req,children})=>(
  <div>
    {label&&<label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}{req&&<span className="text-red-500 ml-0.5">*</span>}
    </label>}
    {children}
  </div>
);

const Sel = ({name,value,onChange,loading,icon,children})=>(
  loading
    ?<div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-400">
        <Loader2 size={13} className="animate-spin"/>Loading…
      </div>
    :<div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
      <select name={name} value={value} onChange={onChange}
        className="w-full pl-9 pr-7 py-2.5 border border-gray-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none">
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
    </div>
);

const MI = ({icon,label,onClick,color='text-gray-700'})=>(
  <button onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${color}`}>
    {icon}{label}
  </button>
);