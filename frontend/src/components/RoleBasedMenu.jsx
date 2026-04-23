import React, { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCog,
  Building2,
  Calendar,
  ClipboardCheck,
  BookOpen,
  Award,
  DollarSign,
  Brain,
  ShieldCheck,
  Bell,
  Package,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Menu,
  X,
  Home,
  FileText,
  TrendingUp,
  MessageSquare,
  Video,
  Wallet,
  ShoppingBag,
  Truck,
  BookMarked,
  UserPlus,
  PieChart,
  Activity,
  Zap,
  Globe,
  Lock
} from 'lucide-react';

const RoleBasedMenu = () => {
  const [currentRole, setCurrentRole] = useState('SUPER_ADMIN');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = {
    name: 'John Doe',
    email: 'john@academysphere.com',
    avatar: '👤',
    school: 'Cambridge International School',
    role: currentRole
  };

  const menuStructure = {
    SUPER_ADMIN: [
      {
        id: 'overview',
        label: 'Overview',
        icon: <Home className="w-5 h-5" />,
        path: '/dashboard',
        badge: null
      },
      {
        id: 'analytics',
        label: 'Platform Analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        path: '/analytics',
        badge: null
      },
      {
        id: 'schools',
        label: 'Schools Management',
        icon: <Building2 className="w-5 h-5" />,
        path: null,
        badge: { count: 1250, color: 'bg-blue-500' },
        submenu: [
          { label: 'All Schools', path: '/schools', icon: <Building2 className="w-4 h-4" /> },
          { label: 'School Onboarding', path: '/schools/onboard', icon: <UserPlus className="w-4 h-4" /> },
          { label: 'Pending Approvals', path: '/schools/approvals', icon: <ClipboardCheck className="w-4 h-4" />, badge: 12 },
          { label: 'Subscription Plans', path: '/schools/subscriptions', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Performance Reports', path: '/schools/reports', icon: <TrendingUp className="w-4 h-4" /> }
        ]
      },
      {
        id: 'users',
        label: 'User Management',
        icon: <Users className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'All Users', path: '/users', icon: <Users className="w-4 h-4" /> },
          { label: 'School Admins', path: '/users/admins', icon: <UserCog className="w-4 h-4" /> },
          { label: 'Roles & Permissions', path: '/users/roles', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Access Logs', path: '/users/logs', icon: <Activity className="w-4 h-4" /> }
        ]
      },
      {
        id: 'ai-insights',
        label: 'AI & Analytics',
        icon: <Brain className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'Platform Insights', path: '/ai/insights', icon: <PieChart className="w-4 h-4" /> },
          { label: 'Predictions', path: '/ai/predictions', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Model Training', path: '/ai/training', icon: <Zap className="w-4 h-4" /> },
          { label: 'AI Configuration', path: '/ai/config', icon: <Settings className="w-4 h-4" /> }
        ]
      },
      {
        id: 'blockchain',
        label: 'Blockchain',
        icon: <ShieldCheck className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'Transactions', path: '/blockchain/transactions', icon: <Wallet className="w-4 h-4" /> },
          { label: 'Certificates', path: '/blockchain/certificates', icon: <Award className="w-4 h-4" /> },
          { label: 'Audit Logs', path: '/blockchain/audit', icon: <FileText className="w-4 h-4" /> },
          { label: 'Smart Contracts', path: '/blockchain/contracts', icon: <Lock className="w-4 h-4" /> }
        ]
      },
      {
        id: 'vendors',
        label: 'Vendor Marketplace',
        icon: <Package className="w-5 h-5" />,
        path: null,
        badge: { count: 45, color: 'bg-purple-500' },
        submenu: [
          { label: 'All Vendors', path: '/vendors', icon: <Package className="w-4 h-4" /> },
          { label: 'Pending Approvals', path: '/vendors/approvals', icon: <ClipboardCheck className="w-4 h-4" />, badge: 8 },
          { label: 'Categories', path: '/vendors/categories', icon: <ShoppingBag className="w-4 h-4" /> },
          { label: 'Orders', path: '/vendors/orders', icon: <Truck className="w-4 h-4" /> }
        ]
      },
      {
        id: 'payments',
        label: 'Payment Management',
        icon: <DollarSign className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'All Transactions', path: '/payments/transactions', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Revenue Analytics', path: '/payments/revenue', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Gateway Settings', path: '/payments/gateways', icon: <Settings className="w-4 h-4" /> }
        ]
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <Bell className="w-5 h-5" />,
        path: '/notifications',
        badge: { count: 23, color: 'bg-red-500' }
      },
      {
        id: 'reports',
        label: 'Reports & Exports',
        icon: <FileText className="w-5 h-5" />,
        path: '/reports'
      },
      {
        id: 'settings',
        label: 'Platform Settings',
        icon: <Settings className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'General Settings', path: '/settings/general', icon: <Settings className="w-4 h-4" /> },
          { label: 'Email Templates', path: '/settings/email', icon: <MessageSquare className="w-4 h-4" /> },
          { label: 'Integration APIs', path: '/settings/apis', icon: <Globe className="w-4 h-4" /> },
          { label: 'Security', path: '/settings/security', icon: <ShieldCheck className="w-4 h-4" /> }
        ]
      }
    ],
    SCHOOL_ADMIN: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard'
      },
      {
        id: 'students',
        label: 'Students',
        icon: <GraduationCap className="w-5 h-5" />,
        path: null,
        badge: { count: 850, color: 'bg-blue-500' },
        submenu: [
          { label: 'All Students', path: '/students', icon: <Users className="w-4 h-4" /> },
          { label: 'Enrollment', path: '/students/enroll', icon: <UserPlus className="w-4 h-4" /> },
          { label: 'Performance', path: '/students/performance', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Attendance', path: '/students/attendance', icon: <ClipboardCheck className="w-4 h-4" /> }
        ]
      },
      {
        id: 'teachers',
        label: 'Teachers',
        icon: <UserCog className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'All Teachers', path: '/teachers', icon: <Users className="w-4 h-4" /> },
          { label: 'Add Teacher', path: '/teachers/add', icon: <UserPlus className="w-4 h-4" /> }
        ]
      },
      {
        id: 'fees',
        label: 'Fee Management',
        icon: <DollarSign className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'Fee Structure', path: '/fees/structure', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Collect Payments', path: '/fees/collect', icon: <Wallet className="w-4 h-4" /> }
        ]
      }
    ],
    TEACHER: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard'
      },
      {
        id: 'my-classes',
        label: 'My Classes',
        icon: <BookOpen className="w-5 h-5" />,
        path: null,
        submenu: [
          { label: 'All Classes', path: '/classes', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Timetable', path: '/classes/timetable', icon: <Calendar className="w-4 h-4" /> }
        ]
      },
      {
        id: 'students',
        label: 'My Students',
        icon: <Users className="w-5 h-5" />,
        path: '/students'
      }
    ],
    STUDENT: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard'
      },
      {
        id: 'my-courses',
        label: 'My Courses',
        icon: <BookOpen className="w-5 h-5" />,
        path: '/courses'
      },
      {
        id: 'assignments',
        label: 'Assignments',
        icon: <FileText className="w-5 h-5" />,
        path: '/assignments',
        badge: { count: 3, color: 'bg-red-500' }
      }
    ],
    PARENT: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard'
      },
      {
        id: 'children',
        label: 'My Children',
        icon: <Users className="w-5 h-5" />,
        path: '/children'
      },
      {
        id: 'fees',
        label: 'Fee Management',
        icon: <DollarSign className="w-5 h-5" />,
        path: '/fees'
      }
    ],
    VENDOR: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard'
      },
      {
        id: 'products',
        label: 'My Products',
        icon: <Package className="w-5 h-5" />,
        path: '/products'
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: <ShoppingBag className="w-5 h-5" />,
        path: '/orders',
        badge: { count: 15, color: 'bg-green-500' }
      }
    ]
  };

  const currentMenu = menuStructure[currentRole] || [];

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const filteredMenu = currentMenu.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.submenu && item.submenu.some(sub => 
      sub.label.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const roleLabels = {
    SUPER_ADMIN: 'Super Admin',
    SCHOOL_ADMIN: 'School Admin',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
    VENDOR: 'Vendor'
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
        {/* Logo Section */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AcademySphere
              </span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl">
                {currentUser.avatar}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold truncate">{currentUser.name}</div>
                <div className="text-xs text-gray-400 truncate">{currentUser.email}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 truncate">{currentUser.school}</div>
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs bg-purple-500 bg-opacity-20 text-purple-300 rounded">
                {roleLabels[currentRole]}
              </span>
            </div>
          </div>
        )}

        {/* Search */}
        {!isSidebarCollapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMenu.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => item.submenu ? toggleMenu(item.id) : null}
                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-700 transition-colors ${
                  isSidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  {!isSidebarCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${item.badge.color} text-white`}>
                          {item.badge.count}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!isSidebarCollapsed && item.submenu && (
                  expandedMenus[item.id] ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {/* Submenu */}
              {!isSidebarCollapsed && item.submenu && expandedMenus[item.id] && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu.map((subItem, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center justify-between p-2 pl-8 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        {subItem.icon}
                        <span>{subItem.label}</span>
                      </div>
                      {subItem.badge && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                          {subItem.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          {!isSidebarCollapsed && (
            <>
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                <HelpCircle className="w-5 h-5" />
                <span>Help & Support</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 transition-colors text-red-400">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Role-Based Menu System Demo
            </h1>
            <p className="text-gray-600">
              Switch between different roles to see how the menu adapts
            </p>
          </div>

          {/* Role Selector */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Role</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.keys(menuStructure).map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentRole === role
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-semibold">{roleLabels[role]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Role Info */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Current Role: {roleLabels[currentRole]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Menu Items</div>
                <div className="text-2xl font-bold text-blue-600">{currentMenu.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">With Submenus</div>
                <div className="text-2xl font-bold text-green-600">
                  {currentMenu.filter(item => item.submenu).length}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Notifications</div>
                <div className="text-2xl font-bold text-purple-600">
                  {currentMenu.reduce((acc, item) => acc + (item.badge?.count || 0), 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Features</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Dynamic role-based menu rendering</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Collapsible sidebar with smooth animations</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Menu search functionality</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Expandable submenus</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Badge notifications for pending items</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Six different user roles (Super Admin, School Admin, Teacher, Student, Parent, Vendor)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedMenu;