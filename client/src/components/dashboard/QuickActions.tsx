import { useLanguage } from "@/components/layout/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import {
  SquarePlus,
  UserCheck,
  Receipt,
  ImagePlus,
  FileText,
  NotepadText
} from "lucide-react";

const QuickActions = () => {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  
  const actions = [
    {
      icon: <SquarePlus size={20} className="text-primary dark:text-primary-400 mb-1" />,
      label: t('addMaterials'),
      onClick: () => navigate('/materials?action=add')
    },
    {
      icon: <UserCheck size={20} className="text-primary dark:text-primary-400 mb-1" />,
      label: t('markAttendance'),
      onClick: () => navigate('/labor?action=attendance')
    },
    {
      icon: <Receipt size={20} className="text-primary dark:text-primary-400 mb-1" />,
      label: t('addExpense'),
      onClick: () => navigate('/expenses?action=add')
    },
    {
      icon: <ImagePlus size={20} className="text-primary dark:text-primary-400 mb-1" />,
      label: t('uploadPhotos'),
      onClick: () => navigate('/photos?action=upload')
    },
    {
      icon: <FileText size={20} className="text-primary dark:text-primary-400 mb-1" />,
      label: t('generateReport'),
      onClick: () => navigate('/reports')
    },
    {
      icon: <NotepadText size={20} className="text-primary dark:text-primary-400 mb-1" />,
      label: t('addNote'),
      onClick: () => navigate('/photos?action=note')
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">
          {t('quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="bg-primary-50 dark:bg-gray-700 p-3 rounded-lg flex flex-col items-center justify-center hover:bg-primary-100 dark:hover:bg-gray-600 transition-colors"
            >
              {action.icon}
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
