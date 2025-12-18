import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useLanguageStore } from '@/stores/languageStore';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, TrendingDown, TrendingUp, Users, Search, Filter,
  Bell, Mail, MessageSquare, Eye, ChevronDown, ChevronUp,
  GraduationCap, BookOpen, Clock, Target, CheckCircle2, XCircle,
  BarChart3, PieChart, Activity, Send, UserCheck, AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell } from 'recharts';

type RiskLevel = 'high' | 'medium' | 'low';

interface Student {
  id: string;
  name: string;
  nameAr: string;
  studentId: string;
  department: string;
  departmentAr: string;
  gpa: number;
  previousGpa: number;
  attendanceRate: number;
  missedAssignments: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastActivity: string;
  email: string;
  phone: string;
  enrolledCourses: number;
  failingCourses: number;
  gpaHistory: { semester: string; gpa: number }[];
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Ahmed Hassan',
    nameAr: 'أحمد حسن',
    studentId: '2021001234',
    department: 'Information Engineering',
    departmentAr: 'هندسة المعلوماتية',
    gpa: 1.8,
    previousGpa: 2.3,
    attendanceRate: 65,
    missedAssignments: 5,
    riskLevel: 'high',
    riskFactors: ['GPA below 2.0', 'Low attendance', 'Missing assignments'],
    lastActivity: '3 days ago',
    email: 'ahmed@spu.edu.sy',
    phone: '+963 9XX XXX XXX',
    enrolledCourses: 6,
    failingCourses: 3,
    gpaHistory: [
      { semester: 'F2022', gpa: 2.8 },
      { semester: 'S2023', gpa: 2.5 },
      { semester: 'F2023', gpa: 2.3 },
      { semester: 'S2024', gpa: 1.8 },
    ],
  },
  {
    id: '2',
    name: 'Sara Ali',
    nameAr: 'سارة علي',
    studentId: '2021005678',
    department: 'Telecom Engineering',
    departmentAr: 'هندسة الاتصالات',
    gpa: 2.3,
    previousGpa: 2.6,
    attendanceRate: 78,
    missedAssignments: 2,
    riskLevel: 'medium',
    riskFactors: ['GPA declining', 'Attendance dropping'],
    lastActivity: '1 day ago',
    email: 'sara@spu.edu.sy',
    phone: '+963 9XX XXX XXX',
    enrolledCourses: 5,
    failingCourses: 1,
    gpaHistory: [
      { semester: 'F2022', gpa: 3.0 },
      { semester: 'S2023', gpa: 2.8 },
      { semester: 'F2023', gpa: 2.6 },
      { semester: 'S2024', gpa: 2.3 },
    ],
  },
  {
    id: '3',
    name: 'Omar Khalid',
    nameAr: 'عمر خالد',
    studentId: '2020009012',
    department: 'Biomedical Engineering',
    departmentAr: 'الهندسة الطبية',
    gpa: 2.5,
    previousGpa: 2.4,
    attendanceRate: 85,
    missedAssignments: 1,
    riskLevel: 'low',
    riskFactors: ['Near probation threshold'],
    lastActivity: 'Today',
    email: 'omar@spu.edu.sy',
    phone: '+963 9XX XXX XXX',
    enrolledCourses: 5,
    failingCourses: 0,
    gpaHistory: [
      { semester: 'F2022', gpa: 2.2 },
      { semester: 'S2023', gpa: 2.3 },
      { semester: 'F2023', gpa: 2.4 },
      { semester: 'S2024', gpa: 2.5 },
    ],
  },
  {
    id: '4',
    name: 'Lina Mohammad',
    nameAr: 'لينا محمد',
    studentId: '2022003456',
    department: 'Information Engineering',
    departmentAr: 'هندسة المعلوماتية',
    gpa: 1.5,
    previousGpa: 2.0,
    attendanceRate: 55,
    missedAssignments: 8,
    riskLevel: 'high',
    riskFactors: ['GPA critically low', 'Very low attendance', 'Many missing assignments', 'At risk of dismissal'],
    lastActivity: '1 week ago',
    email: 'lina@spu.edu.sy',
    phone: '+963 9XX XXX XXX',
    enrolledCourses: 5,
    failingCourses: 4,
    gpaHistory: [
      { semester: 'F2022', gpa: 2.5 },
      { semester: 'S2023', gpa: 2.2 },
      { semester: 'F2023', gpa: 2.0 },
      { semester: 'S2024', gpa: 1.5 },
    ],
  },
  {
    id: '5',
    name: 'Khaled Youssef',
    nameAr: 'خالد يوسف',
    studentId: '2021007890',
    department: 'Telecom Engineering',
    departmentAr: 'هندسة الاتصالات',
    gpa: 2.1,
    previousGpa: 2.3,
    attendanceRate: 72,
    missedAssignments: 3,
    riskLevel: 'medium',
    riskFactors: ['GPA declining', 'Attendance below average'],
    lastActivity: '2 days ago',
    email: 'khaled@spu.edu.sy',
    phone: '+963 9XX XXX XXX',
    enrolledCourses: 6,
    failingCourses: 2,
    gpaHistory: [
      { semester: 'F2022', gpa: 2.7 },
      { semester: 'S2023', gpa: 2.5 },
      { semester: 'F2023', gpa: 2.3 },
      { semester: 'S2024', gpa: 2.1 },
    ],
  },
];

const interventions = {
  high: [
    { ar: 'جلسة إرشاد عاجلة', en: 'Urgent counseling session' },
    { ar: 'خطة تحسين أكاديمي', en: 'Academic improvement plan' },
    { ar: 'تخفيف العبء الدراسي', en: 'Course load reduction' },
    { ar: 'إشعار ولي الأمر', en: 'Parent notification' },
  ],
  medium: [
    { ar: 'جلسة متابعة', en: 'Follow-up meeting' },
    { ar: 'دروس تقوية', en: 'Tutoring sessions' },
    { ar: 'مراقبة الحضور', en: 'Attendance monitoring' },
  ],
  low: [
    { ar: 'تشجيع ودعم', en: 'Encouragement and support' },
    { ar: 'مراجعة دورية', en: 'Periodic review' },
  ],
};

export default function AdvisorDashboard() {
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const isRTL = language === 'ar';

  const [students] = useState<Student[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const filteredStudents = students.filter(student => {
    const name = isRTL ? student.nameAr : student.name;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentId.includes(searchQuery);
    const matchesRisk = filterRisk === 'all' || student.riskLevel === filterRisk;
    const matchesDept = filterDept === 'all' || student.department === filterDept;
    return matchesSearch && matchesRisk && matchesDept;
  });

  const riskCounts = {
    high: students.filter(s => s.riskLevel === 'high').length,
    medium: students.filter(s => s.riskLevel === 'medium').length,
    low: students.filter(s => s.riskLevel === 'low').length,
  };

  const departments = [...new Set(students.map(s => s.department))];

  const pieData = [
    { name: isRTL ? 'خطر عالي' : 'High Risk', value: riskCounts.high, color: '#ef4444' },
    { name: isRTL ? 'خطر متوسط' : 'Medium Risk', value: riskCounts.medium, color: '#f59e0b' },
    { name: isRTL ? 'خطر منخفض' : 'Low Risk', value: riskCounts.low, color: '#22c55e' },
  ];

  const getRiskBadge = (level: RiskLevel) => {
    const config = {
      high: { class: 'bg-red-500 text-white', icon: AlertTriangle, text: isRTL ? 'عالي' : 'High' },
      medium: { class: 'bg-yellow-500 text-white', icon: AlertCircle, text: isRTL ? 'متوسط' : 'Medium' },
      low: { class: 'bg-green-500 text-white', icon: CheckCircle2, text: isRTL ? 'منخفض' : 'Low' },
    };
    const { class: className, icon: Icon, text } = config[level];
    return (
      <Badge className={`${className} gap-1`}>
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSendNotification = () => {
    if (!notificationMessage.trim()) return;
    toast({
      title: isRTL ? 'تم الإرسال' : 'Sent',
      description: isRTL
        ? `تم إرسال الإشعار إلى ${selectedStudents.length} طالب`
        : `Notification sent to ${selectedStudents.length} students`,
    });
    setShowNotificationDialog(false);
    setNotificationMessage('');
    setSelectedStudents([]);
  };

  const texts = {
    title: isRTL ? 'لوحة المشرف الأكاديمي' : 'Advisor Dashboard',
    subtitle: isRTL ? 'نظام الإنذار المبكر ومتابعة الطلاب' : 'Early Warning System & Student Monitoring',
    overview: isRTL ? 'نظرة عامة' : 'Overview',
    students: isRTL ? 'الطلاب' : 'Students',
    analytics: isRTL ? 'التحليلات' : 'Analytics',
    totalStudents: isRTL ? 'إجمالي الطلاب' : 'Total Students',
    atRisk: isRTL ? 'معرضون للخطر' : 'At Risk',
    needsAttention: isRTL ? 'يحتاجون انتباه' : 'Needs Attention',
    onTrack: isRTL ? 'على المسار الصحيح' : 'On Track',
    search: isRTL ? 'بحث عن طالب...' : 'Search students...',
    allRiskLevels: isRTL ? 'جميع مستويات الخطر' : 'All Risk Levels',
    allDepartments: isRTL ? 'جميع الأقسام' : 'All Departments',
    sendNotification: isRTL ? 'إرسال إشعار' : 'Send Notification',
    selectedStudents: isRTL ? 'الطلاب المحددون' : 'Selected Students',
    gpa: isRTL ? 'المعدل' : 'GPA',
    attendance: isRTL ? 'الحضور' : 'Attendance',
    riskFactors: isRTL ? 'عوامل الخطر' : 'Risk Factors',
    interventions: isRTL ? 'التدخلات المقترحة' : 'Suggested Interventions',
    contact: isRTL ? 'معلومات التواصل' : 'Contact Info',
    performance: isRTL ? 'الأداء الأكاديمي' : 'Academic Performance',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    gpaHistory: isRTL ? 'تاريخ المعدل' : 'GPA History',
    courses: isRTL ? 'المقررات' : 'Courses',
    failing: isRTL ? 'راسب' : 'Failing',
    message: isRTL ? 'الرسالة' : 'Message',
    send: isRTL ? 'إرسال' : 'Send',
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              {texts.title}
            </h1>
            <p className="text-muted-foreground">{texts.subtitle}</p>
          </div>
          {selectedStudents.length > 0 && (
            <Button onClick={() => setShowNotificationDialog(true)} className="gap-2">
              <Bell className="h-4 w-4" />
              {texts.sendNotification} ({selectedStudents.length})
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-xs text-muted-foreground">{texts.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{riskCounts.high}</p>
                  <p className="text-xs text-muted-foreground">{texts.atRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{riskCounts.medium}</p>
                  <p className="text-xs text-muted-foreground">{texts.needsAttention}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{riskCounts.low}</p>
                  <p className="text-xs text-muted-foreground">{texts.onTrack}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              {texts.students}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {texts.analytics}
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={texts.search}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder={texts.allRiskLevels} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{texts.allRiskLevels}</SelectItem>
                      <SelectItem value="high">{isRTL ? 'خطر عالي' : 'High Risk'}</SelectItem>
                      <SelectItem value="medium">{isRTL ? 'خطر متوسط' : 'Medium Risk'}</SelectItem>
                      <SelectItem value="low">{isRTL ? 'خطر منخفض' : 'Low Risk'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder={texts.allDepartments} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{texts.allDepartments}</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            <div className="space-y-3">
              {filteredStudents.map(student => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`transition-all ${
                    student.riskLevel === 'high' ? 'border-red-300 dark:border-red-800' :
                    student.riskLevel === 'medium' ? 'border-yellow-300 dark:border-yellow-800' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {isRTL ? student.nameAr : student.name}
                                {getRiskBadge(student.riskLevel)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {student.studentId} • {isRTL ? student.departmentAr : student.department}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              {texts.viewDetails}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{texts.gpa}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${
                                  student.gpa < 2.0 ? 'text-red-500' :
                                  student.gpa < 2.5 ? 'text-yellow-500' : 'text-green-500'
                                }`}>
                                  {student.gpa.toFixed(2)}
                                </span>
                                {student.gpa < student.previousGpa ? (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                ) : (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{texts.attendance}</p>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${
                                  student.attendanceRate < 70 ? 'text-red-500' :
                                  student.attendanceRate < 85 ? 'text-yellow-500' : 'text-green-500'
                                }`}>
                                  {student.attendanceRate}%
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{texts.courses}</p>
                              <span>{student.enrolledCourses}</span>
                              {student.failingCourses > 0 && (
                                <Badge variant="destructive" className="ms-2 text-xs">
                                  {student.failingCourses} {texts.failing}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {student.riskFactors.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {student.riskFactors.slice(0, 3).map((factor, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                              {student.riskFactors.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{student.riskFactors.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{isRTL ? 'توزيع مستويات الخطر' : 'Risk Level Distribution'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{isRTL ? 'متوسط المعدل حسب القسم' : 'Average GPA by Department'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'IT', gpa: 2.4 },
                        { name: 'Telecom', gpa: 2.6 },
                        { name: 'Biomedical', gpa: 2.8 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 4]} />
                        <Tooltip />
                        <Bar dataKey="gpa" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Student Detail Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isRTL ? selectedStudent.nameAr : selectedStudent.name}
                    {getRiskBadge(selectedStudent.riskLevel)}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedStudent.studentId} • {isRTL ? selectedStudent.departmentAr : selectedStudent.department}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className={`text-2xl font-bold ${
                        selectedStudent.gpa < 2.0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {selectedStudent.gpa.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{texts.gpa}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className={`text-2xl font-bold ${
                        selectedStudent.attendanceRate < 70 ? 'text-red-500' : ''
                      }`}>
                        {selectedStudent.attendanceRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">{texts.attendance}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-2xl font-bold">{selectedStudent.missedAssignments}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'واجبات ناقصة' : 'Missing'}</p>
                    </div>
                  </div>

                  {/* GPA History Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{texts.gpaHistory}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedStudent.gpaHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="semester" fontSize={12} />
                            <YAxis domain={[0, 4]} fontSize={12} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="gpa"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: 'hsl(var(--primary))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Factors */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      {texts.riskFactors}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.riskFactors.map((factor, i) => (
                        <Badge key={i} variant="destructive">{factor}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interventions */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      {texts.interventions}
                    </h4>
                    <ul className="space-y-2">
                      {interventions[selectedStudent.riskLevel].map((intervention, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {isRTL ? intervention.ar : intervention.en}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contact */}
                  <div>
                    <h4 className="font-medium mb-2">{texts.contact}</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {selectedStudent.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        {selectedStudent.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2">
                      <Mail className="h-4 w-4" />
                      {isRTL ? 'إرسال بريد' : 'Send Email'}
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {isRTL ? 'جدولة اجتماع' : 'Schedule Meeting'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Batch Notification Dialog */}
        <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{texts.sendNotification}</DialogTitle>
              <DialogDescription>
                {isRTL
                  ? `إرسال إشعار إلى ${selectedStudents.length} طالب`
                  : `Send notification to ${selectedStudents.length} students`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{texts.message}</label>
                <Textarea
                  value={notificationMessage}
                  onChange={e => setNotificationMessage(e.target.value)}
                  placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSendNotification} className="gap-2">
                  <Send className="h-4 w-4" />
                  {texts.send}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
