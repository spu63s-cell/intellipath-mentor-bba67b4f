import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, BookOpen, Settings, Shield, Search, Plus, Edit, Trash2, 
  BarChart3, Activity, Database, Bell, Lock, Globe, Palette,
  Download, Upload, RefreshCw, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { toast } from 'sonner';

const Admin = () => {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);

  // Mock data
  const users = [
    { id: 1, name: 'أحمد محمد', email: 'ahmed@spu.edu.sy', role: 'student', status: 'active', department: 'هندسة المعلوماتية', joinDate: '2024-01-15' },
    { id: 2, name: 'سارة علي', email: 'sara@spu.edu.sy', role: 'student', status: 'active', department: 'هندسة الاتصالات', joinDate: '2024-02-20' },
    { id: 3, name: 'د. خالد حسن', email: 'khaled@spu.edu.sy', role: 'advisor', status: 'active', department: 'هندسة المعلوماتية', joinDate: '2023-09-01' },
    { id: 4, name: 'م. فاطمة أحمد', email: 'fatima@spu.edu.sy', role: 'advisor', status: 'inactive', department: 'هندسة العمارة', joinDate: '2023-10-15' },
    { id: 5, name: 'مدير النظام', email: 'admin@spu.edu.sy', role: 'admin', status: 'active', department: 'إدارة النظام', joinDate: '2023-01-01' },
  ];

  const courses = [
    { id: 1, code: 'CS101', name: 'مقدمة في البرمجة', department: 'هندسة المعلوماتية', credits: 3, students: 45, status: 'active' },
    { id: 2, code: 'CS201', name: 'هياكل البيانات', department: 'هندسة المعلوماتية', credits: 3, students: 38, status: 'active' },
    { id: 3, code: 'EE101', name: 'الدارات الكهربائية', department: 'هندسة الاتصالات', credits: 4, students: 52, status: 'active' },
    { id: 4, code: 'AR101', name: 'التصميم المعماري', department: 'هندسة العمارة', credits: 4, students: 30, status: 'inactive' },
  ];

  const stats = [
    { label: 'إجمالي المستخدمين', value: '1,234', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'المقررات النشطة', value: '156', icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'المشرفين', value: '45', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'الجلسات النشطة', value: '89', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const systemSettings = {
    general: [
      { key: 'site_name', label: 'اسم الموقع', value: 'IntelliPath', type: 'text' },
      { key: 'default_language', label: 'اللغة الافتراضية', value: 'ar', type: 'select', options: ['ar', 'en'] },
      { key: 'maintenance_mode', label: 'وضع الصيانة', value: false, type: 'switch' },
    ],
    security: [
      { key: 'two_factor', label: 'المصادقة الثنائية', value: true, type: 'switch' },
      { key: 'session_timeout', label: 'مهلة الجلسة (دقائق)', value: '30', type: 'number' },
      { key: 'max_login_attempts', label: 'محاولات تسجيل الدخول', value: '5', type: 'number' },
    ],
    notifications: [
      { key: 'email_notifications', label: 'إشعارات البريد', value: true, type: 'switch' },
      { key: 'push_notifications', label: 'الإشعارات الفورية', value: true, type: 'switch' },
      { key: 'weekly_reports', label: 'التقارير الأسبوعية', value: false, type: 'switch' },
    ],
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.includes(searchQuery) || user.email.includes(searchQuery);
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const styles = {
      student: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      advisor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    const labels = { student: 'طالب', advisor: 'مشرف', admin: 'مدير' };
    return <Badge variant="outline" className={styles[role as keyof typeof styles]}>{labels[role as keyof typeof labels]}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 ml-1" />نشط</Badge>
      : <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 ml-1" />غير نشط</Badge>;
  };

  const handleDeleteUser = (id: number) => {
    toast.success('تم حذف المستخدم بنجاح');
  };

  const handleDeleteCourse = (id: number) => {
    toast.success('تم حذف المقرر بنجاح');
  };

  return (
    <MainLayout>
      <div className={`min-h-screen p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">لوحة تحكم المدير</h1>
              <p className="text-muted-foreground mt-1">إدارة المستخدمين والمقررات وإعدادات النظام</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير البيانات
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                المقررات
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                الإعدادات
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                السجلات
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle>إدارة المستخدمين</CardTitle>
                      <CardDescription>عرض وإدارة جميع مستخدمي النظام</CardDescription>
                    </div>
                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة مستخدم
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                          <DialogDescription>أدخل بيانات المستخدم الجديد</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>الاسم الكامل</Label>
                            <Input placeholder="أدخل الاسم" />
                          </div>
                          <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input type="email" placeholder="email@spu.edu.sy" />
                          </div>
                          <div className="space-y-2">
                            <Label>الدور</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الدور" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">طالب</SelectItem>
                                <SelectItem value="advisor">مشرف</SelectItem>
                                <SelectItem value="admin">مدير</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>القسم</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر القسم" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cs">هندسة المعلوماتية</SelectItem>
                                <SelectItem value="ee">هندسة الاتصالات</SelectItem>
                                <SelectItem value="arch">هندسة العمارة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>إلغاء</Button>
                          <Button onClick={() => { setIsAddUserOpen(false); toast.success('تم إضافة المستخدم بنجاح'); }}>
                            إضافة
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث عن مستخدم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="student">طلاب</SelectItem>
                        <SelectItem value="advisor">مشرفين</SelectItem>
                        <SelectItem value="admin">مدراء</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Users Table */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-right">المستخدم</TableHead>
                          <TableHead className="text-right">الدور</TableHead>
                          <TableHead className="text-right">القسم</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">تاريخ الانضمام</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell className="text-muted-foreground">{user.department}</TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle>إدارة المقررات</CardTitle>
                      <CardDescription>عرض وإدارة جميع المقررات الدراسية</CardDescription>
                    </div>
                    <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة مقرر
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إضافة مقرر جديد</DialogTitle>
                          <DialogDescription>أدخل بيانات المقرر الجديد</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>رمز المقرر</Label>
                              <Input placeholder="CS101" />
                            </div>
                            <div className="space-y-2">
                              <Label>عدد الساعات</Label>
                              <Input type="number" placeholder="3" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>اسم المقرر</Label>
                            <Input placeholder="أدخل اسم المقرر" />
                          </div>
                          <div className="space-y-2">
                            <Label>القسم</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر القسم" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cs">هندسة المعلوماتية</SelectItem>
                                <SelectItem value="ee">هندسة الاتصالات</SelectItem>
                                <SelectItem value="arch">هندسة العمارة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddCourseOpen(false)}>إلغاء</Button>
                          <Button onClick={() => { setIsAddCourseOpen(false); toast.success('تم إضافة المقرر بنجاح'); }}>
                            إضافة
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-right">رمز المقرر</TableHead>
                          <TableHead className="text-right">اسم المقرر</TableHead>
                          <TableHead className="text-right">القسم</TableHead>
                          <TableHead className="text-right">الساعات</TableHead>
                          <TableHead className="text-right">الطلاب</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => (
                          <TableRow key={course.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono font-medium">{course.code}</TableCell>
                            <TableCell className="font-medium text-foreground">{course.name}</TableCell>
                            <TableCell className="text-muted-foreground">{course.department}</TableCell>
                            <TableCell>{course.credits}</TableCell>
                            <TableCell>{course.students}</TableCell>
                            <TableCell>{getStatusBadge(course.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteCourse(course.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid md:grid-cols-3 gap-6">
                {/* General Settings */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      إعدادات عامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemSettings.general.map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <Label>{setting.label}</Label>
                        {setting.type === 'switch' ? (
                          <Switch defaultChecked={setting.value as boolean} />
                        ) : setting.type === 'select' ? (
                          <Select defaultValue={setting.value as string}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {setting.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt === 'ar' ? 'عربي' : 'English'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input defaultValue={setting.value as string} className="w-32" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-500" />
                      إعدادات الأمان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemSettings.security.map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <Label>{setting.label}</Label>
                        {setting.type === 'switch' ? (
                          <Switch defaultChecked={setting.value as boolean} />
                        ) : (
                          <Input type="number" defaultValue={setting.value as string} className="w-20" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-yellow-500" />
                      إعدادات الإشعارات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemSettings.notifications.map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <Label>{setting.label}</Label>
                        <Switch defaultChecked={setting.value as boolean} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => toast.success('تم حفظ الإعدادات بنجاح')}>
                  حفظ الإعدادات
                </Button>
              </div>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>سجلات النظام</CardTitle>
                  <CardDescription>عرض آخر الأنشطة والأحداث في النظام</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { type: 'info', message: 'تم تسجيل دخول المستخدم ahmed@spu.edu.sy', time: 'منذ 5 دقائق' },
                      { type: 'success', message: 'تم إضافة مقرر جديد CS301', time: 'منذ 15 دقيقة' },
                      { type: 'warning', message: 'محاولة تسجيل دخول فاشلة من IP: 192.168.1.100', time: 'منذ 30 دقيقة' },
                      { type: 'info', message: 'تم تحديث بيانات الطالب #12345', time: 'منذ ساعة' },
                      { type: 'error', message: 'فشل في إرسال إشعار البريد الإلكتروني', time: 'منذ ساعتين' },
                      { type: 'success', message: 'تم إنشاء نسخة احتياطية من قاعدة البيانات', time: 'منذ 3 ساعات' },
                    ].map((log, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        {log.type === 'info' && <Activity className="w-5 h-5 text-blue-500 mt-0.5" />}
                        {log.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                        {log.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />}
                        {log.type === 'error' && <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Admin;
