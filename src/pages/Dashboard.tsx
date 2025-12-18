import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  BookOpen, 
  Trophy, 
  Calendar,
  MessageSquare,
  Target,
  Flame,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/stores/authStore';

// Mock data for demonstration
const mockStudent = {
  name: 'أحمد محمد',
  nameEn: 'Ahmed Mohammed',
  studentId: '2021001234',
  department: 'هندسة المعلوماتية',
  departmentEn: 'Information Engineering',
  year: 3,
  gpa: 3.45,
  totalCredits: 87,
  xp: 2450,
  level: 12,
  nextLevelXp: 3000,
  streak: 7,
};

const mockCourses = [
  { name: 'هياكل البيانات', nameEn: 'Data Structures', grade: 'A', credits: 3 },
  { name: 'قواعد البيانات', nameEn: 'Databases', grade: 'B+', credits: 3 },
  { name: 'الشبكات الحاسوبية', nameEn: 'Computer Networks', grade: 'A-', credits: 3 },
  { name: 'هندسة البرمجيات', nameEn: 'Software Engineering', grade: 'B', credits: 3 },
];

const mockAchievements = [
  { icon: Star, name: 'طالب متميز', nameEn: 'Distinguished Student', color: 'text-yellow-500' },
  { icon: Flame, name: 'سلسلة 7 أيام', nameEn: '7 Day Streak', color: 'text-orange-500' },
  { icon: BookOpen, name: 'قارئ نهم', nameEn: 'Avid Reader', color: 'text-blue-500' },
];

const mockDeadlines = [
  { title: 'تسليم مشروع البرمجيات', titleEn: 'Software Project Submission', date: '2024-01-20', daysLeft: 3 },
  { title: 'امتحان الشبكات', titleEn: 'Networks Exam', date: '2024-01-25', daysLeft: 8 },
  { title: 'واجب قواعد البيانات', titleEn: 'Database Assignment', date: '2024-01-18', daysLeft: 1 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguageStore();
  const { user } = useAuthStore();

  const xpProgress = (mockStudent.xp / mockStudent.nextLevelXp) * 100;

  return (
    <MainLayout>
      <div className="container mx-auto space-y-6 p-4 md:p-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden border-0 gradient-hero text-primary-foreground">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-primary-foreground/80">
                    {t('مرحباً بك', 'Welcome back')},
                  </p>
                  <h1 className="text-2xl font-bold md:text-3xl">
                    {language === 'ar' ? mockStudent.name : mockStudent.nameEn}
                  </h1>
                  <p className="text-sm text-primary-foreground/70">
                    {t(mockStudent.department, mockStudent.departmentEn)} • {t('السنة', 'Year')} {mockStudent.year}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="rounded-xl bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs text-primary-foreground/70">{t('المعدل التراكمي', 'GPA')}</p>
                    <p className="text-2xl font-bold">{mockStudent.gpa}</p>
                  </div>
                  <div className="rounded-xl bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs text-primary-foreground/70">{t('الساعات المكتسبة', 'Credits')}</p>
                    <p className="text-2xl font-bold">{mockStudent.totalCredits}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
                    <Trophy className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {t('المستوى', 'Level')} {mockStudent.level}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mockStudent.xp} / {mockStudent.nextLevelXp} XP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">{mockStudent.streak} {t('يوم', 'days')}</span>
                </div>
              </div>
              <Progress value={xpProgress} className="mt-4 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { icon: MessageSquare, label: t('المستشار الذكي', 'AI Advisor'), path: '/chat', color: 'bg-blue-500' },
            { icon: BookOpen, label: t('المقررات', 'Courses'), path: '/courses', color: 'bg-green-500' },
            { icon: Target, label: t('المسار المهني', 'Career'), path: '/career', color: 'bg-purple-500' },
            { icon: Trophy, label: t('الإنجازات', 'Achievements'), path: '/achievements', color: 'bg-yellow-500' },
          ].map((action, i) => (
            <Card
              key={action.path}
              className="cursor-pointer transition-all hover-lift hover:border-primary/50"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className={`rounded-xl ${action.color} p-3 text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">
                  {t('المقررات الحالية', 'Current Courses')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                  {t('عرض الكل', 'View All')}
                  {language === 'ar' ? <ChevronLeft className="mr-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCourses.map((course, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{language === 'ar' ? course.name : course.nameEn}</p>
                          <p className="text-xs text-muted-foreground">{course.credits} {t('ساعات', 'credits')}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        course.grade.startsWith('A') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        course.grade.startsWith('B') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {course.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  {t('آخر الإنجازات', 'Recent Achievements')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAchievements.map((achievement, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                    >
                      <div className={`${achievement.color}`}>
                        <achievement.icon className="h-6 w-6" />
                      </div>
                      <span className="font-medium">
                        {language === 'ar' ? achievement.name : achievement.nameEn}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => navigate('/achievements')}
                >
                  {t('عرض جميع الإنجازات', 'View All Achievements')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deadlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t('المواعيد القادمة', 'Upcoming Deadlines')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDeadlines.map((deadline, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {language === 'ar' ? deadline.title : deadline.titleEn}
                        </p>
                        <p className="text-sm text-muted-foreground">{deadline.date}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                        deadline.daysLeft <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        deadline.daysLeft <= 5 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {deadline.daysLeft} {t('أيام', 'days')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GPA Calculator Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  {t('حاسبة المعدل', 'GPA Calculator')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-secondary">{mockStudent.gpa}</p>
                    <p className="text-sm text-muted-foreground">{t('المعدل التراكمي الحالي', 'Current GPA')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-background/80 p-2">
                      <p className="text-lg font-semibold">{mockStudent.totalCredits}</p>
                      <p className="text-xs text-muted-foreground">{t('ساعة مكتسبة', 'Credits Earned')}</p>
                    </div>
                    <div className="rounded-lg bg-background/80 p-2">
                      <p className="text-lg font-semibold">45</p>
                      <p className="text-xs text-muted-foreground">{t('ساعة متبقية', 'Credits Left')}</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full">
                    {t('حساب المعدل المتوقع', 'Calculate Expected GPA')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
