import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  FileText,
  Users,
  Mail,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

export function Dashboard() {
  const { t } = useLanguage();

  const stats = [
    {
      title: t("dashboard.totalStudents"),
      value: "847",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t("dashboard.certificatesProcessed"),
      value: "732",
      change: "+86%",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t("dashboard.emailsSent"),
      value: "685",
      change: "+93%",
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: t("dashboard.driveFiles"),
      value: "732",
      change: "+86%",
      icon: Cloud,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivities = [
    {
      action: t("dashboard.certificateBatchProcessed"),
      count: 156,
      status: "completed",
      time: `2 ${t("common.hours")} ${t("common.ago")}`,
    },
    {
      action: t("dashboard.emailCampaignSent"),
      count: 145,
      status: "completed",
      time: `5 ${t("common.hours")} ${t("common.ago")}`,
    },
    {
      action: t("dashboard.driveSyncInProgress"),
      count: 89,
      status: "processing",
      time: t("dashboard.justNow"),
    },
    {
      action: t("dashboard.matchReviewPending"),
      count: 23,
      status: "warning",
      time: `1 ${t("common.day")} ${t("common.ago")}`,
    },
  ];

  const pendingTasks = [
    {
      task: t("dashboard.reviewUnmatched"),
      count: 23,
      priority: "high",
      link: "/match",
    },
    {
      task: t("dashboard.retryFailed"),
      count: 12,
      priority: "medium",
      link: "/email",
    },
    {
      task: t("dashboard.updateStudent"),
      count: 1,
      priority: "low",
      link: "/students",
    },
    {
      task: t("dashboard.configureNaming"),
      count: 1,
      priority: "low",
      link: "/settings",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">{t("dashboard.title")}</h1>
        <p className="text-gray-600 mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">{stat.change}</span>
                  <span className="text-xs text-gray-500">{t("dashboard.fromLastMonth")}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentActivities")}</CardTitle>
            <CardDescription>{t("dashboard.latestProcessing")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activity.status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {activity.status === "processing" && (
                      <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {activity.status === "warning" && (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{activity.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.pendingTasks")}</CardTitle>
            <CardDescription>{t("dashboard.actionsRequired")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                      {task.count > 1 && (
                        <p className="text-xs text-gray-500">{task.count} {t("dashboard.items")}</p>
                      )}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          <CardDescription>{t("dashboard.commonWorkflows")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Link to="/certificates">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-sm">{t("dashboard.uploadCertificates")}</span>
              </Button>
            </Link>
            <Link to="/students">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">{t("dashboard.syncStudentData")}</span>
              </Button>
            </Link>
            <Link to="/match">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-sm">{t("dashboard.reviewMatches")}</span>
              </Button>
            </Link>
            <Link to="/email">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Mail className="w-6 h-6" />
                <span className="text-sm">{t("dashboard.sendEmails")}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}