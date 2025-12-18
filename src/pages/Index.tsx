import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { 
  Brain, BookOpen, Target, Trophy, MessageSquare, Network,
  Lightbulb, Shield, BarChart3, Briefcase, Sun, Moon, Globe,
  Star, Users, GraduationCap, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Zap
} from 'lucide-react';
import { ParticlesBackground, FloatingOrbs, GridPattern } from '@/components/ui/particles-background';

const features = [
  { icon: Shield, titleAr: 'أمان عالي', titleEn: 'High Security', descAr: 'تشفير قوي وحماية البيانات', descEn: 'Strong encryption and data protection', color: 'from-blue-500 to-blue-600' },
  { icon: CheckCircle2, titleAr: 'تحقق فوري', titleEn: 'Instant Verification', descAr: 'التحقق التلقائي من البيانات', descEn: 'Automatic data verification', color: 'from-green-500 to-emerald-500' },
  { icon: Brain, titleAr: 'ذكاء اصطناعي', titleEn: 'Artificial Intelligence', descAr: 'مستشار أكاديمي ذكي', descEn: 'Intelligent academic advisor', color: 'from-purple-500 to-violet-500' },
];

const allFeatures = [
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

const steps = [
  { num: 1, titleAr: 'التسجيل', titleEn: 'Registration', descAr: 'أدخل بيانات حسابك الجامعي والبريد الإلكتروني', descEn: 'Enter your university account information and email', color: 'from-blue-500 to-cyan-500' },
  { num: 2, titleAr: 'التحقق', titleEn: 'Verification', descAr: 'سيتم التحقق من بياناتك عبر نظام الجامعة', descEn: 'Your account will be verified through the university system', color: 'from-green-500 to-emerald-500' },
  { num: 3, titleAr: 'الإنشاء', titleEn: 'Creation', descAr: 'سيتم إنشاء حسابك تلقائياً بعد التحقق', descEn: 'Your account will be automatically created after verification', color: 'from-yellow-500 to-orange-500' },
  { num: 4, titleAr: 'البدء', titleEn: 'Get Started', descAr: 'يمكنك الآن تسجيل الدخول واستخدام جميع الخدمات', descEn: 'You can now log in and use all services', color: 'from-purple-500 to-pink-500' },
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
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  
  // Parallax refs
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">IntelliPath</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="hover:bg-muted"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="hover:bg-muted"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hover:bg-muted hidden sm:flex"
            >
              {t('تسجيل الدخول', 'Login')}
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20"
            >
              {t('ابدأ الآن', 'Get Started')}
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <FloatingOrbs />
        <ParticlesBackground particleCount={80} />
        <GridPattern />
        
        {/* Parallax Content */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="container relative z-10 mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span className="text-sm text-white/80">{t('مدعوم بالذكاء الاصطناعي', 'Powered by AI')}</span>
            </motion.div>
            
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-7xl text-white">
              {t('مرحباً بك في', 'Welcome to')}
              {' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  IntelliPath
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-base text-white/60 md:text-lg lg:text-xl">
              {t(
                'مستشارك الأكاديمي الذكي - نظام متكامل لطلاب كلية الهندسة في الجامعة السورية الخاصة',
                'Your Intelligent Academic Advisor - Integrated system for Engineering students at Syrian Private University'
              )}
            </p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/30 gap-2 text-base px-8 group"
              >
                {t('ابدأ رحلتك', 'Start Your Journey')}
                <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <Zap className="h-5 w-5 me-2" />
                {t('تعرف على النظام', 'Learn More')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-teal-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-teal-500/10">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white">
                      {isRTL ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-sm text-white/60">
                      {isRTL ? feature.descAr : feature.descEn}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-teal-400"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              {t('كيفية عمل النظام', 'How It Works')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('أربع خطوات بسيطة للبدء في استخدام النظام', 'Four simple steps to start using the system')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="text-center relative"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
                
                <motion.div 
                  className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <span className="text-2xl font-bold text-white">{step.num}</span>
                </motion.div>
                <h3 className="font-bold mb-2">
                  {isRTL ? step.titleAr : step.titleEn}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? step.descAr : step.descEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20"
            >
              <Sparkles className="h-4 w-4 text-teal-500" />
              <span className="text-sm text-teal-600 dark:text-teal-400">{t('ميزات متقدمة', 'Advanced Features')}</span>
            </motion.div>
            
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {allFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="h-full bg-card hover:bg-accent/50 border border-border hover:border-teal-500/30 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-teal-500/5">
                  <CardContent className="p-4 text-center">
                    <motion.div 
                      className="mb-3 mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-teal-500/30 group-hover:to-cyan-500/30 transition-colors"
                      whileHover={{ rotate: 10 }}
                    >
                      <feature.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </motion.div>
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
      <section className="py-20 bg-muted/30 relative overflow-hidden">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-card border border-border hover:border-teal-500/30 hover:shadow-lg transition-all duration-300">
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
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
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <FloatingOrbs />
        <ParticlesBackground particleCount={40} />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('هل أنت جاهز للبدء؟', 'Ready to Get Started?')}
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              {t(
                'انضم إلى آلاف الطلاب الذين يستخدمون IntelliPath لتحقيق أهدافهم الأكاديمية',
                'Join thousands of students using IntelliPath to achieve their academic goals'
              )}
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/30 gap-2 text-base px-8"
              >
                {t('ابدأ مجاناً', 'Start Free')}
                <ArrowIcon className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">IntelliPath</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} IntelliPath. {t('جميع الحقوق محفوظة', 'All rights reserved')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
