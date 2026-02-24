# Digital HRM

Hệ thống quản lý nhân sự thông minh xây dựng trên **Next.js 16**, **Prisma**, **PostgreSQL** và **Better Auth**.

---

## Yêu cầu hệ thống

| Công cụ    | Phiên bản tối thiểu |
| ---------- | ------------------- |
| Node.js    | 20+                 |
| pnpm       | 9+                  |
| PostgreSQL | 14+                 |

---

## Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone https://github.com/<your-org>/digital_hrm.git
cd digital_hrm
```

### 2. Cài đặt dependencies

```bash
pnpm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc:

```env
# Database
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>"

# Better Auth
BETTER_AUTH_SECRET="<random-secret-string>"
BETTER_AUTH_URL="http://localhost:3000"
```

> **Lưu ý:** `BETTER_AUTH_SECRET` nên là một chuỗi ngẫu nhiên dài ít nhất 32 ký tự. Có thể tạo bằng lệnh:
>
> ```bash
> openssl rand -base64 32
> ```

### 4. Tạo database schema

```bash
pnpm prisma migrate deploy
```

> Nếu đang ở môi trường **development** lần đầu:
>
> ```bash
> pnpm prisma migrate dev
> ```

### 5. Seed dữ liệu mẫu

```bash
pnpm tsx prisma/seed.ts
```

Lệnh này sẽ tạo tài khoản admin mặc định và dữ liệu mẫu ban đầu.

### 6. Generate Prisma Client

```bash
pnpm prisma generate
```

### 7. Chạy ứng dụng

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

---

## Scripts

| Lệnh                      | Mô tả                            |
| ------------------------- | -------------------------------- |
| `pnpm dev`                | Chạy development server          |
| `pnpm build`              | Build production                 |
| `pnpm start`              | Chạy production server           |
| `pnpm lint`               | Kiểm tra lỗi ESLint              |
| `pnpm prisma studio`      | Mở Prisma Studio để xem database |
| `pnpm prisma migrate dev` | Tạo và áp dụng migration mới     |
| `pnpm tsx prisma/seed.ts` | Seed dữ liệu mẫu                 |

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **Database ORM:** [Prisma 7](https://www.prisma.io) + PostgreSQL
- **Authentication:** [Better Auth](https://better-auth.com)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)
- **Icons:** [Lucide React](https://lucide.dev)
