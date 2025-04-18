import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { useLocation } from "wouter";
import LaborList from "@/components/labor/LaborList";
import LaborForm from "@/components/labor/LaborForm";
import AttendanceForm from "@/components/labor/AttendanceForm";
import { Site } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Labor = () => {
  const { t } = useLanguage();
  const [location] = useLocation();
  
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(location.includes("action=attendance"));
  
  const { data: sites, isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });
  
  // Use the first site as default
  const currentSite = sites?.[0];
  
  const handleOpenAddForm = () => {
    setAddFormOpen(true);
  };
  
  const handleCloseAddForm = () => {
    setAddFormOpen(false);
  };
  
  const handleOpenAttendanceForm = () => {
    setAttendanceFormOpen(true);
  };
  
  const handleCloseAttendanceForm = () => {
    setAttendanceFormOpen(false);
  };

  return (
    <div className="p-4 md:p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('laborAndWorkers')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {sitesLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : currentSite ? (
              `${currentSite.name} - ${t('manageWorkersAttendance')}`
            ) : (
              t('noProjectSelected')
            )}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      {currentSite ? (
        <>
          <LaborList 
            siteId={currentSite.id}
            onOpenAddForm={handleOpenAddForm}
            onOpenAttendanceForm={handleOpenAttendanceForm}
          />
          
          <LaborForm 
            siteId={currentSite.id}
            open={addFormOpen}
            onClose={handleCloseAddForm}
          />
          
          <AttendanceForm 
            siteId={currentSite.id}
            open={attendanceFormOpen}
            onClose={handleCloseAttendanceForm}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">👷</div>
          <h2 className="text-xl font-semibold mb-2">{t('noWorkersYet')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            {t('selectOrCreateProject')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Labor;
