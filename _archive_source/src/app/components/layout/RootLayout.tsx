import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Trophy,
  Users,
  FileText,
  GitCompare,
  Cloud,
  Mail,
  ScrollText,
  Settings as SettingsIcon,
  Bell,
  ChevronDown,
  Plus,
  Languages,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLanguage } from "../../contexts/LanguageContext";

export function RootLayout() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { path: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { path: "/competitions", label: t("nav.competitions"), icon: Trophy },
    { path: "/students", label: t("nav.students"), icon: Users },
    { path: "/certificates", label: t("nav.certificates"), icon: FileText },
    { path: "/match", label: t("nav.match"), icon: GitCompare },
    { path: "/drive", label: t("nav.drive"), icon: Cloud },
    { path: "/email", label: t("nav.email"), icon: Mail },
    { path: "/logs", label: t("nav.logs"), icon: ScrollText },
    { path: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">CertMailHub</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@school.edu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Competition Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>Math Olympiad 2026</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>{t("header.selectCompetition")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Math Olympiad 2026</DropdownMenuItem>
                <DropdownMenuItem>Science Fair 2026</DropdownMenuItem>
                <DropdownMenuItem>English Contest Q1 2026</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("header.newCompetition")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4">
            {/* Google Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700">{t("header.googleConnected")}</span>
            </div>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Languages className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setLanguage("vi")}
                  className={language === "vi" ? "bg-blue-50" : ""}
                >
                  <span className="mr-2">🇻🇳</span>
                  Tiếng Việt
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage("en")}
                  className={language === "en" ? "bg-blue-50" : ""}
                >
                  <span className="mr-2">🇬🇧</span>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* New Process Button */}
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t("header.newProcess")}
            </Button>

            {/* User Avatar */}
            <Avatar className="w-9 h-9">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}