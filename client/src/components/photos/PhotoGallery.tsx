import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Photo } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Search, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PhotoGalleryProps {
  siteId: number;
}

const PhotoGallery = ({ siteId }: PhotoGalleryProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [tabView, setTabView] = useState("grid");

  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: [`/api/sites/${siteId}/photos`],
    enabled: !!siteId,
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      return await apiRequest("DELETE", `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/photos`] });
      toast({
        title: t('photoDeleted'),
        description: t('photoDeletedSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('photoDeleteFailed'),
        variant: "destructive",
      });
    }
  });

  // Group photos by date
  const groupPhotosByDate = () => {
    if (!photos) return {};
    
    return photos.reduce((acc, photo) => {
      const date = new Date(photo.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(photo);
      return acc;
    }, {} as Record<string, Photo[]>);
  };

  // Filter photos based on search and date
  const filteredPhotos = photos?.filter(photo => {
    const matchesSearch = searchTerm === "" || 
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.description && photo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const photoDate = new Date(photo.date);
      const today = new Date();
      
      if (dateFilter === "today") {
        matchesDate = photoDate.toDateString() === today.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchesDate = photoDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        matchesDate = photoDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const handleDeletePhoto = (photoId: number) => {
    if (window.confirm(t('confirmPhotoDelete'))) {
      deletePhotoMutation.mutate(photoId);
    }
  };

  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder={t('searchPhotos')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('dateRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTime')}</SelectItem>
                <SelectItem value="today">{t('today')}</SelectItem>
                <SelectItem value="week">{t('lastWeek')}</SelectItem>
                <SelectItem value="month">{t('lastMonth')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Tabs defaultValue="grid" className="hidden md:block" onValueChange={setTabView}>
              <TabsList>
                <TabsTrigger value="grid">{t('gridView')}</TabsTrigger>
                <TabsTrigger value="timeline">{t('timelineView')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-md" />
            ))}
          </div>
        ) : !filteredPhotos || filteredPhotos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('noPhotosFound')}</h3>
            <p>{t('noPhotosDescription')}</p>
          </div>
        ) : tabView === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <div key={photo.id} className="relative group rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src={photo.imageUrl} 
                  alt={photo.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <h3 className="text-white font-medium truncate">{photo.title}</h3>
                  {photo.description && (
                    <p className="text-white text-sm truncate">{photo.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-white text-xs">
                      <Clock size={12} className="mr-1" />
                      {getRelativeTime(photo.date)}
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupPhotosByDate()).map(([date, dayPhotos]) => (
              <div key={date}>
                <h3 className="font-medium text-lg mb-2">{date}</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {dayPhotos.filter(photo => {
                    const matchesSearch = searchTerm === "" || 
                      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (photo.description && photo.description.toLowerCase().includes(searchTerm.toLowerCase()));
                    return matchesSearch;
                  }).map((photo) => (
                    <div key={photo.id} className="relative group rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-2">
                        <h4 className="font-medium truncate">{photo.title}</h4>
                        {photo.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{photo.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                            <Clock size={12} className="mr-1" />
                            {new Date(photo.date).toLocaleTimeString()}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotoGallery;
