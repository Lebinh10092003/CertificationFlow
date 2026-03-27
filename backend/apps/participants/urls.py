from django.urls import path

from .views import CompetitionStudentListView


urlpatterns = [
    path("students/", CompetitionStudentListView.as_view(), name="student-list"),
]
