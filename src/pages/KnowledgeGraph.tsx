import { useEffect, useRef, useState, useMemo } from 'react';
import { Network, Options } from 'vis-network/standalone';
import { motion } from 'framer-motion';
import { Search, ZoomIn, ZoomOut, Maximize2, Info, BookOpen, Route, Loader2, GraduationCap, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useGraphQuery } from '@/hooks/api/useGraphQuery';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GraphNode {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department: string;
  year_level: number;
  semester?: number;
  hours_theory?: number;
  hours_lab?: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'REQUIRES';
}

interface Major {
  id: string;
  name: string;
  name_en: string;
  description?: string;
  total_credits?: number;
  duration_years?: number;
}

// Color palette for year levels - vibrant and distinct
const yearColors: Record<number, string> = {
  1: '#3B82F6', // Blue - Year 1
  2: '#10B981', // Green - Year 2
  3: '#F59E0B', // Amber - Year 3
  4: '#EF4444', // Red - Year 4
  5: '#8B5CF6', // Purple - Year 5
};

// Color palette for course types based on code prefix
const courseTypeColors: Record<string, { bg: string; border: string; label: string; label_ar: string }> = {
  'CIFC': { bg: '#1E3A8A', border: '#3B82F6', label: 'Core/Foundation', label_ar: 'أساسية' },
  'CIEC': { bg: '#065F46', border: '#10B981', label: 'Software Engineering', label_ar: 'هندسة برمجيات' },
  'CIAC': { bg: '#7C2D12', border: '#F97316', label: 'AI & Data Science', label_ar: 'ذكاء صنعي' },
  'CISC': { bg: '#701A75', border: '#D946EF', label: 'Security', label_ar: 'أمن' },
  'CICC': { bg: '#0E7490', border: '#06B6D4', label: 'Communications', label_ar: 'اتصالات' },
  'CIRC': { bg: '#B45309', border: '#FBBF24', label: 'Robotics', label_ar: 'روبوت' },
  'CIUR': { bg: '#6B7280', border: '#9CA3AF', label: 'University Req', label_ar: 'متطلبات جامعة' },
  'CIFR': { bg: '#4B5563', border: '#9CA3AF', label: 'Faculty Req', label_ar: 'متطلبات كلية' },
  'CIEE': { bg: '#1F2937', border: '#6B7280', label: 'Elective', label_ar: 'اختياري' },
};

const getCourseTypeColor = (code: string): { bg: string; border: string } => {
  const prefix = code.substring(0, 4);
  return courseTypeColors[prefix] || { bg: '#374151', border: '#6B7280' };
};

export default function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<GraphNode | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[]; major?: Major } | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [prerequisites, setPrerequisites] = useState<GraphNode[]>([]);
  const [dependents, setDependents] = useState<GraphNode[]>([]);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'semester'>('hierarchy');

  const { getMajorsList, getMajorGraph, getFullGraph, getPrerequisites, getDependents, isLoading, error } = useGraphQuery();

  const t = (ar: string, en: string) => isRTL ? ar : en;

  // Load majors list on mount
  useEffect(() => {
    const loadMajors = async () => {
      const result = await getMajorsList();
      if (result?.majors) {
        setMajors(result.majors);
        // Auto-select first major
        if (result.majors.length > 0 && !selectedMajor) {
          setSelectedMajor(result.majors[0].id);
        }
      }
    };
    loadMajors();
  }, []);

  // Load graph data when major changes
  useEffect(() => {
    const loadGraph = async () => {
      if (!selectedMajor) {
        // Load full graph if no major selected
        const result = await getFullGraph();
        if (result) {
          setGraphData({ nodes: result.nodes, edges: result.edges });
        }
        return;
      }

      const result = await getMajorGraph(selectedMajor);
      if (result) {
        setGraphData({ nodes: result.nodes, edges: result.edges, major: result.major || undefined });
      }
    };
    loadGraph();
  }, [selectedMajor]);

  // Calculate course statistics
  const stats = useMemo(() => {
    if (!graphData) return null;
    
    const nodes = graphData.nodes;
    const totalCredits = nodes.reduce((sum, n) => sum + n.credits, 0);
    const byYear = nodes.reduce((acc, n) => {
      acc[n.year_level] = (acc[n.year_level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return {
      totalCourses: nodes.length,
      totalCredits,
      totalEdges: graphData.edges.length,
      byYear
    };
  }, [graphData]);

  // Filter nodes for visualization
  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    
    let nodes = graphData.nodes;
    
    if (selectedYear !== 'all') {
      nodes = nodes.filter(c => c.year_level === parseInt(selectedYear));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(
        c => c.name?.toLowerCase().includes(query) || 
             c.name_ar?.includes(query) || 
             c.code?.toLowerCase().includes(query)
      );
    }
    
    return nodes;
  }, [graphData, selectedYear, searchQuery]);

  // Render network
  useEffect(() => {
    if (!containerRef.current || !graphData || filteredNodes.length === 0) return;

    const filteredIds = new Set(filteredNodes.map(c => c.id));

    // Create vis-network nodes with enhanced styling
    const nodes = filteredNodes.map(course => {
      const typeColor = getCourseTypeColor(course.code);
      const yearColor = yearColors[course.year_level] || '#6B7280';
      
      return {
        id: course.id,
        label: `${course.code}\n${isRTL ? (course.name_ar || course.name) : course.name}`,
        title: `
          <div style="direction: ${isRTL ? 'rtl' : 'ltr'}; padding: 8px; font-family: system-ui;">
            <strong>${course.code}</strong><br/>
            ${isRTL ? (course.name_ar || course.name) : course.name}<br/>
            <span style="color: #888;">${course.credits} ${t('ساعات معتمدة', 'credits')}</span><br/>
            <span style="color: #888;">${t('السنة', 'Year')} ${course.year_level}</span>
          </div>
        `,
        color: {
          background: typeColor.bg,
          border: yearColor,
          highlight: { background: typeColor.bg, border: '#fff' },
          hover: { background: typeColor.bg, border: '#fff' },
        },
        font: { 
          color: '#fff', 
          size: 11, 
          face: 'system-ui, Cairo, sans-serif',
          multi: 'html'
        },
        shape: 'box',
        borderWidth: 3,
        borderWidthSelected: 5,
        margin: { top: 8, right: 12, bottom: 8, left: 12 },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.3)',
          size: 10,
          x: 2,
          y: 2
        },
        level: viewMode === 'hierarchy' ? course.year_level : (course.semester || course.year_level * 2),
      };
    });

    // Create vis-network edges
    const edges = graphData.edges
      .filter(e => filteredIds.has(e.from))
      .map((edge, i) => ({
        id: `e${i}`,
        from: edge.from,
        to: edge.to,
        arrows: { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' } },
        color: { 
          color: 'rgba(148, 163, 184, 0.6)', 
          highlight: '#14B8A6',
          hover: '#14B8A6'
        },
        width: 1.5,
        smooth: { 
          enabled: true, 
          type: 'cubicBezier' as const, 
          roundness: 0.4,
          forceDirection: 'vertical'
        },
        hoverWidth: 2.5,
      }));

    // Network options
    const options: Options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'UD',
          sortMethod: 'directed',
          levelSeparation: 150,
          nodeSpacing: 200,
          treeSpacing: 250,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
        },
      },
      physics: {
        enabled: false,
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: false,
        keyboard: {
          enabled: true,
          bindToWindow: false
        },
        zoomView: true,
        dragView: true,
        dragNodes: true,
        multiselect: false,
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
    networkRef.current.on('click', async (params) => {
      if (params.nodes.length > 0) {
        const courseId = params.nodes[0];
        const course = graphData.nodes.find(c => c.id === courseId);
        if (course) {
          setSelectedCourse(course);
          
          // Load prerequisites and dependents
          const [prereqResult, depResult] = await Promise.all([
            getPrerequisites(course.code),
            getDependents(course.code)
          ]);
          
          setPrerequisites(prereqResult?.prerequisites || []);
          setDependents(depResult?.dependents || []);
          setShowDialog(true);
        }
      }
    });

    // Fit to view after rendering
    setTimeout(() => {
      networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }, 100);

    return () => {
      networkRef.current?.destroy();
    };
  }, [graphData, filteredNodes, isRTL, viewMode]);

  const handleZoomIn = () => {
    const scale = networkRef.current?.getScale() || 1;
    networkRef.current?.moveTo({ scale: scale * 1.3, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
  };

  const handleZoomOut = () => {
    const scale = networkRef.current?.getScale() || 1;
    networkRef.current?.moveTo({ scale: scale / 1.3, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
  };

  const handleFit = () => {
    networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
  };

  const selectedMajorData = majors.find(m => m.id === selectedMajor);

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b border-border bg-background p-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white"
                  animate={{
                    boxShadow: [
                      '0 0 10px hsl(var(--secondary) / 0.3)',
                      '0 0 25px hsl(var(--secondary) / 0.5)',
                      '0 0 10px hsl(var(--secondary) / 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Route className="h-6 w-6" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-foreground md:text-2xl">
                    {t('خريطة المعرفة', 'Knowledge Graph')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedMajorData 
                      ? (isRTL ? selectedMajorData.name : selectedMajorData.name_en)
                      : t('شجرة المتطلبات المسبقة التفاعلية', 'Interactive prerequisites tree')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomIn} title={t('تكبير', 'Zoom In')}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut} title={t('تصغير', 'Zoom Out')}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleFit} title={t('ملائمة', 'Fit')}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Major/Specialization Select */}
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger className="w-[280px]">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('اختر التخصص', 'Select Major')} />
                </SelectTrigger>
                <SelectContent>
                  {majors.map(major => (
                    <SelectItem key={major.id} value={major.id}>
                      {isRTL ? major.name : major.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('ابحث عن مقرر...', 'Search for a course...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10"
                />
              </div>

              {/* Year Filter */}
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
                  <SelectItem value="5">{t('السنة 5', 'Year 5')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="relative flex-1 bg-gradient-to-br from-muted/30 to-muted/10">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-muted-foreground">
                  {t('جاري تحميل الرسم البياني...', 'Loading graph...')}
                </p>
              </div>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">
                  {t('لا توجد مقررات مطابقة', 'No matching courses')}
                </p>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className="h-full w-full" />
          )}
          
          {/* Legend Card */}
          <Card className="absolute bottom-4 end-4 w-56 bg-background/95 backdrop-blur shadow-lg">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                {t('دليل الألوان', 'Color Guide')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 pt-0">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('حسب السنة (الحدود)', 'By Year (Border)')}</p>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map(year => (
                    <div key={year} className="text-center">
                      <div 
                        className="mx-auto h-4 w-4 rounded-sm border-2" 
                        style={{ borderColor: yearColors[year], backgroundColor: 'transparent' }}
                      />
                      <span className="text-[10px] text-muted-foreground">{year}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('نوع المقرر', 'Course Type')}</p>
                <div className="space-y-1">
                  {Object.entries(courseTypeColors).slice(0, 5).map(([prefix, colors]) => (
                    <div key={prefix} className="flex items-center gap-2 text-xs">
                      <div 
                        className="h-3 w-3 rounded-sm" 
                        style={{ backgroundColor: colors.bg }}
                      />
                      <span className="text-muted-foreground">
                        {isRTL ? colors.label_ar : colors.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Badge */}
          {stats && (
            <div className="absolute top-4 start-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                {stats.totalCourses} {t('مقرر', 'courses')}
              </Badge>
              <Badge variant="outline" className="bg-background/90 backdrop-blur">
                {stats.totalCredits} {t('ساعة', 'credits')}
              </Badge>
              <Badge variant="outline" className="bg-background/90 backdrop-blur">
                {stats.totalEdges} {t('علاقة', 'relations')}
              </Badge>
            </div>
          )}

          {/* Major Info Card */}
          {selectedMajorData && graphData?.major && (
            <Card className="absolute top-4 end-4 w-64 bg-background/95 backdrop-blur shadow-lg">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm">
                  {isRTL ? selectedMajorData.name : selectedMajorData.name_en}
                </CardTitle>
                <CardDescription className="text-xs">
                  {graphData.major.duration_years} {t('سنوات', 'years')} • {graphData.major.total_credits} {t('ساعة', 'credits')}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Course Detail Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            {selectedCourse && (
              <>
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                      style={{ backgroundColor: getCourseTypeColor(selectedCourse.code).bg }}
                    >
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold truncate">
                        {isRTL ? (selectedCourse.name_ar || selectedCourse.name) : selectedCourse.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-4 py-2">
                    {/* Course Info Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        className="text-white" 
                        style={{ backgroundColor: yearColors[selectedCourse.year_level] }}
                      >
                        {t(`السنة ${selectedCourse.year_level}`, `Year ${selectedCourse.year_level}`)}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        {selectedCourse.credits} {t('ساعات', 'credits')}
                      </Badge>
                      {selectedCourse.hours_theory && (
                        <Badge variant="secondary">
                          {selectedCourse.hours_theory} {t('نظري', 'theory')}
                        </Badge>
                      )}
                      {selectedCourse.hours_lab && (
                        <Badge variant="secondary">
                          {selectedCourse.hours_lab} {t('عملي', 'lab')}
                        </Badge>
                      )}
                    </div>

                    {/* Prerequisites */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ArrowRight className="h-4 w-4 rotate-180 text-primary" />
                        {t('المتطلبات المسبقة', 'Prerequisites')}
                        {prerequisites.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{prerequisites.length}</Badge>
                        )}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {prerequisites.length > 0 ? (
                          prerequisites.map((course) => (
                            <Badge 
                              key={course.id} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-muted"
                              style={{ borderColor: getCourseTypeColor(course.code).border }}
                            >
                              {course.code}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            {t('لا يوجد متطلبات مسبقة', 'No prerequisites')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dependents */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        {t('يفتح المقررات', 'Unlocks Courses')}
                        {dependents.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{dependents.length}</Badge>
                        )}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {dependents.length > 0 ? (
                          dependents.map((course) => (
                            <Badge 
                              key={course.id} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-muted"
                              style={{ borderColor: getCourseTypeColor(course.code).border }}
                            >
                              {course.code}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            {t('لا يوجد مقررات تالية', 'No following courses')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
