from apps.auditlog.models import AuditLog


def write_audit_log(*, competition=None, actor=None, object_type="", object_id="", action="", status="info", message="", details=None):
    return AuditLog.objects.create(
        competition=competition,
        actor=actor,
        object_type=object_type,
        object_id=str(object_id) if object_id else "",
        action=action,
        status=status,
        message=message,
        details_json=details or {},
    )
