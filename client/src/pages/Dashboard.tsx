import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import DashboardStats from "@/components/dashboard/DashboardStats";
import MaterialChart from "@/components/dashboard/MaterialChart";
import RecentActivities from "@/components/dashboard/RecentActivities";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import QuickActions from "@/components/dashboard/QuickActions";
import { Site } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { t } = useLanguage();

  const { data: sites, isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Use the first site as default
  const currentSite = sites?.[0];

  return (
    <div className="p-4 md:p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('dashboard')}
          </h1>
          {sitesLoading ? (
            <Skeleton className="h-5 w-48 text-gray-600 dark:text-gray-400" />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              {currentSite ? 
                `${currentSite.name} - ${t('dashboardOverview')}` : 
                t('noProjectSelected')
              }
            </p>
          )}
        </div>

        <div className="mt-4 md:mt-0 flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">{t('today')}:</span>
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Main Content */}
      {currentSite ? (
        <>
          {/* Stats Cards */}
          <DashboardStats siteId={currentSite.id} />

          {/* Charts & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <MaterialChart siteId={currentSite.id} />
            <RecentActivities siteId={currentSite.id} />
          </div>

          {/* Material Stock & Quick Access */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LowStockAlert siteId={currentSite.id} />
            <QuickActions />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold mb-2">{t('welcomeToNirmanDiary')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            {t('noProjectsYet')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;