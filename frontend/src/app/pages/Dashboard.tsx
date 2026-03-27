import { useEffect, useState } from "react";
import {
  FileText,
  Users,
  Mail,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useLanguage } from "../contexts/LanguageContext";
import { useAppData } from "../contexts/AppDataContext";
import { api } from "../../lib/api";
import type { DashboardSummary } from "../../lib/types";

export function Dashboard() {
  const { t } = useLanguage();
  const { selectedCompetitionId } = useAppData();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCompetitionId) {
      setSummary(null);
      return;
    }
    setLoading(true);
    api.fetchDashboard(selectedCompetitionId)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [selectedCompetitionId]);

  const stats = [
    {
      title: t("dashboard.totalStudents"),
      value: summary?.stats.total_students ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t("dashboard.certificatesProcessed"),
      value: summary?.stats.certificates_processed ?? 0,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t("dashboard.emailsSent"),
      value: summary?.stats.emails_sent ?? 0,
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Public Links",
      value: summary?.stats.public_links ?? 0,
      icon: LinkIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">{t("dashboard.title")}</h1>
        <p className="text-gray-600 mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {!selectedCompetitionId ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-600">
            Create a competition in the Competition Setup page to start loading real data.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">{loading ? "..." : stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">Live database data</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentActivities")}</CardTitle>
            <CardDescription>{t("dashboard.latestProcessing")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(summary?.recent_activities ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No processing logs yet.</p>
              ) : (
                summary?.recent_activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {activity.status === "success" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {activity.status === "info" && <Clock className="w-5 h-5 text-blue-600" />}
                      {activity.status === "warning" && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                      {activity.status === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.message}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{new Date(activity.timestamp).toLocaleString()}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.pendingTasks")}</CardTitle>
            <CardDescription>{t("dashboard.actionsRequired")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(summary?.pending_tasks ?? []).map((task) => (
                <div
                  key={`${task.task}-${task.link}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1.5 h-8 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-500"
                          : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.task}</p>
                      <p className="text-xs text-gray-500">{task.count} item(s)</p>
                    </div>
                  </div>
                  <Link to={task.link}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
