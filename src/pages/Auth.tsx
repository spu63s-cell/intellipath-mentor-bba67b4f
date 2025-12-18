import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { Moon, Sun, Languages } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  studentId: z.string().regex(/^[0-9]{7,10}$/, 'الرقم الجامعي يجب أن يكون 7-10 أرقام'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, toggleLanguage, language } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse(loginForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: t('خطأ في تسجيل الدخول', 'Login Error'),
        description: error.message === 'Invalid login credentials' 
          ? t('بيانات الدخول غير صحيحة', 'Invalid login credentials')
          : error.message,
      });
      return;
    }

    toast({
      title: t('مرحباً بك!', 'Welcome!'),
      description: t('تم تسجيل الدخول بنجاح', 'Successfully logged in'),
    });
    
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      registerSchema.parse(registerForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: registerForm.fullName,
          student_id: registerForm.studentId,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          variant: 'destructive',
          title: t('خطأ في التسجيل', 'Registration Error'),
          description: t('هذا البريد الإلكتروني مسجل مسبقاً', 'This email is already registered'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('خطأ في التسجيل', 'Registration Error'),
          description: error.message,
        });
      }
      return;
    }

    toast({
      title: t('تم إنشاء الحساب!', 'Account Created!'),
      description: t('مرحباً بك في IntelliPath', 'Welcome to IntelliPath'),
    });
    
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full overflow-hidden gradient-hero">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-40 w-40 rounded-full bg-secondary/10 blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-primary-foreground">IntelliPath</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Languages className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-2xl bg-card/95 p-8 shadow-2xl backdrop-blur-xl">
            {/* Title */}
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                {isLogin
                  ? t('تسجيل الدخول', 'Sign In')
                  : t('إنشاء حساب جديد', 'Create Account')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLogin
                  ? t('أدخل بياناتك للوصول إلى حسابك', 'Enter your credentials to access your account')
                  : t('أنشئ حسابك للبدء في رحلتك الأكاديمية', 'Create your account to start your academic journey')}
              </p>
            </div>

            {/* Toggle */}
            <div className="mb-6 flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('تسجيل الدخول', 'Login')}
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('حساب جديد', 'Register')}
              </button>
            </div>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('البريد الإلكتروني', 'Email')}</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('أدخل بريدك الإلكتروني', 'Enter your email')}
                        className="pr-10 rtl:pl-10 rtl:pr-3"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t('كلمة المرور', 'Password')}</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('أدخل كلمة المرور', 'Enter your password')}
                        className="pl-10 pr-10 rtl:pl-10 rtl:pr-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-auto rtl:right-3"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin rtl:ml-0 rtl:mr-2" />
                        {t('جاري التحميل...', 'Loading...')}
                      </>
                    ) : (
                      t('تسجيل الدخول', 'Sign In')
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('الاسم الكامل', 'Full Name')}</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                      <Input
                        id="fullName"
                        placeholder={t('أدخل اسمك الكامل', 'Enter your full name')}
                        className="pr-10 rtl:pl-10 rtl:pr-3"
                        value={registerForm.fullName}
                        onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regEmail">{t('البريد الإلكتروني', 'Email')}</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder={t('أدخل بريدك الإلكتروني', 'Enter your email')}
                        className="pr-10 rtl:pl-10 rtl:pr-3"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId">{t('الرقم الجامعي', 'Student ID')}</Label>
                    <div className="relative">
                      <GraduationCap className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                      <Input
                        id="studentId"
                        placeholder={t('أدخل رقمك الجامعي', 'Enter your student ID')}
                        className="pr-10 rtl:pl-10 rtl:pr-3"
                        value={registerForm.studentId}
                        onChange={(e) => setRegisterForm({ ...registerForm, studentId: e.target.value })}
                      />
                    </div>
                    {errors.studentId && (
                      <p className="text-xs text-destructive">{errors.studentId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword">{t('كلمة المرور', 'Password')}</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                      <Input
                        id="regPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('أدخل كلمة المرور', 'Enter your password')}
                        className="pl-10 pr-10"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-auto rtl:right-3"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('تأكيد كلمة المرور', 'Confirm Password')}</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('أعد إدخال كلمة المرور', 'Confirm your password')}
                        className="pr-10 rtl:pl-10 rtl:pr-3"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin rtl:ml-0 rtl:mr-2" />
                        {t('جاري التحميل...', 'Loading...')}
                      </>
                    ) : (
                      t('إنشاء الحساب', 'Create Account')
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-primary-foreground/60">
            {t(
              'الجامعة السورية الخاصة - كلية الهندسة',
              'Syrian Private University - Faculty of Engineering'
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
