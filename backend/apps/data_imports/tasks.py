from celery import shared_task

from .models import DataImportJob
from .services.google_sheets import sync_google_sheet
from .services.tabular import import_uploaded_file


@shared_task
def process_import_job(job_id: int):
    job = DataImportJob.objects.get(pk=job_id)
    if job.source_type == DataImportJob.SourceType.GOOGLE_SHEETS:
        return sync_google_sheet(job).__dict__
    return import_uploaded_file(job).__dict__
