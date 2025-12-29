import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { motion } from 'framer-motion';
import { Search, ZoomIn, ZoomOut, Maximize2, Info, BookOpen, Route, Loader2 } from 'lucide-react';
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
import { useGraphQuery } from '@/hooks/api/useGraphQuery';
import { useToast } from '@/hooks/use-toast';

interface GraphNode {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department: string;
  year_level: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'REQUIRES';
}

// Color mapping for departments
const departmentColors: Record<string, string> = {
  'IT': '#1E3A8A',
  'Informatics': '#1E3A8A',
  'المعلوماتية': '#1E3A8A',
  'Math': '#EC4899',
  'الرياضيات': '#EC4899',
  'Communications': '#14B8A6',
  'الاتصالات': '#14B8A6',
  'Civil': '#F59E0B',
  'المدنية': '#F59E0B',
  'Architecture': '#8B5CF6',
  'العمارة': '#8B5CF6',
  'default': '#6B7280',
};

// Year level colors
const yearColors: Record<number, string> = {
  1: '#3B82F6',
  2: '#10B981',
  3: '#F59E0B',
  4: '#EF4444',
  5: '#8B5CF6',
};

export default function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<GraphNode | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [prerequisites, setPrerequisites] = useState<GraphNode[]>([]);
  const [dependents, setDependents] = useState<GraphNode[]>([]);

  const { getFullGraph, getPrerequisites, getDependents, isLoading, error } = useGraphQuery();

  const t = (ar: string, en: string) => isRTL ? ar : en;

  // Load graph data
  useEffect(() => {
    const loadGraph = async () => {
      const result = await getFullGraph(selectedDepartment !== 'all' ? selectedDepartment : undefined);
      if (result) {
        setGraphData({ nodes: result.nodes, edges: result.edges });
      }
    };
    loadGraph();
  }, [selectedDepartment]);

  // Render network
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Filter nodes
    let filteredNodes = graphData.nodes;
    if (selectedYear !== 'all') {
      filteredNodes = filteredNodes.filter(c => c.year_level === parseInt(selectedYear));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(
        c => c.name?.toLowerCase().includes(query) || 
             c.name_ar?.includes(query) || 
             c.code?.toLowerCase().includes(query)
      );
    }

    const filteredIds = new Set(filteredNodes.map(c => c.id));

    // Create vis-network nodes
    const nodes = filteredNodes.map(course => {
      const color = departmentColors[course.department] || yearColors[course.year_level] || departmentColors.default;
      return {
        id: course.id,
        label: isRTL ? (course.name_ar || course.name) : course.name,
        title: `${course.code}\n${isRTL ? (course.name_ar || course.name) : course.name}\n${course.credits} ${t('ساعات', 'credits')}`,
        color: {
          background: color,
          border: color,
          highlight: { background: color, border: '#fff' },
        },
        font: { color: '#fff', size: 12, face: 'Cairo, sans-serif' },
        shape: 'box' as const,
        borderWidth: 2,
        borderWidthSelected: 4,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        shadow: true,
      };
    });

    // Create vis-network edges
    const edges = graphData.edges
      .filter(e => filteredIds.has(e.from) && filteredIds.has(e.to))
      .map((edge, i) => ({
        id: `e${i}`,
        from: edge.from,
        to: edge.to,
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        color: { color: '#94a3b8', highlight: '#14B8A6' },
        width: 2,
        smooth: { enabled: true, type: 'cubicBezier' as const, roundness: 0.5 },
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

    return () => {
      networkRef.current?.destroy();
    };
  }, [graphData, searchQuery, selectedYear, isRTL]);

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

  // Extract unique departments from data
  const departments = graphData 
    ? [...new Set(graphData.nodes.map(n => n.department))]
    : [];

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b border-border bg-background p-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white"
                  animate={{
                    boxShadow: [
                      '0 0 10px hsl(var(--secondary) / 0.3)',
                      '0 0 20px hsl(var(--secondary) / 0.5)',
                      '0 0 10px hsl(var(--secondary) / 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Route className="h-5 w-5" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-foreground md:text-2xl">
                    {t('خريطة المعرفة', 'Knowledge Graph')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t('شجرة المتطلبات المسبقة التفاعلية', 'Interactive prerequisites tree')}
                  </p>
                </div>
              </div>
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
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('ابحث عن مقرر...', 'Search for a course...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10"
                />
              </div>
              
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('القسم', 'Department')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('جميع الأقسام', 'All Departments')}</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
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
                  <SelectItem value="5">{t('السنة 5', 'Year 5')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="relative flex-1 bg-muted/30">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                {t('جاري تحميل الرسم البياني...', 'Loading graph...')}
              </span>
            </div>
          ) : (
            <div ref={containerRef} className="h-full w-full" />
          )}
          
          {/* Legend */}
          <Card className="absolute bottom-4 end-4 w-48 opacity-90">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                {t('دليل الألوان', 'Color Guide')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#3B82F6]" />
                <span>{t('السنة 1', 'Year 1')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#10B981]" />
                <span>{t('السنة 2', 'Year 2')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#F59E0B]" />
                <span>{t('السنة 3', 'Year 3')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#EF4444]" />
                <span>{t('السنة 4', 'Year 4')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-[#8B5CF6]" />
                <span>{t('السنة 5', 'Year 5')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {graphData && (
            <div className="absolute top-4 start-4 flex gap-2">
              <Badge variant="secondary">
                {graphData.nodes.length} {t('مقرر', 'courses')}
              </Badge>
              <Badge variant="outline">
                {graphData.edges.length} {t('علاقة', 'relations')}
              </Badge>
            </div>
          )}
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
                      style={{ backgroundColor: yearColors[selectedCourse.year_level] || '#6B7280' }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {isRTL ? (selectedCourse.name_ar || selectedCourse.name) : selectedCourse.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {t(`السنة ${selectedCourse.year_level}`, `Year ${selectedCourse.year_level}`)}
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
                      {prerequisites.length > 0 ? (
                        prerequisites.map((course) => (
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

                  {/* Dependents */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-foreground">
                      {t('يفتح المقررات', 'Unlocks Courses')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {dependents.length > 0 ? (
                        dependents.map((course) => (
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
