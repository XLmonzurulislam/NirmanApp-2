import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { useLocation } from "wouter";
import PhotoGallery from "@/components/photos/PhotoGallery";
import PhotoUpload from "@/components/photos/PhotoUpload";
import { Site } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

const Photos = () => {
  const { t } = useLanguage();
  const [location] = useLocation();
  
  const [uploadFormOpen, setUploadFormOpen] = useState(location.includes("action=upload"));
  
  const { data: sites, isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });
  
  // Use the first site as default
  const currentSite = sites?.[0];
  
  const handleOpenUploadForm = () => {
    setUploadFormOpen(true);
  };
  
  const handleCloseUploadForm = () => {
    setUploadFormOpen(false);
  };

  return (
    <div className="p-4 md:p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('photoGallery')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {sitesLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : currentSite ? (
              `${currentSite.name} - ${t('documentProgress')}`
            ) : (
              t('noProjectSelected')
            )}
          </p>
        </div>
        
        {currentSite && (
          <Button 
            className="mt-4 md:mt-0" 
            onClick={handleOpenUploadForm}
          >
            <Camera size={16} className="mr-2" />
            {t('uploadPhoto')}
          </Button>
        )}
      </div>
      
      {/* Main Content */}
      {currentSite ? (
        <>
          <PhotoGallery siteId={currentSite.id} />
          
          <PhotoUpload 
            siteId={currentSite.id}
            open={uploadFormOpen}
            onClose={handleCloseUploadForm}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">📸</div>
          <h2 className="text-xl font-semibold mb-2">{t('noPhotosYet')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            {t('selectOrCreateProject')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Photos;