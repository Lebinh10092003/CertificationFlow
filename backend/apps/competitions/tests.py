from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.certificates.models import CertificateExtraction, CertificateMatch, CertificatePage, SourcePdfBatch
from apps.competitions.models import Competition
from apps.participants.models import CompetitionEnrollment, CompetitionResult, Participant


class AdminSessionAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.user = get_user_model().objects.create_user(
            username="Admin",
            password="Lebinhtv2003!",
            is_staff=True,
            is_superuser=True,
        )
        self.competition = Competition.objects.create(
            name="SCO International Coding Olympiad",
            academic_year="2026-2027",
            subject="ICO",
        )
        participant = Participant.objects.create(
            external_student_id="ST001",
            full_name="Pham Ngoc Ban",
            normalized_name="pham ngoc ban",
            email="ban@example.com",
            school_name="VPlus Academy",
            normalized_school_name="vplus academy",
            grade="8",
        )
        enrollment = CompetitionEnrollment.objects.create(
            competition=self.competition,
            participant=participant,
            source_row_number=2,
            subject="ICO",
        )
        result = CompetitionResult.objects.create(
            competition_enrollment=enrollment,
            award="Merit",
            certificate_code="ICO-8-001",
            qualified_round="Yes",
        )
        batch = SourcePdfBatch.objects.create(
            competition=self.competition,
            original_filename="public.pdf",
            confirmed_competition_name=self.competition.name,
            competition_confirmation_status=SourcePdfBatch.ConfirmationStatus.CONFIRMED,
            status=SourcePdfBatch.Status.COMPLETED,
        )
        batch.uploaded_file.save("public.pdf", ContentFile(b"%PDF-1.4"), save=True)
        self.page = CertificatePage.objects.create(
            source_batch=batch,
            page_number=1,
            output_filename="pham-ngoc-ban-merit-ico-8.pdf",
            public_slug="pham-ngoc-ban-merit-ico-8",
            public_url="https://103.142.27.156/c/pham-ngoc-ban-merit-ico-8",
            processing_status=CertificatePage.ProcessingStatus.MATCHED,
        )
        self.page.split_pdf_file.save("page_193.pdf", ContentFile(b"%PDF-1.4"), save=True)
        CertificateExtraction.objects.create(
            certificate_page=self.page,
            student_name="Pham Ngoc Ban",
            normalized_student_name="pham ngoc ban",
            school_name="VPlus Academy",
            normalized_school_name="vplus academy",
            grade="8",
            award="Merit",
            subject="ICO",
            competition_name=self.competition.name,
            certificate_code="ICO-8-001",
            qualified_round="Yes",
        )
        CertificateMatch.objects.create(
            certificate_page=self.page,
            competition_enrollment=enrollment,
            competition_result=result,
            confidence_score=100,
            confidence_label=CertificateMatch.ConfidenceLabel.HIGH,
            matched_by=CertificateMatch.MatchedBy.CERTIFICATE_CODE,
            requires_review=False,
            is_approved=True,
            rationale="Exact match",
        )

    def _get_csrf_token(self):
        response = self.client.get("/api/auth/session/")
        self.assertEqual(response.status_code, 200)
        return response.cookies["csrftoken"].value

    def test_private_api_requires_authentication(self):
        response = self.client.get("/api/competitions/")

        self.assertEqual(response.status_code, 401)

    def test_public_certificate_and_pdf_remain_public(self):
        page_response = self.client.get(f"/api/public-certificates/{self.page.public_slug}/")
        pdf_response = self.client.get(f"/api/certificate-pages/{self.page.id}/pdf/")

        self.assertEqual(page_response.status_code, 200)
        self.assertEqual(pdf_response.status_code, 200)

    def test_session_endpoint_reports_anonymous_and_authenticated_states(self):
        anonymous_response = self.client.get("/api/auth/session/")
        csrf_token = anonymous_response.cookies["csrftoken"].value

        login_response = self.client.post(
            "/api/auth/login/",
            {"username": "Admin", "password": "Lebinhtv2003!"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        authenticated_response = self.client.get("/api/auth/session/")

        self.assertEqual(anonymous_response.status_code, 200)
        self.assertFalse(anonymous_response.json()["authenticated"])
        self.assertEqual(login_response.status_code, 200)
        self.assertTrue(authenticated_response.json()["authenticated"])
        self.assertEqual(authenticated_response.json()["user"]["username"], "Admin")

    def test_logout_clears_session(self):
        csrf_token = self._get_csrf_token()
        self.client.post(
            "/api/auth/login/",
            {"username": "Admin", "password": "Lebinhtv2003!"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        logout_token = self.client.cookies["csrftoken"].value

        logout_response = self.client.post(
            "/api/auth/logout/",
            {},
            format="json",
            HTTP_X_CSRFTOKEN=logout_token,
        )
        private_response = self.client.get("/api/competitions/")

        self.assertEqual(logout_response.status_code, 200)
        self.assertFalse(logout_response.json()["authenticated"])
        self.assertEqual(private_response.status_code, 401)
