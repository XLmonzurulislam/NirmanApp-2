import { useLanguage } from "@/components/layout/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MaterialTransaction } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface MaterialChartProps {
  siteId: number;
}

const MaterialChart = ({ siteId }: MaterialChartProps) => {
  const { t } = useLanguage();
  
  const { data: transactions, isLoading } = useQuery<MaterialTransaction[]>({
    queryKey: [`/api/sites/${siteId}/material-transactions`],
    enabled: !!siteId,
  });
  
  // Process data for the chart - last 7 days of material usage
  const getLastSevenDaysData = () => {
    if (!transactions) return [];
    
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });
    
    return last7Days.map(dateString => {
      const dayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date).toISOString().split('T')[0];
        return transDate === dateString && t.transactionType === 'used';
      });
      
      // Count distinct materials used on this day
      const distinctMaterials = new Set(dayTransactions.map(t => t.materialId));
      
      return {
        date: dateString,
        usage: dayTransactions.length,
        distinctMaterials: distinctMaterials.size,
        displayDate: new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  };
  
  const chartData = getLastSevenDaysData();

  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
          {t('materialUsageChart')}
        </h3>
        
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip />
                <Bar 
                  dataKey="usage" 
                  name={t('materialsUsed')} 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialChart;
