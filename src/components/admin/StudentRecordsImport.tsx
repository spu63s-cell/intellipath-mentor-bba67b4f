import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, Database } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  message: string;
  total_records: number;
  inserted: number;
  unique_students: number;
  errors?: string[];
}

export const StudentRecordsImport = () => {
  const { t } = useLanguageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error(t('يرجى اختيار ملف CSV', 'Please select a CSV file'));
      return;
    }

    setFile(selectedFile);
    setResult(null);

    // Preview first few rows
    const text = await selectedFile.text();
    const lines = text.split('\n').slice(0, 6);
    const preview = lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
    setPreviewData(preview);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t('يرجى اختيار ملف أولاً', 'Please select a file first'));
      return;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      const csvData = await file.text();
      setProgress(30);

      const { data, error } = await supabase.functions.invoke('import-student-records', {
        body: { csvData, mode: 'full' },
      });

      setProgress(90);

      if (error) {
        throw new Error(error.message);
      }

      setResult(data as ImportResult);
      setProgress(100);

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || t('حدث خطأ أثناء الاستيراد', 'An error occurred during import'));
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('فشل الاستيراد', 'Import failed') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
      setResult({
        success: false,
        message: t('فشل الاستيراد', 'Import failed'),
        total_records: 0,
        inserted: 0,
        unique_students: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'student_id',
      'الكلية',
      'الاختصاص',
      'العام الدراسي',
      'الفصل الدراسي',
      'آخر فصل تسجيل',
      'نمط الدراسة',
      'الحالة الدائمة',
      'حالة الفصل',
      'الساعات المسجلة-فصل',
      'الساعات المنجزة-الفصل',
      'الإنذار الأكاديمي',
      'المعدل التراكمي المئوي-نهاية',
      'المعدل التراكمي النقطي-نهاية',
      'الساعات المنجزة-نهاية',
      'نوع البكالوريا',
      'بلد البكالوريا',
      'علامة الشهادة',
      'معدل الشهادة',
      'الإنذار الاكاديمي السابق',
      'اسم المقرر',
      'رمز المقرر',
      'عدد الساعات',
      'العلامة النهائية',
      'الدرجة',
      'النقاط',
      'لديه منحة وزارة',
    ];

    const csv = headers.join(',') + '\n';
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_records_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t('استيراد السجلات الأكاديمية', 'Import Academic Records')}
        </CardTitle>
        <CardDescription>
          {t(
            'رفع ملف CSV يحتوي سجلات الطلاب الأكاديمية الكاملة (الدرجات، المقررات، المعدلات)',
            'Upload a CSV file containing complete student academic records (grades, courses, GPAs)'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">{t('قالب ملف CSV', 'CSV Template')}</p>
              <p className="text-sm text-muted-foreground">
                {t('قم بتحميل القالب وملء البيانات ثم ارفعه', 'Download template, fill data, then upload')}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 ml-2" />
            {t('تحميل القالب', 'Download Template')}
          </Button>
        </div>

        {/* File Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-1">
            {file ? file.name : t('اسحب ملف CSV هنا أو انقر للاختيار', 'Drag CSV file here or click to select')}
          </p>
          <p className="text-sm text-muted-foreground">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : t('الحد الأقصى 20 ميغابايت', 'Max 20MB')}
          </p>
        </div>

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="overflow-x-auto">
            <p className="text-sm font-medium mb-2">{t('معاينة البيانات:', 'Data Preview:')}</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {previewData[0]?.slice(0, 8).map((header, i) => (
                      <th key={i} className="px-2 py-1 text-right border-b border-r last:border-r-0 truncate max-w-[120px]">
                        {header}
                      </th>
                    ))}
                    <th className="px-2 py-1 text-right border-b">...</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(1, 4).map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      {row.slice(0, 8).map((cell, j) => (
                        <td key={j} className="px-2 py-1 border-b border-r last:border-r-0 truncate max-w-[120px]">
                          {cell}
                        </td>
                      ))}
                      <td className="px-2 py-1 border-b text-muted-foreground">...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('عرض أول 8 أعمدة و 3 صفوف فقط', 'Showing first 8 columns and 3 rows only')}
            </p>
          </div>
        )}

        {/* Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('جاري الاستيراد...', 'Importing...')}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Result */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{result.message}</p>
                {result.success && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">
                      {t('إجمالي السجلات:', 'Total Records:')} {result.total_records}
                    </Badge>
                    <Badge variant="secondary">
                      {t('تم الإدخال:', 'Inserted:')} {result.inserted}
                    </Badge>
                    <Badge variant="secondary">
                      {t('طلاب فريدين:', 'Unique Students:')} {result.unique_students}
                    </Badge>
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <ul className="text-sm mt-2 list-disc list-inside text-destructive">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={!file || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              {t('جاري الاستيراد...', 'Importing...')}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 ml-2" />
              {t('استيراد السجلات', 'Import Records')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
