import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { motion } from 'framer-motion';
import { Search, ZoomIn, ZoomOut, Maximize2, Info, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguageStore } from '@/stores/languageStore';

// Mock course data
const mockCourses = [
  { id: '1', code: 'CS101', name: 'مبادئ البرمجة', nameEn: 'Programming Fundamentals', department: 'IT', year: 1, credits: 3, color: '#1E3A8A' },
  { id: '2', code: 'CS102', name: 'هياكل البيانات', nameEn: 'Data Structures', department: 'IT', year: 2, credits: 3, color: '#1E3A8A' },
  { id: '3', code: 'CS201', name: 'الخوارزميات', nameEn: 'Algorithms', department: 'IT', year: 2, credits: 3, color: '#1E3A8A' },
  { id: '4', code: 'CS202', name: 'قواعد البيانات', nameEn: 'Databases', department: 'IT', year: 2, credits: 3, color: '#14B8A6' },
  { id: '5', code: 'CS301', name: 'هندسة البرمجيات', nameEn: 'Software Engineering', department: 'IT', year: 3, credits: 3, color: '#14B8A6' },
  { id: '6', code: 'CS302', name: 'الشبكات الحاسوبية', nameEn: 'Computer Networks', department: 'IT', year: 3, credits: 3, color: '#8B5CF6' },
  { id: '7', code: 'CS303', name: 'أنظمة التشغيل', nameEn: 'Operating Systems', department: 'IT', year: 3, credits: 3, color: '#8B5CF6' },
  { id: '8', code: 'CS401', name: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', department: 'IT', year: 4, credits: 3, color: '#F59E0B' },
  { id: '9', code: 'CS402', name: 'تعلم الآلة', nameEn: 'Machine Learning', department: 'IT', year: 4, credits: 3, color: '#F59E0B' },
  { id: '10', code: 'MATH101', name: 'التحليل الرياضي', nameEn: 'Calculus', department: 'Math', year: 1, credits: 4, color: '#EC4899' },
  { id: '11', code: 'MATH201', name: 'الجبر الخطي', nameEn: 'Linear Algebra', department: 'Math', year: 2, credits: 3, color: '#EC4899' },
  { id: '12', code: 'CS304', name: 'أمن المعلومات', nameEn: 'Information Security', department: 'IT', year: 3, credits: 3, color: '#EF4444' },
];

const mockPrerequisites = [
  { from: '1', to: '2' },
  { from: '2', to: '3' },
  { from: '2', to: '4' },
  { from: '3', to: '5' },
  { from: '4', to: '5' },
  { from: '1', to: '6' },
  { from: '1', to: '7' },
  { from: '3', to: '8' },
  { from: '8', to: '9' },
  { from: '11', to: '8' },
  { from: '10', to: '11' },
  { from: '6', to: '12' },
];

interface Course {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  department: string;
  year: number;
  credits: number;
  color: string;
}

export default function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const { t, language } = useLanguageStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter courses
    let filteredCourses = mockCourses;
    if (selectedDepartment !== 'all') {
      filteredCourses = filteredCourses.filter(c => c.department === selectedDepartment);
    }
    if (selectedYear !== 'all') {
      filteredCourses = filteredCourses.filter(c => c.year === parseInt(selectedYear));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredCourses = filteredCourses.filter(
        c => c.name.includes(query) || c.nameEn.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
      );
    }

    const filteredIds = new Set(filteredCourses.map(c => c.id));

    // Create nodes as plain array
    const nodes = filteredCourses.map(course => ({
      id: course.id,
      label: language === 'ar' ? course.name : course.nameEn,
      title: `${course.code}\n${language === 'ar' ? course.name : course.nameEn}`,
      color: {
        background: course.color,
        border: course.color,
        highlight: { background: course.color, border: '#fff' },
      },
      font: { color: '#fff', size: 12, face: 'Cairo' },
      shape: 'box' as const,
      borderWidth: 2,
      borderWidthSelected: 4,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      shadow: true,
    }));

    // Create edges as plain array
    const edges = mockPrerequisites
      .filter(p => filteredIds.has(p.from) && filteredIds.has(p.to))
      .map((prereq, i) => ({
        id: `e${i}`,
        from: prereq.from,
        to: prereq.to,
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        color: { color: '#94a3b8', highlight: '#14B8A6' },
        width: 2,
        smooth: { enabled: true, type: 'cubicBezier', roundness: 0.5 },
      }));

    // Network options
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'UD' as const,
          sortMethod: 'directed' as const,
          levelSeparation: 120,
          nodeSpacing: 180,
        },
      },
      physics: {
        enabled: false,
      },
      interaction: {
        hover: true,
        navigationButtons: false,
        keyboard: true,
        zoomView: true,
        dragView: true,
      },
      nodes: {
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        smooth: true,
      },
    };

    // Create network
    networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

    // Handle click
    networkRef.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const courseId = params.nodes[0];
        const course = mockCourses.find(c => c.id === courseId);
        if (course) {
          setSelectedCourse(course);
          setShowDialog(true);
        }
      }
    });

    return () => {
      networkRef.current?.destroy();
    };
  }, [searchQuery, selectedDepartment, selectedYear, language]);

  const handleZoomIn = () => {
    const scale = networkRef.current?.getScale() || 1;
    networkRef.current?.moveTo({ scale: scale * 1.3 });
  };

  const handleZoomOut = () => {
    const scale = networkRef.current?.getScale() || 1;
    networkRef.current?.moveTo({ scale: scale / 1.3 });
  };

  const handleFit = () => {
    networkRef.current?.fit({ animation: true });
  };

  const getPrerequisites = (courseId: string) => {
    return mockPrerequisites
      .filter(p => p.to === courseId)
      .map(p => mockCourses.find(c => c.id === p.from))
      .filter(Boolean) as Course[];
  };

  const getUnlocks = (courseId: string) => {
    return mockPrerequisites
      .filter(p => p.from === courseId)
      .map(p => mockCourses.find(c => c.id === p.to))
      .filter(Boolean) as Course[];
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b border-border bg-background p-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold text-foreground md:text-2xl">
                {t('خريطة المعرفة', 'Knowledge Graph')}
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleFit}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                <Input
                  placeholder={t('ابحث عن مقرر...', 'Search for a course...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 rtl:pl-10 rtl:pr-3"
                />
              </div>
              
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('القسم', 'Department')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('جميع الأقسام', 'All Departments')}</SelectItem>
                  <SelectItem value="IT">{t('المعلوماتية', 'IT')}</SelectItem>
                  <SelectItem value="Math">{t('الرياضيات', 'Math')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('السنة', 'Year')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('جميع السنوات', 'All Years')}</SelectItem>
                  <SelectItem value="1">{t('السنة 1', 'Year 1')}</SelectItem>
                  <SelectItem value="2">{t('السنة 2', 'Year 2')}</SelectItem>
                  <SelectItem value="3">{t('السنة 3', 'Year 3')}</SelectItem>
                  <SelectItem value="4">{t('السنة 4', 'Year 4')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="relative flex-1 bg-muted/30">
          <div ref={containerRef} className="h-full w-full" />
          
          {/* Legend */}
          <Card className="absolute bottom-4 right-4 rtl:left-4 rtl:right-auto w-48 opacity-90">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                {t('دليل الألوان', 'Color Guide')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#1E3A8A]" />
                <span>{t('أساسيات', 'Fundamentals')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#14B8A6]" />
                <span>{t('تطوير', 'Development')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#8B5CF6]" />
                <span>{t('أنظمة', 'Systems')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#F59E0B]" />
                <span>{t('ذكاء اصطناعي', 'AI')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#EC4899]" />
                <span>{t('رياضيات', 'Math')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Detail Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            {selectedCourse && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: selectedCourse.color }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {language === 'ar' ? selectedCourse.name : selectedCourse.nameEn}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {t(`السنة ${selectedCourse.year}`, `Year ${selectedCourse.year}`)}
                    </Badge>
                    <Badge variant="outline">
                      {selectedCourse.credits} {t('ساعات', 'credits')}
                    </Badge>
                    <Badge>{selectedCourse.department}</Badge>
                  </div>

                  {/* Prerequisites */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-foreground">
                      {t('المتطلبات المسبقة', 'Prerequisites')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getPrerequisites(selectedCourse.id).length > 0 ? (
                        getPrerequisites(selectedCourse.id).map((course) => (
                          <Badge key={course.id} variant="outline" className="text-xs">
                            {course.code}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('لا يوجد متطلبات', 'No prerequisites')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unlocks */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-foreground">
                      {t('يفتح المقررات', 'Unlocks Courses')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getUnlocks(selectedCourse.id).length > 0 ? (
                        getUnlocks(selectedCourse.id).map((course) => (
                          <Badge key={course.id} variant="outline" className="text-xs">
                            {course.code}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('لا يوجد مقررات تالية', 'No following courses')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
