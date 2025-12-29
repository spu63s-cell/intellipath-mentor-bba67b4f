import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageStore } from '@/stores/languageStore';
import { 
  BarChart3, TrendingUp, TrendingDown, BookOpen, Clock, Target, 
  Award, Calendar, PieChart, Activity, GraduationCap, Zap, Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Mock data for analytics
const gpaHistory = [
  { semester: 'F2021', gpa: 2.8, credits: 15 },
  { semester: 'S2022', gpa: 3.0, credits: 16 },
  { semester: 'F2022', gpa: 3.2, credits: 18 },
  { semester: 'S2023', gpa: 3.4, credits: 15 },
  { semester: 'F2023', gpa: 3.3, credits: 17 },
  { semester: 'S2024', gpa: 3.5, credits: 16 },
];

const coursePerformance = [
  { subject: 'Programming', score: 85, avg: 72 },
  { subject: 'Mathematics', score: 78, avg: 68 },
  { subject: 'Physics', score: 82, avg: 70 },
  { subject: 'Networks', score: 90, avg: 75 },
  { subject: 'Databases', score: 88, avg: 73 },
];

const gradeDistribution = [
  { grade: 'A', count: 8, color: '#22c55e' },
  { grade: 'B+', count: 12, color: '#84cc16' },
  { grade: 'B', count: 10, color: '#eab308' },
  { grade: 'C+', count: 5, color: '#f97316' },
  { grade: 'C', count: 3, color: '#ef4444' },
];

const studyHabits = [
  { day: 'Sun', hours: 4 },
  { day: 'Mon', hours: 6 },
  { day: 'Tue', hours: 5 },
  { day: 'Wed', hours: 7 },
  { day: 'Thu', hours: 4 },
  { day: 'Fri', hours: 2 },
  { day: 'Sat', hours: 3 },
];

const skillsRadar = [
  { skill: 'Coding', value: 85 },
  { skill: 'Problem Solving', value: 78 },
  { skill: 'Communication', value: 70 },
  { skill: 'Teamwork', value: 82 },
  { skill: 'Leadership', value: 65 },
  { skill: 'Research', value: 75 },
];

export default function Analytics() {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const [selectedPeriod, setSelectedPeriod] = useState('semester');

  const texts = {
    title: isRTL ? 'التحليلات الأكاديمية' : 'Academic Analytics',
    subtitle: isRTL ? 'تتبع أداءك الأكاديمي بالتفصيل' : 'Track your academic performance in detail',
    overview: isRTL ? 'نظرة عامة' : 'Overview',
    performance: isRTL ? 'الأداء' : 'Performance',
    trends: isRTL ? 'الاتجاهات' : 'Trends',
    currentGpa: isRTL ? 'المعدل الحالي' : 'Current GPA',
    totalCredits: isRTL ? 'إجمالي الساعات' : 'Total Credits',
    coursesCompleted: isRTL ? 'المقررات المكتملة' : 'Courses Completed',
    ranking: isRTL ? 'الترتيب' : 'Ranking',
    gpaHistory: isRTL ? 'تاريخ المعدل' : 'GPA History',
    gradeDistribution: isRTL ? 'توزيع الدرجات' : 'Grade Distribution',
    coursePerformance: isRTL ? 'أداء المقررات' : 'Course Performance',
    studyHours: isRTL ? 'ساعات الدراسة' : 'Study Hours',
    skillsAnalysis: isRTL ? 'تحليل المهارات' : 'Skills Analysis',
    thisWeek: isRTL ? 'هذا الأسبوع' : 'This Week',
    vsAverage: isRTL ? 'مقارنة بالمتوسط' : 'vs Average',
    download: isRTL ? 'تحميل التقرير' : 'Download Report',
    semester: isRTL ? 'الفصل' : 'Semester',
    year: isRTL ? 'السنة' : 'Year',
    allTime: isRTL ? 'كل الوقت' : 'All Time',
  };

  const stats = [
    { 
      label: texts.currentGpa, 
      value: '3.50', 
      change: '+0.15', 
      trend: 'up', 
      icon: GraduationCap,
      color: 'from-emerald-500 to-green-600'
    },
    { 
      label: texts.totalCredits, 
      value: '97', 
      change: '+16', 
      trend: 'up', 
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-600'
    },
    { 
      label: texts.coursesCompleted, 
      value: '38', 
      change: '+6', 
      trend: 'up', 
      icon: Award,
      color: 'from-purple-500 to-pink-600'
    },
    { 
      label: texts.ranking, 
      value: '#15', 
      change: '+5', 
      trend: 'up', 
      icon: Target,
      color: 'from-amber-500 to-orange-600'
    },
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {texts.title}
                </h1>
                <p className="text-muted-foreground">{texts.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px] bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semester">{texts.semester}</SelectItem>
                  <SelectItem value="year">{texts.year}</SelectItem>
                  <SelectItem value="allTime">{texts.allTime}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {texts.download}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CardGlass className="hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold mt-3">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </CardGlass>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <PieChart className="h-4 w-4 mr-2" />
              {texts.overview}
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              {texts.performance}
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              {texts.trends}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GPA History */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {texts.gpaHistory}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={gpaHistory}>
                        <defs>
                          <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                        <YAxis domain={[2, 4]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="gpa" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fill="url(#gpaGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </CardGlass>

              {/* Grade Distribution */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    {texts.gradeDistribution}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={gradeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {gradeDistribution.map(item => (
                      <div key={item.grade} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.grade}: {item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CardGlass>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Performance */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {texts.coursePerformance}
                  </CardTitle>
                  <CardDescription>{texts.vsAverage}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={coursePerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="subject" type="category" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="avg" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} opacity={0.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </CardGlass>

              {/* Skills Radar */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {texts.skillsAnalysis}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={skillsRadar}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Skills"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </CardGlass>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <CardGlass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {texts.studyHours} - {texts.thisWeek}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studyHabits}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </CardGlass>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
