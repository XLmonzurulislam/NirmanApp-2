import { useLanguage } from "@/components/layout/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Material } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface LowStockAlertProps {
  siteId: number;
}

const LowStockAlert = ({ siteId }: LowStockAlertProps) => {
  const { t } = useLanguage();
  
  const { data: lowStockMaterials, isLoading } = useQuery<Material[]>({
    queryKey: [`/api/sites/${siteId}/materials/low-stock`],
    enabled: !!siteId,
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
          {t('lowStockAlert')}
        </CardTitle>
        <Link href="/materials">
          <Button variant="link" size="sm" className="text-primary hover:text-primary/80 dark:text-primary-400">
            {t('viewAll')}
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="mb-3">
                <div className="flex items-center mb-2">
                  <Skeleton className="h-10 w-10 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : !lowStockMaterials || lowStockMaterials.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {t('noLowStockMaterials')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('material')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('currentStock')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('action')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {lowStockMaterials.map((material) => {
                  const stockPercentage = Math.min(100, Math.round((material.quantity / material.minStockLevel) * 100));
                  const isCritical = stockPercentage < 40;
                  
                  return (
                    <tr key={material.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full ${isCritical ? 'bg-red-100 dark:bg-red-900' : 'bg-orange-100 dark:bg-orange-900'} flex items-center justify-center`}>
                            <AlertTriangle size={20} className={isCritical ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{material.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{material.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{material.quantity} {material.unit.toLowerCase()}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('min')}: {material.minStockLevel} {material.unit.toLowerCase()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isCritical 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {isCritical ? t('critical') : t('low')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="link" className="text-primary hover:text-primary/80 dark:text-primary-400">
                          {t('orderNow')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockAlert;
