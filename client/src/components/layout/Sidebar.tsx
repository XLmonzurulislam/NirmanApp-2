import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { Site } from "@shared/schema";
import {
  LayoutDashboard,
  PackageOpen,
  Users,
  Receipt,
  Image,
  FileBarChart,
  Languages,
  User,
  SunMoon,
  Moon,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentSite: number;
  setCurrentSite: (siteId: number) => void;
}

const Sidebar = ({ open, setOpen, currentSite, setCurrentSite }: SidebarProps) => {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const { data: sites } = useQuery<Site[]>({ 
    queryKey: ['/api/sites']
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  // Close sidebar on navigation on mobile
  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  // Create overlay on mobile when sidebar is open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    };

    // Set default state based on screen size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setOpen]);

  const navItems = [
    { href: "/", icon: <LayoutDashboard size={20} />, label: t('dashboard') },
    { href: "/materials", icon: <PackageOpen size={20} />, label: t('materials') },
    { href: "/labor", icon: <Users size={20} />, label: t('labor') },
    { href: "/expenses", icon: <Receipt size={20} />, label: t('expenses') },
    { href: "/photos", icon: <Image size={20} />, label: t('photos') },
    { href: "/reports", icon: <FileBarChart size={20} />, label: t('reports') },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:static md:translate-x-0 z-30 bg-white dark:bg-gray-800 w-64 h-full transition-transform duration-300 shadow-lg md:shadow-none overflow-y-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header - Desktop only */}
        <div className="hidden md:flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary dark:text-primary">
            {t('appName')}
          </h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <SunMoon size={20} /> : <Moon size={20} />}
          </Button>
        </div>

        {/* Project Selection */}
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('selectProject')}
          </label>
          <Select
            value={currentSite.toString()}
            onValueChange={(value) => setCurrentSite(parseInt(value))}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder={t('selectProject')} />
            </SelectTrigger>
            <SelectContent>
              {sites?.map((site) => (
                <SelectItem key={site.id} value={site.id.toString()}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <div
                  role="button"
                  onClick={() => {
                    closeSidebar();
                    window.location.href = item.href;
                  }}
                  className={`flex items-center w-full px-4 py-2 rounded-md cursor-pointer ${
                    location === item.href
                      ? 'bg-primary-50 text-primary dark:bg-gray-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-3 mt-auto border-t dark:border-gray-700 absolute bottom-0 w-full bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={toggleLanguage}
            >
              <Languages size={16} className="mr-2" />
              {language === "en" ? "বাংলা" : "English"}
            </Button>
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <User size={16} className="mr-2" />
              <span className="text-sm">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;