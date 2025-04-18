import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { 
  PackageOpen, 
  Users, 
  CreditCard, 
  PieChart 
} from "lucide-react";
import { Material, Worker, Expense } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface DashboardStatsProps {
  siteId: number;
}

const DashboardStats = ({ siteId }: DashboardStatsProps) => {
  const { t } = useLanguage();
  
  const { data: materials, isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: [`/api/sites/${siteId}/materials`],
    enabled: !!siteId,
  });
  
  const { data: lowStockMaterials, isLoading: lowStockLoading } = useQuery<Material[]>({
    queryKey: [`/api/sites/${siteId}/materials/low-stock`],
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

  // Calculate today's expenses
  const todayExpenses = expenses?.filter(expense => {
    const today = new Date().toISOString().split('T')[0];
    const expenseDate = new Date(expense.date).toISOString().split('T')[0];
    return expenseDate === today;
  });
  
  const todayExpenseTotal = todayExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  
  // Count workers by role
  const skilledWorkers = workers?.filter(worker => worker.role !== 'Helper').length || 0;
  const helperWorkers = workers?.filter(worker => worker.role === 'Helper').length || 0;
  
  // Calculate project completion (placeholder)
  const projectCompletion = 68; // This would come from real data in a complete implementation

  const stats = [
    {
      title: t('materials'),
      icon: <PackageOpen className="text-primary" />,
      value: materials?.length || 0,
      subtitle: t('lowStockItems', { count: lowStockMaterials?.length || 0 }),
      loading: materialsLoading || lowStockLoading,
    },
    {
      title: t('workersToday'),
      icon: <Users className="text-orange-500" />,
      value: workers?.length || 0,
      subtitle: t('workerBreakdown', { skilled: skilledWorkers, helpers: helperWorkers }),
      loading: workersLoading,
    },
    {
      title: t('todayExpense'),
      icon: <CreditCard className="text-green-500" />,
      value: `৳ ${todayExpenseTotal.toLocaleString()}`,
      subtitle: t('expenseChange', { change: '+15%' }),
      loading: expensesLoading,
    },
    {
      title: t('projectCompletion'),
      icon: <PieChart className="text-blue-500" />,
      value: `${projectCompletion}%`,
      progress: projectCompletion,
      loading: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {stat.title}
              </h3>
              {stat.icon}
            </div>
            
            {stat.loading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            )}
            
            {stat.progress !== undefined ? (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            ) : (
              stat.loading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.subtitle}
                </p>
              )
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
