import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileDown, 
  FileText, 
  FileBarChart2, 
  Calendar, 
  Receipt, 
  Users, 
  Package
} from "lucide-react";
import { 
  Material, 
  MaterialTransaction, 
  Worker, 
  Attendance, 
  Expense,
  Site
} from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer
} from "recharts";
import { generatePDF } from "@/lib/utils/pdfGenerator";
import { formatCurrency } from "@/lib/utils";

interface ReportGeneratorProps {
  siteId: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ReportGenerator = ({ siteId }: ReportGeneratorProps) => {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState("materials");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const { data: site } = useQuery<Site>({
    queryKey: [`/api/sites/${siteId}`],
    enabled: !!siteId,
  });
  
  const { data: materials, isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: [`/api/sites/${siteId}/materials`],
    enabled: !!siteId,
  });
  
  const { data: materialTransactions, isLoading: transactionsLoading } = useQuery<MaterialTransaction[]>({
    queryKey: [`/api/sites/${siteId}/material-transactions`],
    enabled: !!siteId,
  });
  
  const { data: workers, isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: [`/api/sites/${siteId}/workers`],
    enabled: !!siteId,
  });
  
  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: [`/api/sites/${siteId}/expenses`],
    enabled: !!siteId,
  });
  
  // Filter data based on date range
  const filterByDateRange = <T extends { date: Date }>(data: T[] | undefined): T[] => {
    if (!data) return [];
    
    if (dateRange === "all") {
      return data;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);  // Include the entire end date
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
  };
  
  // Prepare materials report data
  const prepareMaterialsData = () => {
    if (!materials || !materialTransactions) return [];
    
    const filteredTransactions = filterByDateRange(materialTransactions);
    
    return materials.map(material => {
      const transactions = filteredTransactions.filter(t => t.materialId === material.id);
      const added = transactions
        .filter(t => t.transactionType === "added")
        .reduce((sum, t) => sum + t.quantity, 0);
      const used = transactions
        .filter(t => t.transactionType === "used")
        .reduce((sum, t) => sum + t.quantity, 0);
      
      return {
        id: material.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        currentStock: material.quantity,
        added,
        used,
      };
    });
  };
  
  // Prepare labor cost report data
  const prepareLaborData = () => {
    if (!workers || !expenses) return [];
    
    const filteredExpenses = filterByDateRange(expenses)
      .filter(e => e.category.toLowerCase() === "labor");
    
    const laborCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const workersCount = workers.length;
    const averageDailyCost = workersCount > 0 ? 
      workers.reduce((sum, w) => sum + w.dailyWage, 0) / workersCount : 0;
    
    return {
      totalLaborCost: laborCost,
      workersCount,
      averageDailyWage: averageDailyCost,
      byRole: workers.reduce((acc, worker) => {
        const role = worker.role;
        if (!acc[role]) {
          acc[role] = {
            count: 0,
            totalWage: 0
          };
        }
        acc[role].count += 1;
        acc[role].totalWage += worker.dailyWage;
        return acc;
      }, {} as Record<string, { count: number, totalWage: number }>)
    };
  };
  
  // Prepare expenses report data
  const prepareExpensesData = () => {
    if (!expenses) return { totalExpenses: 0, byCategory: [] };
    
    const filteredExpenses = filterByDateRange(expenses);
    
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const byCategory = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const byDate = filteredExpenses.reduce((acc, expense) => {
      const date = new Date(expense.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalExpenses,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses * 100).toFixed(1)
      })),
      byDate: Object.entries(byDate).map(([date, amount]) => ({
        date,
        amount
      })).sort((a, b) => a.date.localeCompare(b.date))
    };
  };
  
  const handleExportPDF = () => {
    if (!site) return;
    
    let reportData;
    let reportTitle;
    
    if (reportType === "materials") {
      reportData = prepareMaterialsData();
      reportTitle = t('materialUsageReport');
    } else if (reportType === "labor") {
      reportData = prepareLaborData();
      reportTitle = t('laborCostReport');
    } else {
      const expensesData = prepareExpensesData();
      reportData = {
        totalExpenses: expensesData.totalExpenses,
        categories: expensesData.byCategory
      };
      reportTitle = t('expensesReport');
    }
    
    generatePDF({
      reportType,
      reportTitle,
      siteName: site.name,
      dateRange: `${startDate} - ${endDate}`,
      data: reportData
    });
  };
  
  const materialsData = prepareMaterialsData();
  const laborData = prepareLaborData();
  const expensesData = prepareExpensesData();
  
  const isLoading = materialsLoading || transactionsLoading || workersLoading || expensesLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
        <CardTitle className="text-xl">{t('generateReports')}</CardTitle>
        <Button onClick={handleExportPDF} disabled={isLoading}>
          <FileDown size={16} className="mr-2" />
          {t('exportToPDF')}
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">{t('reportType')}</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectReportType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="materials">{t('materialUsageReport')}</SelectItem>
                <SelectItem value="labor">{t('laborCostReport')}</SelectItem>
                <SelectItem value="expenses">{t('expensesReport')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">{t('dateRange')}</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectDateRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTime')}</SelectItem>
                <SelectItem value="custom">{t('customRange')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {dateRange === "custom" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('startDate')}</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('endDate')}</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        
        <Separator className="my-6" />
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className="mb-6">
              <TabsTrigger value="materials" className="flex items-center">
                <Package size={16} className="mr-2" />
                {t('materials')}
              </TabsTrigger>
              <TabsTrigger value="labor" className="flex items-center">
                <Users size={16} className="mr-2" />
                {t('labor')}
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center">
                <Receipt size={16} className="mr-2" />
                {t('expenses')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="materials">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('totalMaterials')}</div>
                      <div className="text-3xl font-bold">{materials?.length || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('materialsAdded')}</div>
                      <div className="text-3xl font-bold">
                        {materialsData
                          .reduce((sum, m) => sum + m.added, 0)
                          .toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('materialsUsed')}</div>
                      <div className="text-3xl font-bold">
                        {materialsData
                          .reduce((sum, m) => sum + m.used, 0)
                          .toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('materialUsageSummary')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={materialsData.map(m => ({
                            name: m.name,
                            added: m.added,
                            used: m.used
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="added" name={t('added')} fill="var(--chart-1)" />
                          <Bar dataKey="used" name={t('used')} fill="var(--chart-2)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('materialsDetailedReport')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('materialName')}</TableHead>
                            <TableHead>{t('category')}</TableHead>
                            <TableHead>{t('unit')}</TableHead>
                            <TableHead className="text-right">{t('added')}</TableHead>
                            <TableHead className="text-right">{t('used')}</TableHead>
                            <TableHead className="text-right">{t('currentStock')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materialsData.map((material) => (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium">{material.name}</TableCell>
                              <TableCell>{material.category}</TableCell>
                              <TableCell>{material.unit}</TableCell>
                              <TableCell className="text-right">{material.added}</TableCell>
                              <TableCell className="text-right">{material.used}</TableCell>
                              <TableCell className="text-right">{material.currentStock}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="labor">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('totalWorkers')}</div>
                      <div className="text-3xl font-bold">{laborData.workersCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('totalLaborCost')}</div>
                      <div className="text-3xl font-bold">{formatCurrency(laborData.totalLaborCost)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('avgDailyWage')}</div>
                      <div className="text-3xl font-bold">{formatCurrency(laborData.averageDailyWage)}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('workersByRole')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      {Object.keys(laborData.byRole).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(laborData.byRole).map(([role, data]) => ({
                                name: role,
                                value: data.count
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(laborData.byRole).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-gray-500">
                          {t('noWorkersData')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('laborCostByRole')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('role')}</TableHead>
                            <TableHead className="text-right">{t('workers')}</TableHead>
                            <TableHead className="text-right">{t('avgDailyWage')}</TableHead>
                            <TableHead className="text-right">{t('dailyCost')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(laborData.byRole).map(([role, data]) => (
                            <TableRow key={role}>
                              <TableCell className="font-medium">{role}</TableCell>
                              <TableCell className="text-right">{data.count}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(data.totalWage / data.count)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(data.totalWage)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell className="font-bold">{t('total')}</TableCell>
                            <TableCell className="text-right font-bold">{laborData.workersCount}</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(laborData.averageDailyWage)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(Object.values(laborData.byRole).reduce((sum, data) => sum + data.totalWage, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="expenses">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('totalExpenses')}</div>
                      <div className="text-3xl font-bold">{formatCurrency(expensesData.totalExpenses)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t('expenseCategories')}</div>
                      <div className="text-3xl font-bold">{expensesData.byCategory.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-gray-500 mb-1">
                        {t('avgDailyExpense')}
                      </div>
                      <div className="text-3xl font-bold">
                        {expensesData.byDate.length > 0 
                          ? formatCurrency(expensesData.totalExpenses / expensesData.byDate.length)
                          : formatCurrency(0)
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('expensesByCategory')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        {expensesData.byCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={expensesData.byCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                dataKey="amount"
                                nameKey="category"
                              >
                                {expensesData.byCategory.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            {t('noExpensesData')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('expensesTrend')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        {expensesData.byDate.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={expensesData.byDate}
                              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                angle={-45} 
                                textAnchor="end" 
                                height={70}
                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              />
                              <YAxis tickFormatter={(value) => formatCurrency(value).split('.')[0]} />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Bar dataKey="amount" name={t('amount')} fill="var(--chart-1)" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            {t('noExpensesData')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('expenseDetails')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('category')}</TableHead>
                            <TableHead className="text-right">{t('amount')}</TableHead>
                            <TableHead className="text-right">{t('percentage')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expensesData.byCategory.map((category) => (
                            <TableRow key={category.category}>
                              <TableCell className="font-medium">{category.category}</TableCell>
                              <TableCell className="text-right">{formatCurrency(category.amount)}</TableCell>
                              <TableCell className="text-right">{category.percentage}%</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell className="font-bold">{t('total')}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(expensesData.totalExpenses)}</TableCell>
                            <TableCell className="text-right font-bold">100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
