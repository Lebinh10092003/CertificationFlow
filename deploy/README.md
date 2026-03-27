# Deployment Notes

This project is deployed on a Linux VPS with:

- `nginx` serving `frontend/dist`
- `gunicorn` serving Django on `127.0.0.1:8000`
- `celery` worker using Redis
- PostgreSQL database `flow`

Template files:

- `deploy/nginx/certificationflow.conf`
- `deploy/nginx/certificationflow-https.conf`
- `deploy/systemd/certificationflow-web.service`
- `deploy/systemd/certificationflow-celery.service`

Expected server layout:

- app: `/opt/certificationflow/app`
- venv: `/opt/certificationflow/venv`
