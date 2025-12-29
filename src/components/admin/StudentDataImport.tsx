import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, 
  Download, RefreshCw, History, FileText, Users, Loader2
} from 'lucide-react';
import { useStudentDataImport, ImportResult, ImportLog } from '@/hooks/api/useStudentDataImport';
import { useLanguageStore } from '@/stores/languageStore';
import { useEffect } from 'react';

export function StudentDataImport() {
  const { t } = useLanguageStore();
  const { 
    importCSV, 
    getImportLogs, 
    isImporting, 
    importProgress, 
    lastResult 
  } = useStudentDataImport();

  const [dragActive, setDragActive] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const logs = await getImportLogs();
    setImportLogs(logs);
    setLogsLoading(false);
  }, [getImportLogs]);

  useEffect(() => {
    loadLogs();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      await importCSV(selectedFile, overwrite);
      setSelectedFile(null);
      loadLogs();
    } catch (error) {
      // Error handled in hook
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />{t('مكتمل', 'Completed')}</Badge>;
      case 'completed_with_errors':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><AlertTriangle className="w-3 h-3 mr-1" />{t('مكتمل مع أخطاء', 'With Errors')}</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />{t('فشل', 'Failed')}</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" />{t('جاري المعالجة', 'Processing')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {t('استيراد البيانات', 'Import Data')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            {t('سجل الاستيراد', 'Import History')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upload Area */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  {t('رفع ملف CSV', 'Upload CSV File')}
                </CardTitle>
                <CardDescription>
                  {t('اسحب وأفلت ملف CSV أو اختر من جهازك', 'Drag and drop a CSV file or select from your device')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                    ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    ${isImporting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                  `}
                  onClick={() => document.getElementById('csv-input')?.click()}
                >
                  <input
                    id="csv-input"
                    type="file"
                    accept=".csv,.tsv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <AnimatePresence mode="wait">
                    {selectedFile ? (
                      <motion.div
                        key="file"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="space-y-2"
                      >
                        <FileText className="w-12 h-12 mx-auto text-primary" />
                        <p className="font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                      >
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {t('اسحب ملف CSV هنا أو انقر للاختيار', 'Drop CSV file here or click to select')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('يدعم ملفات CSV و TSV', 'Supports CSV and TSV files')}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress */}
                {isImporting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('جاري الاستيراد...', 'Importing...')}</span>
                      <span className="text-foreground">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </motion.div>
                )}

                {/* Options */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="overwrite">{t('استبدال البيانات الموجودة', 'Overwrite existing data')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('تحديث بيانات الطلاب الموجودين مسبقاً', 'Update data for existing students')}
                    </p>
                  </div>
                  <Switch
                    id="overwrite"
                    checked={overwrite}
                    onCheckedChange={setOverwrite}
                  />
                </div>

                {/* Import Button */}
                <Button 
                  onClick={handleImport} 
                  disabled={!selectedFile || isImporting}
                  className="w-full"
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('جاري الاستيراد...', 'Importing...')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('بدء الاستيراد', 'Start Import')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t('نتائج الاستيراد', 'Import Results')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastResult ? (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{lastResult.total_records}</p>
                        <p className="text-xs text-muted-foreground">{t('إجمالي السجلات', 'Total Records')}</p>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-green-500">{lastResult.successful_imports}</p>
                        <p className="text-xs text-muted-foreground">{t('نجح', 'Successful')}</p>
                      </div>
                      <div className="text-center p-4 bg-red-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-red-500">{lastResult.failed_imports}</p>
                        <p className="text-xs text-muted-foreground">{t('فشل', 'Failed')}</p>
                      </div>
                    </div>

                    {/* Errors */}
                    {lastResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">{t('الأخطاء:', 'Errors:')}</p>
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {lastResult.errors.map((error, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-red-500/5 rounded text-sm">
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium">{error.student_id}:</span>{' '}
                                  <span className="text-muted-foreground">{error.error}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Success message */}
                    {lastResult.successful_imports > 0 && lastResult.errors.length === 0 && (
                      <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg text-green-500">
                        <CheckCircle className="w-5 h-5" />
                        <span>{t('تم استيراد جميع السجلات بنجاح!', 'All records imported successfully!')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <FileSpreadsheet className="w-12 h-12 mb-4 opacity-50" />
                    <p>{t('لم يتم إجراء أي استيراد بعد', 'No import performed yet')}</p>
                    <p className="text-sm">{t('ارفع ملف CSV للبدء', 'Upload a CSV file to start')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Format Guide */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('صيغة الملف المطلوبة', 'Required File Format')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{t('الأعمدة المطلوبة:', 'Required Columns:')}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>student_id / رقم الطالب</li>
                    <li>course_code / رمز المقرر</li>
                    <li>course_name / اسم المقرر</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{t('الأعمدة الاختيارية:', 'Optional Columns:')}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>letter_grade / الدرجة الحرفية</li>
                    <li>semester / الفصل الدراسي</li>
                    <li>cumulative_gpa / المعدل التراكمي</li>
                    <li>college, major, department</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">{t('مثال:', 'Example:')}</p>
                <code className="text-xs text-muted-foreground block overflow-x-auto">
                  student_id,course_code,course_name,letter_grade,semester<br/>
                  4210380,CS101,Programming Basics,A,2024-1<br/>
                  4210380,CS102,Data Structures,B+,2024-1
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('سجل عمليات الاستيراد', 'Import History')}</CardTitle>
                  <CardDescription>{t('عرض جميع عمليات الاستيراد السابقة', 'View all previous import operations')}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadLogs} disabled={logsLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                  {t('تحديث', 'Refresh')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : importLogs.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right">{t('الملف', 'File')}</TableHead>
                        <TableHead className="text-right">{t('الحالة', 'Status')}</TableHead>
                        <TableHead className="text-right">{t('نجح', 'Success')}</TableHead>
                        <TableHead className="text-right">{t('فشل', 'Failed')}</TableHead>
                        <TableHead className="text-right">{t('التاريخ', 'Date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{log.file_name}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-green-500">{log.successful_records}</TableCell>
                          <TableCell className="text-red-500">{log.failed_records}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mb-4 opacity-50" />
                  <p>{t('لا توجد عمليات استيراد سابقة', 'No previous imports')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
