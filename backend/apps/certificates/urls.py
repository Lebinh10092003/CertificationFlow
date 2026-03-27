from django.urls import path

from .views import (
    CertificateMatchApproveView,
    CertificateMatchBulkReviewView,
    CertificateMatchListView,
    CompetitionExportColumnsView,
    CompetitionExportView,
    CertificatePageDetailUpdateView,
    CertificatePageListView,
    CertificatePagePdfView,
    PublicCertificateDetailView,
    SourcePdfBatchConfirmCompetitionView,
    SourcePdfBatchExportColumnsView,
    SourcePdfBatchDetailView,
    SourcePdfBatchExportView,
    SourcePdfBatchListCreateView,
    SourcePdfBatchProcessView,
)


urlpatterns = [
    path("certificate-batches/", SourcePdfBatchListCreateView.as_view(), name="batch-list"),
    path("certificate-batches/<int:pk>/", SourcePdfBatchDetailView.as_view(), name="batch-detail"),
    path("certificate-batches/<int:batch_id>/confirm-competition/", SourcePdfBatchConfirmCompetitionView.as_view(), name="batch-confirm-competition"),
    path("certificate-batches/<int:batch_id>/process/", SourcePdfBatchProcessView.as_view(), name="batch-process"),
    path("certificate-batches/<int:batch_id>/export-columns/", SourcePdfBatchExportColumnsView.as_view(), name="batch-export-columns"),
    path("certificate-batches/<int:batch_id>/export/", SourcePdfBatchExportView.as_view(), name="batch-export"),
    path("competitions/<int:competition_id>/certificate-export-columns/", CompetitionExportColumnsView.as_view(), name="competition-export-columns"),
    path("competitions/<int:competition_id>/certificate-export/", CompetitionExportView.as_view(), name="competition-export"),
    path("certificate-pages/", CertificatePageListView.as_view(), name="certificate-page-list"),
    path("certificate-pages/<int:page_id>/pdf/", CertificatePagePdfView.as_view(), name="certificate-page-pdf"),
    path("certificate-pages/<int:pk>/", CertificatePageDetailUpdateView.as_view(), name="certificate-page-detail"),
    path("certificate-matches/", CertificateMatchListView.as_view(), name="certificate-match-list"),
    path("certificate-matches/<int:match_id>/approve/", CertificateMatchApproveView.as_view(), name="certificate-match-approve"),
    path("certificate-matches/bulk-review/", CertificateMatchBulkReviewView.as_view(), name="certificate-match-bulk-review"),
    path("public-certificates/<slug:public_slug>/", PublicCertificateDetailView.as_view(), name="public-certificate-detail"),
]
