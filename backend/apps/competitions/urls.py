from django.urls import path

from .views import CompetitionDetailView, CompetitionListCreateView, DashboardSummaryView


urlpatterns = [
    path("competitions/", CompetitionListCreateView.as_view(), name="competition-list"),
    path("competitions/<int:pk>/", CompetitionDetailView.as_view(), name="competition-detail"),
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
]
