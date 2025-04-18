import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import ReportGenerator from "@/components/reports/ReportGenerator";
import { Site } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Reports = () => {
  const { t } = useLanguage();
  
  const { data: sites, isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });
  
  // Use the first site as default
  const currentSite = sites?.[0];

  return (
    <div className="p-4 md:p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('reports')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {sitesLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : currentSite ? (
            `${currentSite.name} - ${t('generateReports')}`
          ) : (
            t('noProjectSelected')
          )}
        </p>
      </div>
      
      {/* Main Content */}
      {currentSite ? (
        <ReportGenerator siteId={currentSite.id} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-semibold mb-2">{t('noReportsYet')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            {t('selectOrCreateProject')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;