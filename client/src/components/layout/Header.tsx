import { useTheme } from "next-themes";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Button } from "@/components/ui/button";
import { Menu, Moon, SunMoon } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="md:hidden bg-primary text-white p-4 fixed top-0 left-0 right-0 z-10 flex justify-between items-center shadow-md">
      <Button
        variant="ghost"
        size="icon"
        className="text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu size={24} />
      </Button>
      
      <h1 className="text-xl font-bold">{t('appName')}</h1>
      
      <Button
        variant="ghost"
        size="icon"
        className="text-white"
        onClick={toggleTheme}
      >
        {theme === "dark" ? <SunMoon size={20} /> : <Moon size={20} />}
      </Button>
    </div>
  );
};

export default Header;
