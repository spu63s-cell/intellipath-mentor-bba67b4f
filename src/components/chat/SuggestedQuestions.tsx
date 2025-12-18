import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const suggestionsAr = [
  'ما هي المقررات المتاحة هذا الفصل؟',
  'كيف أحسن معدلي التراكمي؟',
  'ما هي المتطلبات المسبقة لمقرر هياكل البيانات؟',
  'اقترح لي خطة دراسية للفصل القادم',
  'ما هي فرص العمل في هندسة المعلوماتية؟',
  'كيف أستعد لامتحان البرمجة؟',
];

const suggestionsEn = [
  'What courses are available this semester?',
  'How can I improve my GPA?',
  'What are the prerequisites for Data Structures?',
  'Suggest a study plan for next semester',
  'What are job opportunities in IT Engineering?',
  'How do I prepare for programming exams?',
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  const { t, language } = useLanguageStore();
  const suggestions = language === 'ar' ? suggestionsAr : suggestionsEn;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/20">
          <Sparkles className="h-8 w-8 text-secondary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          {t('مرحباً! أنا IntelliPath', 'Hello! I\'m IntelliPath')}
        </h2>
        <p className="text-muted-foreground">
          {t(
            'المستشار الأكاديمي الذكي الخاص بك. كيف يمكنني مساعدتك اليوم؟',
            'Your intelligent academic advisor. How can I help you today?'
          )}
        </p>
      </motion.div>

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onSelect(suggestion)}
            className="group rounded-xl border border-border bg-card p-4 text-right transition-all hover:border-primary/50 hover:bg-accent hover:shadow-md rtl:text-right ltr:text-left"
          >
            <p className="text-sm text-foreground group-hover:text-primary">
              {suggestion}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
