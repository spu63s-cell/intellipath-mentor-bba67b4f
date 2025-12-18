import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageStore } from '@/stores/languageStore';
import { useCareerPaths, CareerPath } from '@/hooks/useCareerPaths';
import { 
  Briefcase, Target, TrendingUp, BookOpen, Award, ChevronRight, 
  Code, Database, Brain, Palette, Globe, Shield, Rocket, CheckCircle2,
  Network, Heart, Cpu, Loader2
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, any> = {
  code: Code,
  brain: Brain,
  database: Database,
  palette: Palette,
  shield: Shield,
  network: Network,
  heart: Heart,
  cpu: Cpu,
  globe: Globe,
};

const milestones = [
  { id: 1, title: 'Complete Core Courses', titleAr: 'إكمال المقررات الأساسية', completed: true },
  { id: 2, title: 'Build Portfolio Projects', titleAr: 'بناء مشاريع للمحفظة', completed: true },
  { id: 3, title: 'Get Internship', titleAr: 'الحصول على تدريب', completed: false },
  { id: 4, title: 'Earn Certifications', titleAr: 'الحصول على شهادات', completed: false },
  { id: 5, title: 'Land First Job', titleAr: 'الحصول على أول وظيفة', completed: false },
];

interface CareerPathWithProgress extends CareerPath {
  progress: number;
  completedCourses: string[];
}

export default function Career() {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const { careerPaths, isLoading } = useCareerPaths();
  const [selectedPath, setSelectedPath] = useState<CareerPathWithProgress | null>(null);

  const texts = {
    title: isRTL ? 'المسار المهني' : 'Career Planner',
    subtitle: isRTL ? 'خطط لمستقبلك المهني' : 'Plan your career path',
    paths: isRTL ? 'المسارات المهنية' : 'Career Paths',
    roadmap: isRTL ? 'خريطة الطريق' : 'Roadmap',
    skills: isRTL ? 'المهارات' : 'Skills',
    explore: isRTL ? 'استكشف' : 'Explore',
    salary: isRTL ? 'الراتب المتوقع' : 'Expected Salary',
    demand: isRTL ? 'الطلب في السوق' : 'Market Demand',
    high: isRTL ? 'مرتفع' : 'High',
    medium: isRTL ? 'متوسط' : 'Medium',
    low: isRTL ? 'منخفض' : 'Low',
    progress: isRTL ? 'التقدم' : 'Progress',
    requiredCourses: isRTL ? 'المقررات المطلوبة' : 'Required Courses',
    requiredSkills: isRTL ? 'المهارات المطلوبة' : 'Required Skills',
    yourMilestones: isRTL ? 'إنجازاتك' : 'Your Milestones',
    startPath: isRTL ? 'ابدأ هذا المسار' : 'Start This Path',
  };

  const getDemandBadge = (demand: string) => {
    switch (demand) {
      case 'high':
        return <Badge className="bg-green-500">{texts.high}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">{texts.medium}</Badge>;
      default:
        return <Badge className="bg-gray-500">{texts.low}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>

        <Tabs defaultValue="paths" className="space-y-6">
          <TabsList>
            <TabsTrigger value="paths" className="gap-2">
              <Briefcase className="h-4 w-4" />
              {texts.paths}
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-2">
              <Target className="h-4 w-4" />
              {texts.roadmap}
            </TabsTrigger>
          </TabsList>

          {/* Career Paths Tab */}
          <TabsContent value="paths" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {careerPaths.map((path: CareerPathWithProgress) => {
                  const Icon = iconMap[path.icon] || Code;
                  return (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedPath?.id === path.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedPath(path)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl ${path.color}`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            {getDemandBadge(path.demand)}
                          </div>
                          <CardTitle className="mt-4">
                            {isRTL ? path.titleAr : path.title}
                          </CardTitle>
                          <CardDescription>
                            {isRTL ? path.descriptionAr : path.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{texts.progress}</span>
                                <span className="font-medium">{path.progress}%</span>
                              </div>
                              <Progress value={path.progress} className="h-2" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{texts.salary}</span>
                              <span className="font-medium">{path.salaryRange}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Selected Path Details */}
            {selectedPath && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-xl ${selectedPath.color}`}>
                        {(() => {
                          const Icon = iconMap[selectedPath.icon] || Code;
                          return <Icon className="h-8 w-8 text-white" />;
                        })()}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {isRTL ? selectedPath.titleAr : selectedPath.title}
                        </CardTitle>
                        <CardDescription>
                          {isRTL ? selectedPath.descriptionAr : selectedPath.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          {texts.requiredSkills}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(isRTL ? selectedPath.skillsAr : selectedPath.skills).map((skill: string) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {texts.requiredCourses}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPath.courses.map((course: string) => (
                            <Badge 
                              key={course} 
                              variant={selectedPath.completedCourses.includes(course) ? "default" : "outline"}
                              className={selectedPath.completedCourses.includes(course) ? "bg-green-500" : ""}
                            >
                              {selectedPath.completedCourses.includes(course) && (
                                <CheckCircle2 className="h-3 w-3 me-1" />
                              )}
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button className="w-full md:w-auto gap-2">
                      <Rocket className="h-4 w-4" />
                      {texts.startPath}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap">
            <Card>
              <CardHeader>
                <CardTitle>{texts.yourMilestones}</CardTitle>
                <CardDescription>
                  {isRTL ? 'تتبع تقدمك نحو أهدافك المهنية' : 'Track your progress towards career goals'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <motion.div 
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        milestone.completed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        milestone.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {milestone.completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${milestone.completed ? 'text-green-700 dark:text-green-400' : ''}`}>
                          {isRTL ? milestone.titleAr : milestone.title}
                        </p>
                      </div>
                      {!milestone.completed && (
                        <Button variant="outline" size="sm">
                          {isRTL ? 'ابدأ' : 'Start'}
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
