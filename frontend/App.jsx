// src/App.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleGuard from "./auth/RoleGuard";
import PageLoader from "./components/PageLoader";

// ============================================
// PUBLIC / HOME
// ============================================
const Home = lazy(() => import("./pages/Home"));
const SchoolSetup = lazy(() => import("./pages/SchoolSetup"));

// ============================================
// AUTHENTICATION ROUTES
// ============================================
const Login = lazy(() => import("./auth/Login"));
const Register = lazy(() => import("./auth/Register"));
const OAuth2Callback = lazy(() => import("./auth/OAuth2Callback"));
const ForgotPassword = lazy(() => import("./auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./auth/VerifyEmail"));
const TwoFactorAuth = lazy(() => import("./auth/TwoFactorAuth"));

// ============================================
// SUPER ADMIN IMPORTS
// ============================================
const SuperAdminLayout = lazy(() => import("./layouts/SuperAdminLayout"));
const SuperAdminDashboard = lazy(
  () => import("./pages/super-admin/SuperAdminDashboard"),
);
const PlatformAnalytics = lazy(
  () => import("./pages/super-admin/Platformanalytics"),
);
const SchoolProfile = lazy(() => import("./pages/super-admin/SchoolProfile"));
const ManageSchools = lazy(() => import("./pages/super-admin/Manageschools"));
const SchoolDetails = lazy(() => import("./pages/super-admin/SchoolDetails"));
const SchoolApplications = lazy(
  () => import("./pages/super-admin/SchoolApplications"),
);
const ManageUsers = lazy(() => import("./pages/super-admin/ManageUsers"));
const RolesPermissions = lazy(
  () => import("./pages/super-admin/RolesPermissions"),
);
const AIInsights = lazy(() => import("./pages/super-admin/AIInsights"));
const SuperAdminSettings = lazy(
  () => import("./pages/super-admin/SuperAdminSettings"),
);
const SystemLogs = lazy(() => import("./pages/super-admin/SystemLogs"));
const FeeManagement = lazy(() => import("./pages/super-admin/FeeManagement"));

// ============================================
// SCHOOL ADMIN IMPORTS
// ============================================
const SchoolAdminLayout = lazy(() => import("./layouts/SchoolAdminLayout"));
const SchoolAdminDashboard = lazy(
  () => import("./pages/school-admin/SchoolAdminDashboard"),
);
const ManageStudents = lazy(
  () => import("./pages/school-admin/ManageStudents"),
);
const StudentDetails = lazy(
  () => import("./pages/school-admin/StudentDetails"),
);
const StudentEnrollment = lazy(
  () => import("./pages/school-admin/StudentEnrollment"),
);

const TeachersList = lazy(() => import("./pages/school-admin/TeachersList"));

const AddTeacher = lazy(() => import("./pages/school-admin/AddTeacher"));
const MarkAttendance = lazy(
  () => import("./pages/school-admin/Markattendance"),
);
const SubjectsPage = lazy(() => import("./pages/school-admin/SubjectsPage"));
const ManageClasses = lazy(() => import("./pages/school-admin/ManageClasses"));
const ClassDetail = lazy(() => import("./pages/school-admin/Class"));
const SchoolAdminProfile = lazy(
  () => import("./pages/school-admin/SchoolAdminProfile"),
);
const AttendancePredictions = lazy(
  () => import("./pages/school-admin/Attendancepredictions"),
);
const CurriculumBuilder = lazy(
  () => import("./pages/school-admin/CurriculumBuilder"),
);
const AcademicCalendar = lazy(
  () => import("./pages/school-admin/AcademicCalendar"),
);
const EnterResults = lazy(() => import("./pages/school-admin/EnterResults"));
const GradeAnalytics = lazy(
  () => import("./pages/school-admin/Gradeanalytics"),
);
const FeeStructure = lazy(() => import("./pages/school-admin/FeeStructure"));

// ============================================
// TEACHER IMPORTS
// ============================================
const TeacherLayout = lazy(() => import("./layouts/TeacherLayout"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const MyClasses = lazy(() => import("./pages/teacher/MyClasses"));
const ClassAnalytics = lazy(() => import("./pages/teacher/ClassAnalytics"));
const MyStudents = lazy(() => import("./pages/teacher/MyStudents"));
const StudentInsights = lazy(() => import("./pages/teacher/StudentInsights"));
const CreateAssignment = lazy(() => import("./pages/teacher/CreateAssignment"));
const PendingReview = lazy(() => import("./pages/teacher/PendingReview"));
const GradeBook = lazy(() => import("./pages/teacher/GradeBook"));
const LessonPlans = lazy(() => import("./pages/teacher/LessonPlans"));
const Attendance = lazy(() => import("./pages/teacher/Attendance"));
const Reports = lazy(() => import("./pages/teacher/Reports"));
const Schedule = lazy(() => import("./pages/teacher/Schedule"));
const Messages = lazy(() => import("./pages/teacher/Message"));
const Result = lazy(() => import("./pages/teacher/Result"));

// ============================================
// STUDENT IMPORTS
// ============================================
const StudentLayout = lazy(() => import("./layouts/Studentlayout"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const MyCourses = lazy(() => import("./pages/student/MyCourses"));
const MyTimetable = lazy(() => import("./pages/student/MyTimetable"));
const PendingAssignments = lazy(
  () => import("./pages/student/PendingAssignments"),
);
const SubmitAssignment = lazy(() => import("./pages/student/SubmitAssignment"));
const MyAttendance = lazy(() => import("./pages/student/MyAttendance"));
const ViewResults = lazy(() => import("./pages/student/ViewResults"));
const AIRecommendations = lazy(
  () => import("./pages/student/AIRecommendations"),
);
const PayFees = lazy(() => import("./pages/student/PayFees"));
const MyCertificates = lazy(() => import("./pages/student/MyCertificates"));
const Library = lazy(() => import("./pages/student/Library"));

// ============================================
// PARENT IMPORTS
// ============================================
const ParentLayout = lazy(() => import("./layouts/ParentLayout"));
const ParentDashboard = lazy(() => import("./pages/parent/ParentDashboard"));
const MyChildren = lazy(() => import("./pages/parent/MyChildren"));
const ChildPerformance = lazy(() => import("./pages/parent/ChildPerformance"));
const ChildAttendance = lazy(() => import("./pages/parent/ChildAttendance"));
const ChildResults = lazy(() => import("./pages/parent/ChildResults"));
const PayChildFees = lazy(() => import("./pages/parent/PayFees"));
const ParentMessages = lazy(() => import("./pages/parent/Messages"));

// ============================================
// COMMON & ERROR ROUTES
// ============================================
const Profile = lazy(() => import("./pages/common/Profile"));
const Notifications = lazy(() => import("./pages/common/Notifications"));
const HelpSupport = lazy(() => import("./pages/common/HelpSupport"));
const NotFound = lazy(() => import("./pages/errors/NotFound"));
const Unauthorized = lazy(() => import("./pages/errors/Unauthorized"));
const ServerError = lazy(() => import("./pages/errors/ServerError"));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── PUBLIC ROUTES ─────────────────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/super-admin/login"
          element={<Login isSuperAdmin={true} />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/2fa" element={<TwoFactorAuth />} />
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        <Route path="/school-setup/:token" element={<SchoolSetup />} />

        {/* ── SUPER ADMIN ROUTES ────────────────────────────────────── */}
        <Route
          path="/super-admin/*"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="analytics" element={<PlatformAnalytics />} />
          <Route path="profile" element={<SchoolProfile />} />
          <Route path="schools" element={<ManageSchools />} />
          <Route path="schools/applications" element={<SchoolApplications />} />
          <Route path="schools/:schoolId" element={<SchoolDetails />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="users/roles" element={<RolesPermissions />} />
          <Route path="ai/insights" element={<AIInsights />} />
          <Route path="fees" element={<FeeManagement />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* ── SCHOOL ADMIN ROUTES ───────────────────────────────────── */}
        <Route
          path="/school-admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["SCHOOL_ADMIN"]}>
                <SchoolAdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SchoolAdminDashboard />} />

          {/* Students */}
          <Route path="students" element={<ManageStudents />} />
          <Route path="students/enroll" element={<StudentEnrollment />} />
          <Route path="students/:studentId" element={<StudentDetails />} />

          {/* Teachers */}
          <Route path="teachers" element={<TeachersList />} />
          <Route
            path="teachers/add"
            element={
              <AddTeacher
                onClose={() => navigate(-1)}
                onSubmit={() => navigate("/school-admin/teachers")}
              />
            }
          />
          <Route path="teachers/:teacherId/edit" element={<AddTeacher />} />

          {/* Classes & Subjects */}
          <Route path="classes" element={<ManageClasses />} />
          <Route path="classes/:classId" element={<ClassDetail />} />
          <Route path="subjects" element={<SubjectsPage />} />

          {/* Attendance */}
          <Route path="attendance/mark" element={<MarkAttendance />} />
          <Route
            path="attendance/predictions"
            element={<AttendancePredictions />}
          />

          {/* Curriculum */}
          <Route path="curriculum/builder" element={<CurriculumBuilder />} />
          <Route path="curriculum/calendar" element={<AcademicCalendar />} />

          {/* Results */}
          <Route path="results/enter" element={<EnterResults />} />
          <Route path="results/analytics" element={<GradeAnalytics />} />

          {/* Fees */}
          <Route path="fees/structure" element={<FeeStructure />} />

          {/* Profile & Settings */}
          <Route path="profile" element={<SchoolAdminProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* ── TEACHER ROUTES ────────────────────────────────────────── */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["TEACHER"]}>
                <TeacherLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="classes/analytics" element={<ClassAnalytics />} />
          <Route path="students" element={<MyStudents />} />
          <Route path="students/insights" element={<StudentInsights />} />
          <Route path="assignments/create" element={<CreateAssignment />} />
          <Route path="assignments/pending" element={<PendingReview />} />
          <Route path="results/gradebook" element={<GradeBook />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="messages" element={<Messages />} />
          <Route path="reports" element={<Reports />} />

          <Route path="result" element={<Result />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="curriculum/lessons" element={<LessonPlans />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* ── STUDENT ROUTES ────────────────────────────────────────── */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["STUDENT"]}>
                <StudentLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="timetable" element={<MyTimetable />} />
          <Route
            path="assignments"
            element={<Navigate to="assignments/pending" replace />}
          />
          <Route path="assignments/pending" element={<PendingAssignments />} />
          <Route path="assignments/submit/:id" element={<SubmitAssignment />} />
          <Route path="assignments/submit" element={<SubmitAssignment />} />
          <Route path="attendance" element={<MyAttendance />} />
          <Route path="results" element={<ViewResults />} />
          <Route
            path="results/recommendations"
            element={<AIRecommendations />}
          />
          <Route path="fees/pay" element={<PayFees />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="library" element={<Library />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* ── PARENT ROUTES ─────────────────────────────────────────── */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["PARENT"]}>
                <ParentLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="children" element={<MyChildren />} />
          <Route
            path="children/:childId/performance"
            element={<ChildPerformance />}
          />
          <Route
            path="children/:childId/attendance"
            element={<ChildAttendance />}
          />
          <Route path="children/:childId/results" element={<ChildResults />} />
          <Route path="fees/pay" element={<PayChildFees />} />
          <Route path="messages" element={<ParentMessages />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        {/* ── ERROR ROUTES ──────────────────────────────────────────── */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/server-error" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
