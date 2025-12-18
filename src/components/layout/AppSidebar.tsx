import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Network,
  Trophy,
  BookOpen,
  Target,
  User,
  Settings,
  Shield,
  Users,
  Lightbulb,
  Calculator,
  Sparkles,
  AlertTriangle,
  Mail,
  CalendarDays,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const studentNavItems = [
  {
    titleAr: 'لوحة التحكم',
    titleEn: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
  },
  {
    titleAr: 'المستشار الذكي',
    titleEn: 'AI Advisor',
    icon: MessageSquare,
    url: '/chat',
  },
  {
    titleAr: 'خريطة المعرفة',
    titleEn: 'Knowledge Graph',
    icon: Network,
    url: '/knowledge-graph',
  },
  {
    titleAr: 'الإنجازات',
    titleEn: 'Achievements',
    icon: Trophy,
    url: '/achievements',
  },
  {
    titleAr: 'المقررات',
    titleEn: 'Courses',
    icon: BookOpen,
    url: '/courses',
  },
  {
    titleAr: 'المسار المهني',
    titleEn: 'Career Path',
    icon: Target,
    url: '/career',
  },
  {
    titleAr: 'أسلوب التعلم',
    titleEn: 'Learning Style',
    icon: Lightbulb,
    url: '/learning-style',
  },
  {
    titleAr: 'محاكي القرارات',
    titleEn: 'Simulator',
    icon: Calculator,
    url: '/simulator',
  },
  {
    titleAr: 'سجل المواهب',
    titleEn: 'Talent Ledger',
    icon: Sparkles,
    url: '/talent-ledger',
  },
  {
    titleAr: 'المواعيد النهائية',
    titleEn: 'Deadlines',
    icon: CalendarDays,
    url: '/deadlines',
  },
  {
    titleAr: 'الرسائل',
    titleEn: 'Messages',
    icon: Mail,
    url: '/messages',
  },
];

const advisorNavItems = [
  {
    titleAr: 'الإنذار المبكر',
    titleEn: 'Early Warning',
    icon: AlertTriangle,
    url: '/advisor-dashboard',
  },
];

const adminNavItems = [
  {
    titleAr: 'إدارة النظام',
    titleEn: 'System Admin',
    icon: Settings,
    url: '/admin',
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { t } = useLanguageStore();
  const { userRole } = useAuthStore();
  const collapsed = state === 'collapsed';

  const isActive = (url: string) => location.pathname === url;

  const renderNavItems = (items: typeof studentNavItems, groupLabel?: { ar: string; en: string }) => (
    <SidebarGroup>
      {groupLabel && !collapsed && (
        <SidebarGroupLabel>{t(groupLabel.ar, groupLabel.en)}</SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                onClick={() => navigate(item.url)}
                isActive={isActive(item.url)}
                tooltip={collapsed ? t(item.titleAr, item.titleEn) : undefined}
                className={cn(
                  'transition-all duration-200',
                  isActive(item.url) && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{t(item.titleAr, item.titleEn)}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-l-0 border-r border-sidebar-border rtl:border-l rtl:border-r-0"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg">
            <span className="text-lg font-bold">IP</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">
                IntelliPath
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                {t('المستشار الأكاديمي', 'Academic Advisor')}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Student Navigation */}
        {renderNavItems(studentNavItems, { ar: 'القائمة الرئيسية', en: 'Main Menu' })}

        {/* Advisor Navigation */}
        {(userRole === 'advisor' || userRole === 'admin') && (
          renderNavItems(advisorNavItems, { ar: 'المستشار', en: 'Advisor' })
        )}

        {/* Admin Navigation */}
        {userRole === 'admin' && (
          renderNavItems(adminNavItems, { ar: 'الإدارة', en: 'Admin' })
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/profile')}
              tooltip={collapsed ? t('الملف الشخصي', 'Profile') : undefined}
            >
              <User className="h-5 w-5" />
              {!collapsed && <span>{t('الملف الشخصي', 'Profile')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/settings')}
              tooltip={collapsed ? t('الإعدادات', 'Settings') : undefined}
            >
              <Settings className="h-5 w-5" />
              {!collapsed && <span>{t('الإعدادات', 'Settings')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
