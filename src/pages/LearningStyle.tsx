import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguageStore } from '@/stores/languageStore';
import { 
  Eye, Ear, Hand, BookOpen, CheckCircle2, 
  RotateCcw, Share2, Download, Lightbulb, ArrowRight, ArrowLeft
} from 'lucide-react';

interface Question {
  id: number;
  textAr: string;
  textEn: string;
  options: {
    textAr: string;
    textEn: string;
    type: 'V' | 'A' | 'R' | 'K';
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    textAr: 'عندما تتعلم شيئاً جديداً، تفضل:',
    textEn: 'When learning something new, you prefer:',
    options: [
      { textAr: 'مشاهدة فيديو أو رسوم توضيحية', textEn: 'Watching videos or diagrams', type: 'V' },
      { textAr: 'الاستماع إلى شرح صوتي', textEn: 'Listening to audio explanations', type: 'A' },
      { textAr: 'قراءة الكتب والمقالات', textEn: 'Reading books and articles', type: 'R' },
      { textAr: 'التجربة العملية المباشرة', textEn: 'Hands-on practice', type: 'K' },
    ],
  },
  {
    id: 2,
    textAr: 'عندما تحتاج تذكر معلومة مهمة:',
    textEn: 'When you need to remember important information:',
    options: [
      { textAr: 'أتخيل صورة ذهنية لها', textEn: 'I visualize a mental image', type: 'V' },
      { textAr: 'أكررها بصوت عالٍ', textEn: 'I repeat it out loud', type: 'A' },
      { textAr: 'أكتبها عدة مرات', textEn: 'I write it down multiple times', type: 'R' },
      { textAr: 'أربطها بحركة أو نشاط', textEn: 'I associate it with movement', type: 'K' },
    ],
  },
  {
    id: 3,
    textAr: 'في الامتحانات، تتذكر المعلومات بشكل أفضل عندما:',
    textEn: 'In exams, you remember information better when:',
    options: [
      { textAr: 'رأيتها في جدول أو رسم بياني', textEn: 'You saw it in a table or chart', type: 'V' },
      { textAr: 'سمعتها من المحاضر', textEn: 'You heard it from the lecturer', type: 'A' },
      { textAr: 'قرأتها في الكتاب', textEn: 'You read it in the book', type: 'R' },
      { textAr: 'طبقتها في مختبر أو تمرين', textEn: 'You applied it in a lab or exercise', type: 'K' },
    ],
  },
  {
    id: 4,
    textAr: 'عند حل مشكلة معقدة:',
    textEn: 'When solving a complex problem:',
    options: [
      { textAr: 'أرسم مخططاً توضيحياً', textEn: 'I draw a diagram', type: 'V' },
      { textAr: 'أناقشها مع الآخرين', textEn: 'I discuss it with others', type: 'A' },
      { textAr: 'أقرأ عن حالات مشابهة', textEn: 'I read about similar cases', type: 'R' },
      { textAr: 'أجرب حلولاً مختلفة عملياً', textEn: 'I try different solutions practically', type: 'K' },
    ],
  },
  {
    id: 5,
    textAr: 'أفضل طريقة للمذاكرة بالنسبة لي:',
    textEn: 'My preferred study method is:',
    options: [
      { textAr: 'استخدام خرائط ذهنية ملونة', textEn: 'Using colorful mind maps', type: 'V' },
      { textAr: 'تسجيل المحاضرات وإعادة سماعها', textEn: 'Recording lectures and replaying them', type: 'A' },
      { textAr: 'تلخيص المادة كتابياً', textEn: 'Writing summaries', type: 'R' },
      { textAr: 'حل أكبر عدد من التمارين', textEn: 'Solving as many exercises as possible', type: 'K' },
    ],
  },
];

const styleInfo = {
  V: {
    nameAr: 'بصري',
    nameEn: 'Visual',
    icon: Eye,
    color: 'bg-blue-500',
    descAr: 'تتعلم بشكل أفضل من خلال الصور والرسوم البيانية والمخططات',
    descEn: 'You learn best through images, charts, and diagrams',
    tipsAr: ['استخدم الخرائط الذهنية', 'شاهد الفيديوهات التعليمية', 'استخدم أقلام ملونة للتلخيص', 'ارسم المفاهيم'],
    tipsEn: ['Use mind maps', 'Watch educational videos', 'Use colored pens for summaries', 'Draw concepts'],
  },
  A: {
    nameAr: 'سمعي',
    nameEn: 'Auditory',
    icon: Ear,
    color: 'bg-green-500',
    descAr: 'تتعلم بشكل أفضل من خلال الاستماع والمناقشة',
    descEn: 'You learn best through listening and discussion',
    tipsAr: ['سجل المحاضرات', 'ناقش المواضيع مع زملائك', 'استخدم البودكاست التعليمية', 'اقرأ بصوت عالٍ'],
    tipsEn: ['Record lectures', 'Discuss topics with peers', 'Use educational podcasts', 'Read aloud'],
  },
  R: {
    nameAr: 'قرائي/كتابي',
    nameEn: 'Reading/Writing',
    icon: BookOpen,
    color: 'bg-purple-500',
    descAr: 'تتعلم بشكل أفضل من خلال القراءة والكتابة',
    descEn: 'You learn best through reading and writing',
    tipsAr: ['اكتب ملخصات تفصيلية', 'أعد كتابة الملاحظات', 'اقرأ الكتب المرجعية', 'دوّن الملاحظات أثناء المحاضرة'],
    tipsEn: ['Write detailed summaries', 'Rewrite notes', 'Read reference books', 'Take notes during lectures'],
  },
  K: {
    nameAr: 'حركي',
    nameEn: 'Kinesthetic',
    icon: Hand,
    color: 'bg-orange-500',
    descAr: 'تتعلم بشكل أفضل من خلال الممارسة والتجربة العملية',
    descEn: 'You learn best through practice and hands-on experience',
    tipsAr: ['طبق ما تتعلمه عملياً', 'قم بالتجارب المخبرية', 'استخدم المحاكاة', 'خذ فترات راحة قصيرة متكررة'],
    tipsEn: ['Apply what you learn practically', 'Do lab experiments', 'Use simulations', 'Take frequent short breaks'],
  },
};

export default function LearningStyle() {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (type: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: type }));
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const calculateResults = () => {
    const counts = { V: 0, A: 0, R: 0, K: 0 };
    Object.values(answers).forEach(type => {
      counts[type as keyof typeof counts]++;
    });
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([type, count]) => ({
      type: type as 'V' | 'A' | 'R' | 'K',
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.percentage - a.percentage);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const results = calculateResults();
  const dominantStyle = results[0];

  const texts = {
    title: isRTL ? 'تحليل أسلوب التعلم' : 'Learning Style Analysis',
    subtitle: isRTL ? 'اكتشف طريقة تعلمك المثلى' : 'Discover your optimal learning style',
    question: isRTL ? 'السؤال' : 'Question',
    of: isRTL ? 'من' : 'of',
    yourResults: isRTL ? 'نتائجك' : 'Your Results',
    dominantStyle: isRTL ? 'أسلوبك الغالب' : 'Your Dominant Style',
    tips: isRTL ? 'نصائح للدراسة' : 'Study Tips',
    retake: isRTL ? 'إعادة الاختبار' : 'Retake Quiz',
    share: isRTL ? 'مشاركة النتائج' : 'Share Results',
    download: isRTL ? 'تحميل التقرير' : 'Download Report',
  };

  if (showResults) {
    const style = styleInfo[dominantStyle.type];
    const StyleIcon = style.icon;

    return (
      <MainLayout>
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <div className={`${style.color} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <StyleIcon className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">{texts.dominantStyle}</p>
                    <h2 className="text-3xl font-bold">
                      {isRTL ? style.nameAr : style.nameEn}
                    </h2>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-6">
                  {isRTL ? style.descAr : style.descEn}
                </p>

                {/* Results Chart */}
                <div className="space-y-4 mb-6">
                  {results.map(result => {
                    const info = styleInfo[result.type];
                    const Icon = info.icon;
                    return (
                      <div key={result.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">
                              {isRTL ? info.nameAr : info.nameEn}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {result.percentage}%
                          </span>
                        </div>
                        <Progress value={result.percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                {/* Tips */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      {texts.tips}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(isRTL ? style.tipsAr : style.tipsEn).map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button onClick={resetQuiz} variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {texts.retake}
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    {texts.share}
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    {texts.download}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  const question = questions[currentQuestion];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {texts.question} {currentQuestion + 1} {texts.of} {questions.length}
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {isRTL ? question.textAr : question.textEn}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option, i) => (
                <Button
                  key={i}
                  variant={answers[currentQuestion] === option.type ? "default" : "outline"}
                  className="w-full justify-start text-start h-auto py-4 px-4"
                  onClick={() => handleAnswer(option.type)}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center me-3">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {isRTL ? option.textAr : option.textEn}
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        {currentQuestion > 0 && (
          <Button
            variant="ghost"
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            className="gap-2"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {isRTL ? 'السؤال السابق' : 'Previous Question'}
          </Button>
        )}
      </div>
    </MainLayout>
  );
}
