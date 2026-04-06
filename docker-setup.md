# Docker Setup Guide - Digital HRM

## Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt nhanh](#cài-đặt-nhanh)
- [Cấu trúc Docker](#cấu-trúc-docker)
- [Development Mode](#development-mode)
- [Production Mode](#production-mode)
- [Quản lý Database](#quản-lý-database)
- [Prisma Commands](#prisma-commands)
- [Khắc phục sự cố](#khắc-phục-sự-cố)

---

## Yêu cầu hệ thống

### Software cần thiết

| Software | Phiên bản tối thiểu | Link tải |
|----------|---------------------|----------|
| Docker Desktop | 4.0+ | [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| Docker Compose | 2.0+ | (Đã có trong Docker Desktop) |

### Kiểm tra cài đặt

```bash
# Kiểm tra Docker
docker --version
# Output: Docker version 24.0.0, build xxxxx

# Kiểm tra Docker Compose
docker compose version
# Output: Docker Compose version v2.20.0
```

---

## Cài đặt nhanh

### 1. Clone/Download dự án

```bash
cd digital_hrm
```

### 2. Copy file môi trường

```bash
cp .env.docker .env
```

### 3. Chỉnh sửa file .env ( Quan trọng! )

Mở file `.env` và thay đổi các secrets:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD  # Thay đổi password
POSTGRES_DB=digital_hrm

# Authentication Secrets - BẮT BUỘC phải thay đổi!
BETTER_AUTH_SECRET=your-better-auth-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Khởi động Docker

```bash
# Development Mode
./docker.sh dev:up

# Hoặc Production Mode
./docker.sh prod:up
```

### 5. Truy cập ứng dụng

- **URL**: http://localhost:3000
- **Database Admin (pgAdmin)**: http://localhost:5050 (chỉ production)
  - Email: `admin@digitalhrm.vn`
  - Password: `admin123`

---

## Cấu trúc Docker

### Các file cấu hình

```
digital_hrm/
├── Dockerfile              # Production Dockerfile
├── Dockerfile.dev          # Development Dockerfile
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development compose
├── .env.docker            # Template env file
├── docker.sh              # Helper script
└── docker/
    └── postgres/
        └── init.sql       # Database initialization
```

### Services

| Service | Port | Mô tả |
|---------|------|--------|
| `app` | 3000 | Next.js application |
| `db` | 5432 | PostgreSQL 14 database |
| `redis` | 6379 | Redis cache (production) |
| `pgadmin` | 5050 | PostgreSQL admin UI (production, optional) |

### Volumes

| Volume | Path trong container | Mô tả |
|--------|---------------------|--------|
| `postgres_data` | `/var/lib/postgresql/data` | Lưu trữ database |
| `redis_data` | `/data` | Lưu trữ Redis cache |

---

## Development Mode

### Khởi động môi trường dev

```bash
./docker.sh dev:up
```

**Lần đầu chạy sẽ:**
1. Build Docker image từ `Dockerfile.dev`
2. Tạo PostgreSQL container
3. Chạy init.sql để khởi tạo database
4. Start ứng dụng Next.js

### Các lệnh dev

```bash
# Xem logs real-time
./docker.sh dev:logs

# Restart containers
./docker.sh dev:restart

# Rebuild images (khi có thay đổi lớn)
./docker.sh dev:rebuild

# Dừng môi trường dev
./docker.sh dev:down
```

### Tính năng Development Mode

- **Hot Reload**: Code changes tự động reload
- **Source Code Mounting**: Thư mục source được mount vào container
- **Debug Logs**: Logs chi tiết cho development

### Workflow Dev thông thường

```bash
# 1. Start environment
./docker.sh dev:up

# 2. Generate Prisma client (lần đầu)
./docker.sh prisma:generate

# 3. Push schema xuống database
./docker.sh prisma:push

# 4. Seed demo data
./docker.sh prisma:seed

# 5. Truy cập http://localhost:3000

# 6. Chỉnh sửa code - tự động reload

# 7. Xem logs
./docker.sh dev:logs

# 8. Dừng khi done
./docker.sh dev:down
```

---

## Production Mode

### Khởi động Production

```bash
# 1. Build production image
./docker.sh prod:rebuild

# 2. Start services
./docker.sh prod:up

# 3. Initialize database
./docker.sh prisma:push
./docker.sh prisma:seed
```

### Các lệnh production

```bash
# Xem logs
./docker.sh prod:logs

# Restart services
./docker.sh prod:restart

# Stop services
./docker.sh prod:down

# Rebuild images
./docker.sh prod:rebuild
```

### Tính năng Production

- **Standalone Build**: Next.js compiled output
- **Multi-stage Build**: Image nhỏ gọn (~200MB)
- **Health Checks**: Tự động kiểm tra service health
- **Redis Cache**: Hỗ trợ session management
- **pgAdmin**: Quản lý database qua web UI

### Start pgAdmin (Optional)

```bash
docker compose --profile admin up -d pgadmin
```

Truy cập http://localhost:5050 với:
- Email: `admin@digitalhrm.vn`
- Password: `admin123`

---

## Quản lý Database

### Mở PostgreSQL Shell

```bash
./docker.sh db:shell
```

**Commands PostgreSQL thông dụng:**

```sql
-- Liệt kê databases
\l

-- Kết nối database
\c digital_hrm

-- Liệt kê tables
\dt

-- Xem cấu trúc table
\d "User"

-- Liệt kê users
SELECT * FROM "User";

-- Thoát
\q
```

### Backup Database

```bash
# Tạo backup
./docker.sh db:backup

# Backup sẽ được lưu tại ./backups/digital_hrm_YYYYMMDD_HHMMSS.sql
```

### Restore Database

```bash
# Restore từ backup file
./docker.sh db:restore ./backups/digital_hrm_20240115_120000.sql
```

### Manual Backup/Restore

```bash
# Backup manual
docker exec -it digital_hrm_db pg_dump -U postgres digital_hrm > backup.sql

# Restore manual
cat backup.sql | docker exec -i digital_hrm_db psql -U postgres digital_hrm
```

---

## Prisma Commands

### Generate Prisma Client

```bash
./docker.sh prisma:generate
```

### Push Schema to Database

```bash
./docker.sh prisma:push
```

**⚠️ Cẩn thận**: Lệnh này sẽ xóa data nếu dùng `--force-reset`

```bash
# Reset database và push schema
docker compose -f docker-compose.dev.yml exec app npx prisma db push --force-reset
```

### Open Prisma Studio

```bash
./docker.sh prisma:studio
```

Truy cập http://localhost:5555

### Seed Database

```bash
./docker.sh prisma:seed
```

Seeds 9 demo users với các roles khác nhau.

---

## Khắc phục sự cố

### Container không start được

```bash
# Xem logs chi tiết
docker compose -f docker-compose.dev.yml logs

# Kiểm tra container status
docker compose -f docker-compose.dev.yml ps

# Rebuild từ đầu
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

### Database connection failed

```bash
# Kiểm tra database health
docker compose -f docker-compose.dev.yml ps db

# Restart database
docker compose -f docker-compose.dev.yml restart db

# Kiểm tra logs
docker compose -f docker-compose.dev.yml logs db
```

### Port đã được sử dụng

```bash
# Kiểm tra port đang dùng
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Kill process đang dùng port
taskkill /PID <PROCESS_ID> /F
```

### Xóa toàn bộ Docker resources

```bash
# Stop và remove containers, networks
docker compose -f docker-compose.dev.yml down

# Xóa volumes (⚠️ MẤT HẾT DATA!)
docker compose -f docker-compose.dev.yml down -v

# Xóa unused images
docker system prune -a
```

### Clear cache và rebuild

```bash
# Xóa node_modules và .next
rm -rf node_modules .next

# Rebuild
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

### Kiểm tra logs theo service

```bash
# Chỉ logs của app
docker compose -f docker-compose.dev.yml logs app

# Chỉ logs của database
docker compose -f docker-compose.dev.yml logs db

# Logs với timestamp
docker compose -f docker-compose.dev.yml logs -t

# Logs 100 dòng cuối
docker compose -f docker-compose.dev.yml logs --tail 100
```

### Exec vào container

```bash
# Vào app container
docker exec -it digital_hrm_app_dev sh

# Vào database container
docker exec -it digital_hrm_db_dev psql -U postgres digital_hrm
```

---

## Quick Reference

### Tất cả commands

```bash
# Development
./docker.sh dev:up          # Start dev
./docker.sh dev:down        # Stop dev
./docker.sh dev:restart     # Restart dev
./docker.sh dev:logs        # View dev logs
./docker.sh dev:rebuild     # Rebuild dev images

# Production
./docker.sh prod:up         # Start prod
./docker.sh prod:down       # Stop prod
./docker.sh prod:restart    # Restart prod
./docker.sh prod:logs       # View prod logs
./docker.sh prod:rebuild    # Rebuild prod images

# Database
./docker.sh db:shell        # PostgreSQL shell
./docker.sh db:backup       # Backup database
./docker.sh db:restore <f>  # Restore from file

# Prisma
./docker.sh prisma:generate # Generate Prisma client
./docker.sh prisma:push    # Push schema to DB
./docker.sh prisma:studio  # Open Prisma Studio
./docker.sh prisma:seed    # Seed demo data

# Cleanup
./docker.sh cleanup         # Clean all Docker resources
./docker.sh help            # Show all commands
```

### Environment Variables

| Variable | Mặc định | Mô tả |
|----------|----------|--------|
| `POSTGRES_USER` | postgres | PostgreSQL username |
| `POSTGRES_PASSWORD` | postgres123 | PostgreSQL password |
| `POSTGRES_DB` | digital_hrm | Database name |
| `DATABASE_URL` | auto | Connection string |
| `BETTER_AUTH_SECRET` | - | Better Auth secret (REQUIRED) |
| `BETTER_AUTH_URL`    | - | Better Auth base URL (REQUIRED) |

---

## Security Notes

### ⚠️ Trước khi Production

1. **Thay đổi tất cả secrets** trong `.env`:
   - `POSTGRES_PASSWORD`
   - `BETTER_AUTH_SECRET`

2. **Sử dụng Docker Secrets** cho production:
   ```yaml
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

3. **Enable HTTPS** với reverse proxy (nginx, traefik)

4. **Cấu hình firewall** chỉ mở port 3000 và 443

5. **Backup thường xuyên** database

### Recommended Production Setup

```bash
# 1. Tạo secrets
mkdir -p secrets
echo "your-secure-db-password" > secrets/db_password.txt
echo "your-secure-auth-secret" > secrets/auth_secret.txt

# 2. Cập nhật docker-compose.yml với secrets
# 3. Chạy với Docker Swarm hoặc Kubernetes
# 4. Cấu hình CI/CD pipeline
```
