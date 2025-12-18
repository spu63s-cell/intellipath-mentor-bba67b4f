import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Star, 
  Flame, 
  Target, 
  BookOpen, 
  Clock, 
  Award,
  Crown,
  Zap,
  Gift,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';

// Mock achievements data
const achievements = [
  { id: '1', name: 'طالب متميز', nameEn: 'Distinguished Student', description: 'حقق معدل 3.5 أو أعلى', descriptionEn: 'Achieve GPA 3.5 or higher', icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', xp: 500, unlocked: true },
  { id: '2', name: 'قارئ نهم', nameEn: 'Avid Reader', description: 'أكمل 10 محادثات مع المستشار', descriptionEn: 'Complete 10 advisor chats', icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/10', xp: 200, unlocked: true },
  { id: '3', name: 'سلسلة 7 أيام', nameEn: '7 Day Streak', description: 'سجل دخولك 7 أيام متتالية', descriptionEn: 'Login 7 consecutive days', icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/10', xp: 150, unlocked: true },
  { id: '4', name: 'المتفوق', nameEn: 'Top Performer', description: 'كن من أفضل 10 طلاب', descriptionEn: 'Be in top 10 students', icon: Crown, color: 'text-purple-500', bgColor: 'bg-purple-500/10', xp: 1000, unlocked: false },
  { id: '5', name: 'المثابر', nameEn: 'Persistent', description: 'أكمل جميع مقررات الفصل', descriptionEn: 'Complete all semester courses', icon: Target, color: 'text-green-500', bgColor: 'bg-green-500/10', xp: 300, unlocked: false },
  { id: '6', name: 'سريع البرق', nameEn: 'Lightning Fast', description: 'أنجز 5 واجبات قبل الموعد', descriptionEn: 'Submit 5 assignments early', icon: Zap, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', xp: 250, unlocked: true },
  { id: '7', name: 'الخبير', nameEn: 'Expert', description: 'احصل على A في 5 مقررات', descriptionEn: 'Get A in 5 courses', icon: Award, color: 'text-amber-500', bgColor: 'bg-amber-500/10', xp: 400, unlocked: false },
  { id: '8', name: 'المبتدئ', nameEn: 'Beginner', description: 'أكمل تسجيلك الأول', descriptionEn: 'Complete your first registration', icon: Gift, color: 'text-pink-500', bgColor: 'bg-pink-500/10', xp: 50, unlocked: true },
];

// Mock leaderboard data
const leaderboard = [
  { rank: 1, name: 'سارة أحمد', nameEn: 'Sara Ahmed', xp: 5420, level: 18, avatar: '' },
  { rank: 2, name: 'محمد علي', nameEn: 'Mohammed Ali', xp: 4890, level: 16, avatar: '' },
  { rank: 3, name: 'ليلى حسن', nameEn: 'Laila Hassan', xp: 4650, level: 15, avatar: '' },
  { rank: 4, name: 'أحمد خالد', nameEn: 'Ahmed Khaled', xp: 4200, level: 14, avatar: '' },
  { rank: 5, name: 'نور الدين', nameEn: 'Nour Eldin', xp: 3980, level: 13, avatar: '' },
  { rank: 6, name: 'فاطمة محمد', nameEn: 'Fatima Mohammed', xp: 3750, level: 12, avatar: '' },
  { rank: 7, name: 'عمر يوسف', nameEn: 'Omar Youssef', xp: 3500, level: 12, avatar: '' },
  { rank: 8, name: 'رنا سعيد', nameEn: 'Rana Saeed', xp: 3200, level: 11, avatar: '' },
];

// Mock weekly challenges
const weeklyChalllenges = [
  { id: '1', title: 'أكمل 3 محادثات', titleEn: 'Complete 3 chats', xp: 100, progress: 2, total: 3, icon: MessageSquare },
  { id: '2', title: 'سجل دخولك 5 أيام', titleEn: 'Login 5 days', xp: 75, progress: 3, total: 5, icon: Calendar },
  { id: '3', title: 'استعرض 5 مقررات', titleEn: 'View 5 courses', xp: 50, progress: 5, total: 5, completed: true, icon: BookOpen },
];

import { MessageSquare, Calendar } from 'lucide-react';

export default function Achievements() {
  const { t, language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('achievements');

  // Current user stats
  const userStats = {
    xp: 2450,
    level: 12,
    nextLevelXp: 3000,
    rank: 15,
    streak: 7,
    totalAchievements: 5,
  };

  const xpProgress = (userStats.xp / userStats.nextLevelXp) * 100;

  return (
    <MainLayout>
      <div className="container mx-auto space-y-6 p-4 md:p-6">
        {/* Header Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden border-0 gradient-secondary text-secondary-foreground">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
                      {userStats.level}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Flame className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {t('المستوى', 'Level')} {userStats.level}
                    </h2>
                    <p className="text-secondary-foreground/80">
                      {userStats.xp} / {userStats.nextLevelXp} XP
                    </p>
                    <Progress value={xpProgress} className="mt-2 h-2 w-40 bg-white/20" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-2xl font-bold">{userStats.rank}</p>
                    <p className="text-xs text-secondary-foreground/80">{t('الترتيب', 'Rank')}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-2xl font-bold">{userStats.streak}</p>
                    <p className="text-xs text-secondary-foreground/80">{t('سلسلة', 'Streak')}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-2xl font-bold">{userStats.totalAchievements}</p>
                    <p className="text-xs text-secondary-foreground/80">{t('إنجازات', 'Badges')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {t('الإنجازات', 'Achievements')}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              {t('لوحة المتصدرين', 'Leaderboard')}
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('التحديات', 'Challenges')}
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      'relative overflow-hidden transition-all hover-lift',
                      !achievement.unlocked && 'opacity-60'
                    )}
                  >
                    {!achievement.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-xl p-3', achievement.bgColor)}>
                          <achievement.icon className={cn('h-6 w-6', achievement.color)} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {language === 'ar' ? achievement.name : achievement.nameEn}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {language === 'ar' ? achievement.description : achievement.descriptionEn}
                          </p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            +{achievement.xp} XP
                          </Badge>
                        </div>
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle2 className="absolute top-2 left-2 h-5 w-5 text-green-500 rtl:left-auto rtl:right-2" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-yellow-500" />
                  {t('أفضل الطلاب هذا الأسبوع', 'Top Students This Week')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((student, index) => (
                    <motion.div
                      key={student.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={cn(
                        'flex items-center gap-4 rounded-xl p-3 transition-colors',
                        student.rank <= 3 ? 'bg-gradient-to-l from-yellow-500/10 to-transparent' : 'bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full font-bold',
                          student.rank === 1 && 'bg-yellow-500 text-white',
                          student.rank === 2 && 'bg-gray-400 text-white',
                          student.rank === 3 && 'bg-amber-600 text-white',
                          student.rank > 3 && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {student.rank <= 3 ? (
                          <Crown className="h-5 w-5" />
                        ) : (
                          student.rank
                        )}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback className="bg-primary/10">
                          {(language === 'ar' ? student.name : student.nameEn).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {language === 'ar' ? student.name : student.nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('المستوى', 'Level')} {student.level}
                        </p>
                      </div>
                      <div className="text-left rtl:text-right">
                        <p className="font-bold text-primary">{student.xp.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeklyChalllenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={cn(challenge.completed && 'border-green-500/50 bg-green-500/5')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'rounded-xl p-3',
                            challenge.completed ? 'bg-green-500/10' : 'bg-primary/10'
                          )}>
                            <challenge.icon className={cn(
                              'h-5 w-5',
                              challenge.completed ? 'text-green-500' : 'text-primary'
                            )} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {language === 'ar' ? challenge.title : challenge.titleEn}
                            </h3>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              +{challenge.xp} XP
                            </Badge>
                          </div>
                        </div>
                        {challenge.completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {t('التقدم', 'Progress')}
                          </span>
                          <span className="font-medium">
                            {challenge.progress}/{challenge.total}
                          </span>
                        </div>
                        <Progress
                          value={(challenge.progress / challenge.total) * 100}
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Weekly Reset Timer */}
            <Card className="mt-6">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {t('التحديات الأسبوعية تتجدد في', 'Weekly challenges reset in')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('3 أيام و 14 ساعة', '3 days and 14 hours')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {t('2/3 مكتمل', '2/3 Complete')}
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
