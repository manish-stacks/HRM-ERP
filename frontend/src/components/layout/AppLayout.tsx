import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Clock,
  ScanFace,
  CalendarCheck,
  Banknote,
  Receipt,
  UserCheck,
  TrendingUp,
  GraduationCap,
  Laptop,
  HelpCircle,
  Bell,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  interface NavItem {
    name: string;
    path: string;
    icon: any;
    badge?: string;
    roles?: string[];
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const allNavGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Self-Service Hub', path: '/self-service', icon: User },
      ]
    },
    {
      title: 'WORKFORCE & ROSTER',
      items: [
        { name: 'Employees', path: '/employees', icon: Users, roles: ['Super Admin', 'Org Admin', 'HR Admin', 'HR Manager', 'Department Manager'] },
        { name: 'Organization', path: '/organization', icon: Building2, roles: ['Super Admin', 'Org Admin', 'HR Admin'] },
        { name: 'Shifts & Roster', path: '/shifts', icon: CalendarDays, roles: ['Super Admin', 'Org Admin', 'HR Admin', 'Department Manager'] },
        { name: 'Attendance Register', path: '/attendance', icon: Clock },
        { name: 'Face Attendance', path: '/face-attendance', icon: ScanFace, badge: 'Biometric' },
        { name: 'Leave & Absence', path: '/leaves', icon: CalendarCheck },
      ]
    },
    {
      title: 'FINANCE & COMPENSATION',
      items: [
        { name: 'Payroll & Payslips', path: '/payroll', icon: Banknote },
        { name: 'Expenses & Loans', path: '/expenses', icon: Receipt },
      ]
    },
    {
      title: 'TALENT & OPERATIONS',
      items: [
        { name: 'Recruitment (ATS)', path: '/recruitment', icon: UserCheck, roles: ['Super Admin', 'Org Admin', 'HR Admin', 'HR Manager', 'Recruiter'] },
        { name: 'Performance', path: '/performance', icon: TrendingUp },
        { name: 'Training & Learning', path: '/training', icon: GraduationCap },
        { name: 'Company Assets', path: '/assets', icon: Laptop, roles: ['Super Admin', 'Org Admin', 'HR Admin', 'IT/Asset Manager'] },
        { name: 'Helpdesk & Support', path: '/helpdesk', icon: HelpCircle },
      ]
    },
    {
      title: 'INTELLIGENCE & AUDIT',
      items: [
        { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['Super Admin', 'Org Admin', 'HR Admin', 'Department Manager', 'Auditor'] },
        { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['Super Admin', 'Org Admin', 'Auditor'] },
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['Super Admin', 'Org Admin'] },
      ]
    }
  ];

  // Filter navigation items by role
  const navGroups = allNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || hasRole(...item.roles))
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/20">
            A
          </div>
          <div>
            <div className="font-semibold text-white text-sm tracking-wide">Apex HRM Platform</div>
            <div className="text-xs text-blue-400 font-mono">APEX-GLOBAL</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-xs scrollbar-thin">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <div className="text-[10px] font-semibold text-slate-500 tracking-wider mb-2 px-2">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs text-white uppercase">
              {user?.email[0]}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.email}</div>
              <div className="text-[10px] text-blue-400 font-medium">
                {user?.roles[0] || 'Employee'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Enterprise Workspace</span>
              <h1 className="text-sm font-semibold text-slate-800">Apex Global Technologies Inc.</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/face-attendance"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-xs"
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Face Scanner</span>
            </NavLink>

            <NavLink
              to="/self-service"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Self Service
            </NavLink>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {user?.roles?.join(', ') || 'Staff Member'}
                </div>
              </div>
            </div>

            {/* Mobile Header Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-slate-300 p-4 border-b border-slate-800 max-h-[80vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="space-y-1">
              {navGroups.flatMap(g => g.items).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 text-sm text-slate-300 hover:text-white"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Mobile Menu User Profile & Sign Out Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
                  </div>
                  <div className="text-[10px] text-blue-400 font-medium truncate">
                    {user?.roles?.[0] || 'Employee'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-semibold transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

