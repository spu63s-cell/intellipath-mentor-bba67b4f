import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { 
  Brain, BookOpen, Target, Trophy, MessageSquare, Network,
  Lightbulb, Shield, BarChart3, Briefcase, Sun, Moon, Globe,
  ChevronLeft, ChevronRight, Star, Users, Sparkles, GraduationCap,
  CheckCircle2
} from 'lucide-react';

const features = [
  { icon: Shield, titleAr: 'أمان عالي', titleEn: 'High Security', descAr: 'تشفير قوي وحماية البيانات', descEn: 'Strong encryption and data protection', color: 'bg-blue-500' },
  { icon: CheckCircle2, titleAr: 'تحقق فوري', titleEn: 'Instant Verification', descAr: 'التحقق التلقائي من البيانات', descEn: 'Automatic data verification', color: 'bg-green-500' },
  { icon: Brain, titleAr: 'ذكاء اصطناعي', titleEn: 'Artificial Intelligence', descAr: 'مستشار أكاديمي ذكي', descEn: 'Intelligent academic advisor', color: 'bg-purple-500' },
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
  { num: 1, titleAr: 'التسجيل', titleEn: 'Registration', descAr: 'أدخل بيانات حسابك الجامعي والبريد الإلكتروني', descEn: 'Enter your university account information and email', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { num: 2, titleAr: 'التحقق', titleEn: 'Verification', descAr: 'سيتم التحقق من بياناتك عبر نظام الجامعة', descEn: 'Your account will be verified through the university system', color: 'bg-gradient-to-br from-green-500 to-green-600' },
  { num: 3, titleAr: 'الإنشاء', titleEn: 'Creation', descAr: 'سيتم إنشاء حسابك تلقائياً بعد التحقق', descEn: 'Your account will be automatically created after verification', color: 'bg-gradient-to-br from-yellow-500 to-orange-500' },
  { num: 4, titleAr: 'البدء', titleEn: 'Get Started', descAr: 'يمكنك الآن تسجيل الدخول واستخدام جميع الخدمات', descEn: 'You can now log in and use all services', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
];

const testimonials = [
  { name: 'سارة أحمد', nameEn: 'Sara Ahmed', role: 'طالبة هندسة معلوماتية', roleEn: 'IT Engineering Student', text: 'ساعدني النظام في اختيار المقررات المناسبة ورفع معدلي!', textEn: 'The system helped me choose the right courses and improve my GPA!' },
  { name: 'محمد خالد', nameEn: 'Mohammed Khalid', role: 'طالب هندسة اتصالات', roleEn: 'Telecom Engineering Student', text: 'المستشار الذكي أجاب على كل أسئلتي بدقة عالية.', textEn: 'The AI advisor answered all my questions with high accuracy.' },
  { name: 'لينا عمر', nameEn: 'Lina Omar', role: 'طالبة هندسة طبية', roleEn: 'Biomedical Engineering Student', text: 'رسم المعرفة ساعدني في فهم خطة التخرج بوضوح.', textEn: 'The knowledge graph helped me understand my graduation plan clearly.' },
];

// Star component for space background
const SpaceBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Stars */}
      {[...Array(100)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      {/* Nebula effect */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]" />
    </div>
  );
};

export default function Index() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">IntelliPath</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {t('تسجيل الدخول', 'Login')}
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-gradient-to-r from-teal-400 to-teal-600 text-white hover:from-teal-500 hover:to-teal-700 border-0"
            >
              {t('ابدأ الآن', 'Get Started')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Space Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Space Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f1629] to-[#1a1f3a]" />
        <SpaceBackground />

        <div className="container relative z-10 mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              {t('مرحباً بك في', 'Welcome to')}
              {' '}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                IntelliPath
              </span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-base text-white/60 md:text-lg">
              {t(
                'مستشارك الأكاديمي الذكي - نظام متكامل لطلاب كلية الهندسة',
                'Your Intelligent Academic Advisor - Integrated system for Engineering students'
              )}
            </p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-4xl mx-auto"
          >
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2">
                    {isRTL ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className="text-sm text-white/50">
                    {isRTL ? feature.descAr : feature.descEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#0f1629] relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-white">
              {t('كيفية عمل النظام', 'How It Works')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-2xl font-bold text-white">{step.num}</span>
                </div>
                <h3 className="font-bold text-white mb-2">
                  {isRTL ? step.titleAr : step.titleEn}
                </h3>
                <p className="text-sm text-white/50">
                  {isRTL ? step.descAr : step.descEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-20 bg-[#0a0e1a] relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-white">
              {t('10 أنظمة ذكية متكاملة', '10 Integrated AI Systems')}
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
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
              >
                <Card className="h-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3 mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 flex items-center justify-center group-hover:from-teal-400/30 group-hover:to-teal-600/30 transition-colors">
                      <feature.icon className="h-6 w-6 text-teal-400" />
                    </div>
                    <h3 className="font-semibold mb-1 text-sm text-white">
                      {isRTL ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-xs text-white/40">
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
      <section className="py-20 bg-[#0f1629]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-white">
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
              >
                <Card className="h-full bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-white/70 mb-4">
                      "{isRTL ? testimonial.text : testimonial.textEn}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white">
                          {isRTL ? testimonial.name : testimonial.nameEn}
                        </p>
                        <p className="text-xs text-white/50">
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
      <section className="py-20 bg-gradient-to-r from-[#1a1f3a] via-[#0f1629] to-[#1a1f3a] relative overflow-hidden">
        <SpaceBackground />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('ابدأ رحلتك الأكاديمية اليوم', 'Start Your Academic Journey Today')}
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              {t(
                'انضم إلى آلاف الطلاب الذين يستخدمون IntelliPath لتحقيق أهدافهم الأكاديمية',
                'Join thousands of students using IntelliPath to achieve their academic goals'
              )}
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-teal-400 to-teal-600 text-white hover:from-teal-500 hover:to-teal-700 shadow-lg shadow-teal-500/25"
            >
              {t('سجل مجاناً', 'Sign Up Free')}
              {isRTL ? <ChevronLeft className="mr-2 h-5 w-5" /> : <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 bg-[#0a0e1a]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-teal-400" />
              <span className="font-bold text-white">IntelliPath</span>
            </div>
            <p className="text-sm text-white/50">
              © 2024 IntelliPath - {t('الجامعة السورية الخاصة', 'Syrian Private University')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
