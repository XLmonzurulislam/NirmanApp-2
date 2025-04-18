import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MaterialTransaction, 
  Expense, 
  Photo, 
  Attendance 
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PlusCircle, 
  Users, 
  Image, 
  ReceiptText 
} from "lucide-react";

interface RecentActivitiesProps {
  siteId: number;
}

// Combined activity type
interface Activity {
  type: 'material' | 'expense' | 'photo' | 'attendance';
  title: string;
  detail: string;
  timestamp: Date;
  icon: JSX.Element;
  iconBg: string;
}

const RecentActivities = ({ siteId }: RecentActivitiesProps) => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const { data: materialTransactions, isLoading: loadingTransactions } = useQuery<MaterialTransaction[]>({
    queryKey: [`/api/sites/${siteId}/material-transactions`],
    enabled: !!siteId,
  });
  
  const { data: expenses, isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: [`/api/sites/${siteId}/expenses`],
    enabled: !!siteId,
  });
  
  const { data: photos, isLoading: loadingPhotos } = useQuery<Photo[]>({
    queryKey: [`/api/sites/${siteId}/photos`],
    enabled: !!siteId,
  });
  
  const { data: attendanceRecords, isLoading: loadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/sites/${siteId}/attendance`],
    enabled: !!siteId,
  });

  useEffect(() => {
    if (!materialTransactions && !expenses && !photos && !attendanceRecords) return;
    
    const allActivities: Activity[] = [];
    
    // Add material transactions
    if (materialTransactions) {
      materialTransactions.forEach(transaction => {
        if (transaction.transactionType === 'added') {
          allActivities.push({
            type: 'material',
            title: t('materialAdded'),
            detail: `${transaction.quantity} ${t('units')} • ${getTimeAgo(transaction.date)}`,
            timestamp: new Date(transaction.date),
            icon: <PlusCircle size={16} />,
            iconBg: 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400',
          });
        }
      });
    }
    
    // Add attendance records
    if (attendanceRecords) {
      // Group attendance by date
      const groupedAttendance = attendanceRecords.reduce((acc, record) => {
        const dateString = new Date(record.date).toISOString().split('T')[0];
        if (!acc[dateString]) {
          acc[dateString] = [];
        }
        acc[dateString].push(record);
        return acc;
      }, {} as Record<string, Attendance[]>);
      
      Object.entries(groupedAttendance).forEach(([date, records]) => {
        allActivities.push({
          type: 'attendance',
          title: t('workerAttendanceMarked'),
          detail: `${records.length} ${t('workers')} • ${getTimeAgo(new Date(date))}`,
          timestamp: new Date(date),
          icon: <Users size={16} />,
          iconBg: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
        });
      });
    }
    
    // Add photo uploads
    if (photos) {
      // Group photos by date
      const photosByDate = photos.reduce((acc, photo) => {
        const dateString = new Date(photo.date).toISOString().split('T')[0];
        if (!acc[dateString]) {
          acc[dateString] = [];
        }
        acc[dateString].push(photo);
        return acc;
      }, {} as Record<string, Photo[]>);
      
      Object.entries(photosByDate).forEach(([date, photoGroup]) => {
        allActivities.push({
          type: 'photo',
          title: t('photoUploaded'),
          detail: `${photoGroup.length} ${t('photos')} • ${getTimeAgo(new Date(date))}`,
          timestamp: new Date(date),
          icon: <Image size={16} />,
          iconBg: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
        });
      });
    }
    
    // Add expenses
    if (expenses) {
      expenses.forEach(expense => {
        allActivities.push({
          type: 'expense',
          title: t('expenseRecorded'),
          detail: `৳ ${expense.amount.toLocaleString()} • ${getTimeAgo(new Date(expense.date))}`,
          timestamp: new Date(expense.date),
          icon: <ReceiptText size={16} />,
          iconBg: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
        });
      });
    }
    
    // Sort by timestamp (newest first) and limit to 4
    allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setActivities(allActivities.slice(0, 4));
  }, [materialTransactions, expenses, photos, attendanceRecords, t]);

  // Helper function to format time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} ${t('minutesAgo')}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${t('hoursAgo')}`;
    } else if (diffDays < 30) {
      return `${diffDays} ${t('daysAgo')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isLoading = loadingTransactions || loadingExpenses || loadingPhotos || loadingAttendance;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
          {t('recentActivities')}
        </h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            {t('noRecentActivities')}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex">
                <div className="flex-shrink-0">
                  <span className={`flex h-8 w-8 rounded-full ${activity.iconBg} items-center justify-center`}>
                    {activity.icon}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
