from celery import shared_task

from .models import SourcePdfBatch
from .services.pipeline import analyze_source_batch, split_and_process_source_batch


@shared_task
def analyze_source_batch_task(batch_id: int):
    batch = SourcePdfBatch.objects.get(pk=batch_id)
    analyze_source_batch(batch)
    return {"batch_id": batch_id}


@shared_task
def process_source_batch_task(batch_id: int):
    batch = SourcePdfBatch.objects.get(pk=batch_id)
    split_and_process_source_batch(batch)
    return {"batch_id": batch_id}
