import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { 
  Brain, BookOpen, Target, Trophy, MessageSquare, Network,
  Lightbulb, Shield, BarChart3, Briefcase, Sun, Moon, Globe,
  ChevronLeft, ChevronRight, Star, Users, Sparkles, GraduationCap
} from 'lucide-react';

const features = [
  { icon: Brain, titleAr: 'المستشار الذكي RAG', titleEn: 'RAG AI Advisor', descAr: 'محادثة ذكية مع نظام استرجاع معزز', descEn: 'Smart conversation with retrieval augmented generation' },
  { icon: Network, titleAr: 'رسم المعرفة', titleEn: 'Knowledge Graph', descAr: 'تصور تفاعلي للمقررات والمتطلبات', descEn: 'Interactive visualization of courses and prerequisites' },
  { icon: BarChart3, titleAr: 'محاكي القرارات', titleEn: 'Decision Simulator', descAr: 'تنبؤ بتأثير القرارات الأكاديمية', descEn: 'Predict impact of academic decisions' },
  { icon: Briefcase, titleAr: 'مخطط المسار المهني', titleEn: 'Career Planner', descAr: 'خطط لمستقبلك المهني', descEn: 'Plan your career path' },
  { icon: Shield, titleAr: 'نظام الإنذار المبكر', titleEn: 'Early Warning', descAr: 'تنبيهات استباقية للمخاطر الأكاديمية', descEn: 'Proactive alerts for academic risks' },
  { icon: Lightbulb, titleAr: 'تحليل أسلوب التعلم', titleEn: 'Learning Style', descAr: 'اكتشف طريقة تعلمك المثلى', descEn: 'Discover your optimal learning style' },
  { icon: Trophy, titleAr: 'نظام الألعاب', titleEn: 'Gamification', descAr: 'اكسب نقاط XP وشارات', descEn: 'Earn XP points and badges' },
  { icon: BookOpen, titleAr: 'سجل المواهب', titleEn: 'Talent Ledger', descAr: 'وثق مهاراتك وإنجازاتك', descEn: 'Document your skills and achievements' },
  { icon: Target, titleAr: 'التوصيات الذكية', titleEn: 'Smart Recommendations', descAr: 'اقتراحات مخصصة لمسارك', descEn: 'Personalized suggestions for your path' },
  { icon: MessageSquare, titleAr: 'دعم متعدد اللغات', titleEn: 'Multilingual Support', descAr: 'العربية والإنجليزية', descEn: 'Arabic and English' },
];

const testimonials = [
  { name: 'سارة أحمد', nameEn: 'Sara Ahmed', role: 'طالبة هندسة معلوماتية', roleEn: 'IT Engineering Student', text: 'ساعدني النظام في اختيار المقررات المناسبة ورفع معدلي!', textEn: 'The system helped me choose the right courses and improve my GPA!' },
  { name: 'محمد خالد', nameEn: 'Mohammed Khalid', role: 'طالب هندسة اتصالات', roleEn: 'Telecom Engineering Student', text: 'المستشار الذكي أجاب على كل أسئلتي بدقة عالية.', textEn: 'The AI advisor answered all my questions with high accuracy.' },
  { name: 'لينا عمر', nameEn: 'Lina Omar', role: 'طالبة هندسة طبية', roleEn: 'Biomedical Engineering Student', text: 'رسم المعرفة ساعدني في فهم خطة التخرج بوضوح.', textEn: 'The knowledge graph helped me understand my graduation plan clearly.' },
];

export default function Index() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-secondary">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">IntelliPath</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              {t('تسجيل الدخول', 'Login')}
            </Button>
            <Button onClick={() => navigate('/auth')} className="gradient-secondary text-white">
              {t('ابدأ الآن', 'Get Started')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="text-sm">{t('مدعوم بالذكاء الاصطناعي', 'Powered by AI')}</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
              {t('المستشار الأكاديمي', 'Academic Advisor')}
              <br />
              <span className="text-secondary">{t('الذكي', 'Intelligent')}</span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80 md:text-xl">
              {t(
                'نظام استشارات أكاديمية متكامل لطلاب الهندسة في الجامعة السورية الخاصة، مدعوم بـ 10 أنظمة ذكية',
                'A comprehensive academic advisory system for engineering students at Syrian Private University, powered by 10 intelligent systems'
              )}
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="gradient-secondary text-white shadow-glow hover:shadow-lg"
              >
                {t('ابدأ رحلتك', 'Start Your Journey')}
                {isRTL ? <ChevronLeft className="mr-2 h-5 w-5" /> : <ChevronRight className="ml-2 h-5 w-5" />}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                {t('شاهد العرض', 'Watch Demo')}
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {[
              { value: '10+', labelAr: 'نظام ذكي', labelEn: 'AI Systems' },
              { value: '5000+', labelAr: 'طالب مستفيد', labelEn: 'Students' },
              { value: '98%', labelAr: 'نسبة الرضا', labelEn: 'Satisfaction' },
              { value: '24/7', labelAr: 'دعم متواصل', labelEn: 'Support' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold text-secondary">{stat.value}</p>
                <p className="text-sm text-white/70">{isRTL ? stat.labelAr : stat.labelEn}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              {t('10 أنظمة ذكية متكاملة', '10 Integrated AI Systems')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t(
                'كل ما تحتاجه لتحقيق النجاح الأكاديمي والمهني في مكان واحد',
                'Everything you need for academic and career success in one place'
              )}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover-lift cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3 mx-auto w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="font-semibold mb-1 text-sm">
                      {isRTL ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? feature.descAr : feature.descEn}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              {t('ماذا يقول طلابنا', 'What Our Students Say')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      "{isRTL ? testimonial.text : testimonial.textEn}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {isRTL ? testimonial.name : testimonial.nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? testimonial.role : testimonial.roleEn}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('ابدأ رحلتك الأكاديمية اليوم', 'Start Your Academic Journey Today')}
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              {t(
                'انضم إلى آلاف الطلاب الذين يستخدمون IntelliPath لتحقيق أهدافهم الأكاديمية',
                'Join thousands of students using IntelliPath to achieve their academic goals'
              )}
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-primary hover:bg-white/90"
            >
              {t('سجل مجاناً', 'Sign Up Free')}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-secondary" />
              <span className="font-bold">IntelliPath</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 IntelliPath - {t('الجامعة السورية الخاصة', 'Syrian Private University')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
