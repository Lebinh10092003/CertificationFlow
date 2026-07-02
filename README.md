# CertificationFlow

## Chạy local

```powershell
# Backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
.\.venv\Scripts\python backend\manage.py migrate
.\.venv\Scripts\python backend\manage.py runserver

# Frontend (tab mới)
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Google Drive (local)

```bash
gcloud auth application-default login
```

Đăng nhập tài khoản Google cá nhân. Không cần cấu hình thêm — backend tự dùng tài khoản đó để upload.

> Chưa có gcloud? Tải tại https://cloud.google.com/sdk/docs/install

## Deploy (production)

Thêm vào `backend/.env`:

```env
DATABASE_URL=postgres://user:pass@host:5432/db
CELERY_BROKER_URL=redis://host:6379/0
CELERY_RESULT_BACKEND=redis://host:6379/0
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}   # thay vì ADC
SECRET_KEY=...
ALLOWED_HOSTS=yourdomain.com
```

Tạo service account trên [Google Cloud Console](https://console.cloud.google.com) → download JSON key → share folder Drive với email service account (Editor).

```powershell
docker compose up -d postgres redis
.\.venv\Scripts\python backend\manage.py migrate
.\.venv\Scripts\python backend\manage.py collectstatic
```

## Sử dụng Drive Export

1. Import danh sách học sinh (Excel/CSV)
2. Upload PDF chứng nhận → xác nhận cuộc thi
3. Match Review → duyệt từng trang
4. Export Certificates → paste link folder Drive → **Save Folder** → **Upload to Drive**
5. **Prepare Excel Export** → chọn cột → tải về (cột Drive Link có sẵn mặc định)
