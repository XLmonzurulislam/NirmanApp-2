import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { useLocation } from "wouter";
import MaterialList from "@/components/materials/MaterialList";
import MaterialForm from "@/components/materials/MaterialForm";
import MaterialUsageForm from "@/components/materials/MaterialUsageForm";
import { Site } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Materials = () => {
  const { t } = useLanguage();
  const [location] = useLocation();
  
  const [addFormOpen, setAddFormOpen] = useState(location.includes("action=add"));
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [usageFormOpen, setUsageFormOpen] = useState(false);
  
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
  
  const handleOpenUsageForm = (materialId: number) => {
    setSelectedMaterial(materialId);
    setUsageFormOpen(true);
  };
  
  const handleCloseUsageForm = () => {
    setSelectedMaterial(null);
    setUsageFormOpen(false);
  };

  return (
    <div className="p-4 md:p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('materialTracker')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {sitesLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : currentSite ? (
              `${currentSite.name} - ${t('manageMaterials')}`
            ) : (
              t('noProjectSelected')
            )}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      {currentSite ? (
        <>
          <MaterialList 
            siteId={currentSite.id}
            onOpenAddForm={handleOpenAddForm}
            onOpenUsageForm={handleOpenUsageForm}
          />
          
          <MaterialForm 
            siteId={currentSite.id}
            open={addFormOpen}
            onClose={handleCloseAddForm}
          />
          
          <MaterialUsageForm 
            siteId={currentSite.id}
            materialId={selectedMaterial}
            open={usageFormOpen}
            onClose={handleCloseUsageForm}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🧱</div>
          <h2 className="text-xl font-semibold mb-2">{t('noMaterialsYet')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            {t('selectOrCreateProject')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Materials;
