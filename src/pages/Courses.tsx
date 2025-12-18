import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { Search, BookOpen, Clock, Users, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  credits: number;
  department: string;
  year_level: number;
  semester: string | null;
  difficulty_rating: number | null;
  is_active: boolean;
}

export default function Courses() {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('year_level', { ascending: true });
      
      if (error) throw error;
      return data as Course[];
    }
  });

  const departments = [...new Set(courses.map(c => c.department))];
  const years = [...new Set(courses.map(c => c.year_level))].sort();

  const filteredCourses = courses.filter(course => {
    const name = isRTL && course.name_ar ? course.name_ar : course.name;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || course.department === selectedDepartment;
    const matchesYear = selectedYear === 'all' || course.year_level === parseInt(selectedYear);
    return matchesSearch && matchesDepartment && matchesYear;
  });

  const getDifficultyColor = (rating: number | null) => {
    if (!rating) return 'bg-muted';
    if (rating <= 2) return 'bg-green-500';
    if (rating <= 3.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyText = (rating: number | null) => {
    if (!rating) return isRTL ? 'غير محدد' : 'N/A';
    if (rating <= 2) return isRTL ? 'سهل' : 'Easy';
    if (rating <= 3.5) return isRTL ? 'متوسط' : 'Medium';
    return isRTL ? 'صعب' : 'Hard';
  };

  const texts = {
    title: isRTL ? 'المقررات الدراسية' : 'Courses',
    subtitle: isRTL ? 'استعرض جميع المقررات المتاحة' : 'Browse all available courses',
    search: isRTL ? 'ابحث عن مقرر...' : 'Search courses...',
    allDepartments: isRTL ? 'جميع الأقسام' : 'All Departments',
    allYears: isRTL ? 'جميع السنوات' : 'All Years',
    year: isRTL ? 'السنة' : 'Year',
    credits: isRTL ? 'ساعات' : 'Credits',
    difficulty: isRTL ? 'الصعوبة' : 'Difficulty',
    prerequisites: isRTL ? 'المتطلبات السابقة' : 'Prerequisites',
    description: isRTL ? 'الوصف' : 'Description',
    enroll: isRTL ? 'تسجيل' : 'Enroll',
    enrolled: isRTL ? 'مسجل' : 'Enrolled',
    noResults: isRTL ? 'لا توجد نتائج' : 'No results found',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {filteredCourses.length} {isRTL ? 'مقرر' : 'courses'}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={texts.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder={texts.allYears} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allYears}</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {texts.year} {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{texts.noResults}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <Dialog key={course.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="text-xs">
                          {course.code}
                        </Badge>
                        <Badge className={`${getDifficultyColor(course.difficulty_rating)} text-white text-xs`}>
                          {getDifficultyText(course.difficulty_rating)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {isRTL && course.name_ar ? course.name_ar : course.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {isRTL && course.description_ar ? course.description_ar : course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.credits} {texts.credits}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{texts.year} {course.year_level}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Badge variant="secondary" className="text-xs">
                          {course.department}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{course.code}</Badge>
                      <Badge className={`${getDifficultyColor(course.difficulty_rating)} text-white`}>
                        {getDifficultyText(course.difficulty_rating)}
                      </Badge>
                    </div>
                    <DialogTitle className="text-xl">
                      {isRTL && course.name_ar ? course.name_ar : course.name}
                    </DialogTitle>
                    <DialogDescription>
                      {course.department} • {texts.year} {course.year_level}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{texts.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        {isRTL && course.description_ar ? course.description_ar : course.description || (isRTL ? 'لا يوجد وصف' : 'No description available')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{course.credits} {texts.credits}</span>
                      </div>
                      {course.semester && (
                        <Badge variant="secondary">{course.semester}</Badge>
                      )}
                    </div>
                    <Button className="w-full">{texts.enroll}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
