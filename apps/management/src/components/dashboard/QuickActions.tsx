import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  Receipt,
  Briefcase,
  Calendar,
  FileText,
  Building2,
  MonitorPlay,
  Megaphone,
  ArrowRight,
  Zap,
  CheckCircle2,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/hooks/usePermission';
import { useTodayAttendance } from '@/api/attendance';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/routes/config';
import type { PermissionKey } from '@/constants/permissionKeys';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  permission?: PermissionKey;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'staff',
    label: 'Staff Members',
    description: 'Manage team',
    icon: <Users className="h-5 w-5" />,
    path: ROUTES.STAFF,
    permission: 'staff.manage_profiles',
    color: 'bg-blue-500',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'View all tasks',
    icon: <ClipboardList className="h-5 w-5" />,
    path: ROUTES.TASKS,
    color: 'bg-purple-500',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    description: 'Manage expenses',
    icon: <Receipt className="h-5 w-5" />,
    path: ROUTES.EXPENSES,
    permission: 'finance.access',
    color: 'bg-amber-500',
  },
  {
    id: 'leads',
    label: 'CRM Leads',
    description: 'Manage prospects',
    icon: <Briefcase className="h-5 w-5" />,
    path: ROUTES.LEADS,
    color: 'bg-pink-500',
  },
  {
    id: 'clients',
    label: 'Client Accounts',
    description: 'View clients',
    icon: <Users className="h-5 w-5" />,
    path: ROUTES.CRM_CLIENTS,
    permission: 'crm.client_accounts',
    color: 'bg-emerald-500',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'View reports',
    icon: <FileText className="h-5 w-5" />,
    path: ROUTES.ANALYTICS,
    permission: 'analytics.access',
    color: 'bg-indigo-500',
  },
  {
    id: 'branches',
    label: 'Branches',
    description: 'Manage locations',
    icon: <Building2 className="h-5 w-5" />,
    path: ROUTES.BRANCHES,
    permission: 'staff.branches',
    color: 'bg-orange-500',
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    description: 'Announcements',
    icon: <Megaphone className="h-5 w-5" />,
    path: ROUTES.BROADCAST,
    permission: 'broadcast.access',
    color: 'bg-rose-500',
  },
  {
    id: 'monitor',
    label: 'Monitor',
    description: 'View cameras',
    icon: <MonitorPlay className="h-5 w-5" />,
    path: ROUTES.MONITOR,
    permission: 'monitor.view',
    color: 'bg-slate-500',
  },
];

function AttendanceWidget() {
  const navigate = useNavigate();
  const { data: today, isLoading } = useTodayAttendance();

  const hasCheckedIn = !!today?.checkInTime;
  const hasCheckedOut = !!today?.checkOutTime;

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white animate-pulse">
        <div className="h-5 w-32 bg-white/20 rounded mb-2" />
        <div className="h-4 w-24 bg-white/20 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden p-4 rounded-2xl text-white cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        hasCheckedOut
          ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600'
          : hasCheckedIn
          ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600'
          : 'bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600'
      )}
      onClick={() => navigate(ROUTES.ATTENDANCE_CHECK ?? '/attendance/check')}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              hasCheckedOut ? 'bg-white/20' : hasCheckedIn ? 'bg-white/20' : 'bg-white/20'
            )}>
              {hasCheckedOut ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : hasCheckedIn ? (
                <LogOut className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
            </div>
            <span className="font-semibold text-sm">Today's Attendance</span>
          </div>
          <p className="text-lg font-bold">
            {hasCheckedOut
              ? `${today?.hoursWorked?.toFixed(1) ?? 0} hours worked`
              : hasCheckedIn
              ? `In since ${new Date(today.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Tap to check in'}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {hasCheckedOut
              ? 'Day completed'
              : hasCheckedIn
              ? 'Tap to check out'
              : 'Start your workday'}
          </p>
        </div>
        <div className={cn(
          'p-3 rounded-xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110',
        )}>
          {hasCheckedOut ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
        </div>
      </div>
    </div>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const { can } = usePermission();

  const availableActions = QUICK_ACTIONS.filter(
    (action) => !action.permission || can(action.permission)
  ).slice(0, 6);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick Actions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.ATTENDANCE)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Attendance
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Attendance Widget */}
        <AttendanceWidget />

        {/* Quick Action Buttons */}
        {availableActions.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {availableActions.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl transition-all text-center group',
                  'bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50',
                  'hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm',
                  'active:scale-[0.98]'
                )}
              >
                <div
                  className={cn(
                    'p-2.5 rounded-xl text-white transition-all group-hover:scale-110 group-hover:shadow-lg',
                    action.color
                  )}
                >
                  {action.icon}
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                    {action.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
