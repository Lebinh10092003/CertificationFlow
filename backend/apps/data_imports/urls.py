from django.urls import path

from .views import (
    DataImportJobDetailView,
    DataImportJobListView,
    ImportFileExecuteView,
    ImportFileInspectView,
    ImportFileUploadView,
)


urlpatterns = [
    path("import-jobs/", DataImportJobListView.as_view(), name="import-job-list"),
    path("import-jobs/<int:pk>/", DataImportJobDetailView.as_view(), name="import-job-detail"),
    path("competitions/<int:competition_id>/import-file/", ImportFileUploadView.as_view(), name="import-file"),
    path("competitions/<int:competition_id>/import-file/inspect/", ImportFileInspectView.as_view(), name="import-file-inspect"),
    path("competitions/<int:competition_id>/import-file/execute/", ImportFileExecuteView.as_view(), name="import-file-execute"),
]
