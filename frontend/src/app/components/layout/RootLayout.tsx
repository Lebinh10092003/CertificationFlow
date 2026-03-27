import { Link, Outlet, useLocation } from "react-router";
import {
  Bell,
  ChevronDown,
  Download,
  FileText,
  GitCompare,
  Languages,
  LayoutDashboard,
  Mail,
  Plus,
  ScrollText,
  Settings as SettingsIcon,
  Trophy,
  Users,
} from "lucide-react";

import { useAppData } from "../../contexts/AppDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function RootLayout() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const { competitions, selectedCompetition, selectedCompetitionId, setSelectedCompetitionId } = useAppData();

  const navItems = [
    { path: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { path: "/competitions", label: t("nav.competitions"), icon: Trophy },
    { path: "/students", label: t("nav.students"), icon: Users },
    { path: "/certificates", label: t("nav.certificates"), icon: FileText },
    { path: "/match", label: t("nav.match"), icon: GitCompare },
    { path: "/export", label: "Export Excel", icon: Download },
    { path: "/email", label: t("nav.email"), icon: Mail },
    { path: "/logs", label: t("nav.logs"), icon: ScrollText },
    { path: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">CertificationFlow</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() || "AD"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user?.username ?? "Admin User"}</p>
              <p className="truncate text-xs text-gray-500">{user?.username ?? "Django session"}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>{selectedCompetition?.name ?? "No competition"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>{t("header.selectCompetition")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {competitions.map((competition) => (
                  <DropdownMenuItem
                    key={competition.id}
                    onClick={() => setSelectedCompetitionId(competition.id)}
                    className={selectedCompetitionId === competition.id ? "bg-blue-50" : ""}
                  >
                    {competition.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/competitions" className="text-blue-600">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("header.newCompetition")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("vi")} className={language === "vi" ? "bg-blue-50" : ""}>
                  Tieng Viet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-blue-50" : ""}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>

            <Button asChild className="gap-2">
              <Link to="/certificates">
                <Plus className="h-4 w-4" />
                {t("header.newProcess")}
              </Link>
            </Button>

            <Button variant="outline" onClick={() => void logout()}>
              Logout
            </Button>

            <Avatar className="h-9 w-9">
              <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() || "AD"}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
