# QA — Module Chấm Công (Toàn bộ)

> **Role:** Senior QA Engineer & Technical Writer
> **Phạm vi:** `src/app/(protected)/attendance/` — tất cả sub-module
> **Ngày:** 2025

---

## Nhiệm vụ 1 — Bộ Test Cases

### Chú thích mức độ ưu tiên

| Ký hiệu | Nghĩa                            |
| ------- | -------------------------------- |
| 🔴      | Critical — chặn production       |
| 🟠      | High — ảnh hưởng nghiệp vụ chính |
| 🟡      | Medium — UX hoặc edge case       |
| 🟢      | Low — cải thiện nhỏ              |

---

### GROUP 1 — Check-in / Check-out (Dashboard)

| ID       | Mô tả                                         | Điều kiện tiên quyết                                               | Bước thực hiện                                      | Kết quả mong đợi                                                            | Mức độ |
| -------- | --------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| TC-CI-01 | Check-in bình thường đúng giờ                 | Có ca phân công hôm nay, chưa check-in                             | 1. Mở trang /attendance 2. Nhấn "Check-in"          | Ghi nhận PRESENT, hiện thời gian check-in, `lateMinutes = 0`                | 🔴     |
| TC-CI-02 | Check-in muộn vượt ngưỡng                     | Ca bắt đầu 08:00, `lateThreshold = 15`, check-in lúc 08:20         | Nhấn "Check-in"                                     | Status = LATE, `lateMinutes = 20`, toast cảnh báo                           | 🔴     |
| TC-CI-03 | Check-in khi không có ca                      | Nhân viên không được phân ca hôm nay                               | Nhấn "Check-in"                                     | Lỗi "Bạn không có ca làm việc hôm nay. Vui lòng liên hệ quản lý."           | 🔴     |
| TC-CI-04 | Check-in lần 2 cùng ngày                      | Đã check-in thành công                                             | Nhấn "Check-in" lại                                 | Lỗi "Bạn đã check-in cho ngày hôm nay rồi!"                                 | 🔴     |
| TC-CI-05 | Check-in có nhiều ca, ưu tiên ca đang chạy    | 2 ca: 08:00-12:00 và 13:00-17:00, thời gian hiện tại 08:10         | Check-in không chọn ca thủ công                     | Server auto-detect ca 08:00-12:00 (trong buffer 30 phút)                    | 🟠     |
| TC-CI-06 | Check-in chọn ca thủ công                     | Nhiều ca trong ngày                                                | 1. Chọn ca cụ thể trong dropdown 2. Nhấn "Check-in" | Check-in gắn với ca đã chọn, `shiftId` đúng                                 | 🟠     |
| TC-CI-07 | Check-in với GPS bật — trong vùng cho phép    | `requireGps = true`, `maxGpsDistanceMeters = 100`                  | Check-in từ vị trí trong 100m                       | Thành công, `checkInVerified = true`                                        | 🟠     |
| TC-CI-08 | Check-in với GPS bật — ngoài vùng             | `requireGps = true`                                                | Check-in từ vị trí > 100m                           | Lỗi "Bạn đang ở cách văn phòng Xm (giới hạn: 100m)..."                      | 🟠     |
| TC-CI-09 | Check-in với WiFi yêu cầu — đúng SSID         | `requireWifi = true`, whitelist có "Office-WiFi"                   | Check-in từ WiFi "Office-WiFi"                      | Thành công                                                                  | 🟠     |
| TC-CI-10 | Check-in với WiFi yêu cầu — sai SSID          | `requireWifi = true`                                               | Check-in từ WiFi không trong whitelist              | Lỗi "WiFi 'X' không nằm trong danh sách WiFi được phép."                    | 🟠     |
| TC-CI-11 | Check-in yêu cầu selfie — không có ảnh        | `requireSelfie = true`                                             | Nhấn check-in, không chụp ảnh                       | Lỗi "Yêu cầu chụp ảnh selfie để chấm công."                                 | 🟠     |
| TC-CI-12 | Check-out bình thường đúng giờ                | Đã check-in, ca kết thúc 17:00, check-out lúc 16:50 (trong ngưỡng) | Nhấn "Check-out"                                    | `earlyMinutes = 0`, status giữ nguyên, `workHours` tính đúng                | 🔴     |
| TC-CI-13 | Check-out về sớm                              | Ca kết thúc 17:00, `earlyThreshold = 15`, check-out lúc 16:40      | Nhấn "Check-out"                                    | `earlyMinutes = 20`, status = EARLY_LEAVE (hoặc LATE_AND_EARLY nếu đã LATE) | 🔴     |
| TC-CI-14 | Check-out khi chưa check-in                   | Chưa có check-in hôm nay                                           | Nhấn "Check-out"                                    | Lỗi "Bạn chưa check-in ngày hôm nay!"                                       | 🔴     |
| TC-CI-15 | Check-out lần 2 cùng ngày                     | Đã check-out thành công                                            | Nhấn "Check-out" lại                                | Lỗi "Bạn đã check-out hôm nay rồi!"                                         | 🔴     |
| TC-CI-16 | WebSocket realtime — check-in của đồng nghiệp | Manager mở dashboard                                               | Nhân viên khác check-in                             | Bảng monthly invalidate, dữ liệu cập nhật realtime                          | 🟡     |
| TC-CI-17 | Nhân viên không có quyền ATTENDANCE_CHECKIN   | Role không có quyền                                                | Truy cập /attendance                                | Redirect 403                                                                | 🟠     |

---

### GROUP 2 — Bảng công tháng (Monthly)

| ID       | Mô tả                                             | Điều kiện tiên quyết                                                 | Bước thực hiện                 | Kết quả mong đợi                                                                                 | Mức độ |
| -------- | ------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ | ------ |
| TC-MO-01 | Hiển thị ký hiệu đúng cho từng status             | Dữ liệu tháng có đủ status                                           | Mở /attendance/monthly         | ✓ PRESENT, M LATE, S EARLY_LEAVE, MS LATE_AND_EARLY, × ABSENT, ½ HALF_DAY, P ON_LEAVE, L HOLIDAY | 🔴     |
| TC-MO-02 | Ngày cuối tuần hiển thị `—`                       | Bất kỳ tháng có dữ liệu                                              | Xem bảng lưới                  | Cột T7/CN không tô màu status, hiện `—`                                                          | 🔴     |
| TC-MO-03 | Ngày lễ hiển thị `L`                              | Có holiday trong tháng                                               | Xem bảng lưới                  | Ô ngày lễ hiện biểu tượng `L` màu indigo                                                         | 🟠     |
| TC-MO-04 | Holiday nhiều ngày liên tiếp                      | Holiday `date=01/09`, `endDate=02/09`                                | Xem bảng tháng 9               | Cả ngày 1 và 2/9 đều hiện `L`                                                                    | 🟠     |
| TC-MO-05 | Ngày làm việc quá khứ không có chấm công → ABSENT | Hôm nay là ngày 15, không có attendance ngày 10                      | Xem lưới                       | Ngày 10 hiện `×` ABSENT                                                                          | 🟠     |
| TC-MO-06 | Ngày trong tương lai hiển thị `—`                 | Hôm nay là ngày 15                                                   | Xem lưới                       | Ngày 20 hiện `—`                                                                                 | 🟡     |
| TC-MO-07 | Điều hướng tháng tiến/lùi                         | -                                                                    | Nhấn `<` và `>`                | Tháng/năm thay đổi đúng, năm tự rollover (12→1 tăng năm)                                         | 🟠     |
| TC-MO-08 | Lọc theo phòng ban                                | Nhiều phòng ban, canManage = true                                    | Chọn phòng ban từ dropdown     | Chỉ hiển thị nhân viên thuộc phòng ban đó                                                        | 🟠     |
| TC-MO-09 | Chuyển chế độ xem Lưới ↔ Tổng hợp                 | -                                                                    | Nhấn nút "Tổng hợp" / "Lưới"   | Bảng thay đổi tương ứng                                                                          | 🟡     |
| TC-MO-10 | Tính công (Calculate) thành công                  | canManage = true, chưa khóa                                          | Nhấn "Tính công"               | Toast "Đã tính công tháng thành công", bảng tổng hợp cập nhật                                    | 🔴     |
| TC-MO-11 | Khóa bảng công thành công                         | canManage = true, đã tính công                                       | Nhấn "Khóa bảng công"          | Toast "Đã khóa bảng công tháng", `isLocked = true`                                               | 🔴     |
| TC-MO-12 | Tính công — không có quyền ATTENDANCE_VIEW_ALL    | canManage = false                                                    | Nút "Tính công" không hiển thị | Nút ẩn hoàn toàn                                                                                 | 🟠     |
| TC-MO-13 | Phân trang bảng lưới                              | > 10 nhân viên                                                       | Xem bảng                       | Hiện tối đa 10 dòng/trang, có nút điều hướng trang                                               | 🟡     |
| TC-MO-14 | WorkHours tính đúng — có break                    | Ca 08:00-17:00, `breakMinutes = 60`, check-in 08:00, check-out 17:00 | Tính công                      | `workHours = 8.0` (9h - 1h break)                                                                | 🟠     |
| TC-MO-15 | WorkHours không âm khi check-out sớm              | Check-out trước check-in (edge case)                                 | Dữ liệu bất thường             | `workHours = 0`, không hiện số âm                                                                | 🟡     |

---

### GROUP 3 — Đơn tăng ca (Overtime)

| ID       | Mô tả                                            | Điều kiện tiên quyết                             | Bước thực hiện                                                                    | Kết quả mong đợi                                                                              | Mức độ |
| -------- | ------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| TC-OT-01 | Tạo đơn OT ngày thường thành công                | Nhân viên có quyền, ngày chưa có đơn OT          | 1. Nhập ngày, giờ bắt đầu 18:00, giờ kết thúc 20:00, lý do ≥5 ký tự 2. Nhấn "Tạo" | Đơn tạo thành công, status PENDING, `hours = 2`, tab "Của tôi" cập nhật                       | 🔴     |
| TC-OT-02 | Tạo đơn OT — giờ kết thúc ≤ giờ bắt đầu          | Form điền `startTime = 20:00`, `endTime = 18:00` | Nhấn "Tạo"                                                                        | **[BUG hiện tại]** Client không validate; server trả lỗi "Giờ kết thúc phải sau giờ bắt đầu." | 🔴     |
| TC-OT-03 | Tạo đơn OT — thiếu ngày                          | `date = ""`                                      | Nhấn "Tạo"                                                                        | Toast lỗi "Vui lòng điền đầy đủ thông tin"                                                    | 🔴     |
| TC-OT-04 | Tạo đơn OT — thiếu lý do                         | `reason = ""`                                    | Nhấn "Tạo"                                                                        | Toast lỗi                                                                                     | 🟠     |
| TC-OT-05 | Tạo đơn OT — lý do < 5 ký tự                     | `reason = "OT"`                                  | Nhấn "Tạo"                                                                        | Server zod validation lỗi "Lý do phải có ít nhất 5 ký tự"                                     | 🟠     |
| TC-OT-06 | Tạo đơn OT trùng ngày đã có đơn PENDING/APPROVED | Đã có đơn OT ngày 20/01                          | Tạo đơn OT ngày 20/01                                                             | Lỗi "Bạn đã có đơn OT cho ngày này."                                                          | 🔴     |
| TC-OT-07 | Đơn OT ngày cuối tuần — hệ số `otWeekendCoeff`   | Tạo đơn OT ngày Thứ 7                            | Tạo đơn                                                                           | `dayType = WEEKEND`, `coefficient` theo config                                                | 🟠     |
| TC-OT-08 | Đơn OT ngày lễ — hệ số `otHolidayCoeff`          | Tạo đơn OT ngày có trong bảng Holiday            | Tạo đơn                                                                           | `dayType = HOLIDAY`, `coefficient` theo config                                                | 🟠     |
| TC-OT-09 | Approve đơn OT                                   | canApprove = true, đơn PENDING                   | Nhấn "Duyệt"                                                                      | Status → APPROVED, emit `overtime:approved` đến user                                          | 🔴     |
| TC-OT-10 | Reject đơn OT với lý do                          | canApprove = true, đơn PENDING                   | 1. Nhấn "Từ chối" 2. Nhập lý do 3. Xác nhận                                       | Status → REJECTED, `rejectedReason` lưu đúng                                                  | 🔴     |
| TC-OT-11 | Reject đơn OT không có quyền                     | canApprove = false                               | Nút approve/reject không hiện                                                     | Các nút ẩn, không gọi được action duyệt                                                       | 🟠     |
| TC-OT-12 | Hủy đơn OT của mình (PENDING)                    | Đơn đang PENDING                                 | Nhấn "Hủy"                                                                        | Status → CANCELLED                                                                            | 🟠     |
| TC-OT-13 | Hủy đơn OT của mình (APPROVED)                   | Đơn đã APPROVED                                  | Nhấn "Hủy"                                                                        | Lỗi "Chỉ có thể hủy đơn đang chờ duyệt."                                                      | 🟠     |
| TC-OT-14 | Hủy đơn OT của người khác                        | Nhân viên A xem đơn của nhân viên B              | Nhấn "Hủy"                                                                        | Lỗi "Bạn không có quyền hủy đơn này."                                                         | 🔴     |
| TC-OT-15 | Tab "Chờ duyệt" chỉ hiển thị cho người có quyền  | canApprove = false                               | Mở /attendance/overtime                                                           | Tab "Chờ duyệt" và "Tất cả" không hiển thị                                                    | 🟠     |

---

### GROUP 4 — Giải trình chấm công (Explanations)

| ID       | Mô tả                                               | Điều kiện tiên quyết                              | Bước thực hiện                                                                | Kết quả mong đợi                                                                                       | Mức độ |
| -------- | --------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| TC-EX-01 | Nộp giải trình thành công                           | Có bản ghi attendance LATE, `attendanceId` hợp lệ | 1. Chọn bản ghi attendance 2. Chọn type LATE 3. Nhập lý do ≥5 ký tự 4. Submit | Giải trình tạo thành công, status PENDING                                                              | 🔴     |
| TC-EX-02 | Nộp giải trình — `attendanceId` rỗng                | `attendanceId = ""`                               | Nhấn submit                                                                   | **[BUG hiện tại]** Cần validate client-side; server trả lỗi "Không tìm thấy bản ghi chấm công hợp lệ." | 🔴     |
| TC-EX-03 | Nộp giải trình — lý do < 5 ký tự                    | `reason = "Ok"`                                   | Nhấn submit                                                                   | Zod validation lỗi "Lý do phải có ít nhất 5 ký tự"                                                     | 🟠     |
| TC-EX-04 | Nộp giải trình cho bản ghi của người khác           | `attendanceId` thuộc user khác                    | Submit                                                                        | Lỗi "Không tìm thấy bản ghi chấm công hợp lệ."                                                         | 🔴     |
| TC-EX-05 | Ghi đè giải trình đang PENDING                      | Giải trình cũ PENDING                             | Submit giải trình mới cho cùng `attendanceId`                                 | Upsert thành công, reset về PENDING, nội dung mới ghi đè                                               | 🟠     |
| TC-EX-06 | Không thể sửa giải trình đã APPROVED                | Giải trình cũ APPROVED                            | Submit giải trình mới                                                         | Lỗi "Giải trình đã được duyệt, không thể sửa."                                                         | 🔴     |
| TC-EX-07 | Approve giải trình                                  | canApprove = true, giải trình PENDING             | Nhấn "Duyệt"                                                                  | Status → APPROVED, attendance.status → PRESENT, `lateMinutes = 0`, `earlyMinutes = 0`                  | 🔴     |
| TC-EX-08 | Reject giải trình với lý do                         | canApprove = true                                 | 1. Nhấn "Từ chối" 2. Nhập lý do                                               | Status → REJECTED, `rejectedReason` lưu đúng                                                           | 🔴     |
| TC-EX-09 | Approve không có quyền ATTENDANCE_APPROVE           | canApprove = false                                | Nút "Duyệt" không hiện                                                        | Nút ẩn                                                                                                 | 🟠     |
| TC-EX-10 | WebSocket realtime — submit và duyệt                | Cả 2 màn hình đang mở                             | A submit → B nhận event `explanation:submitted`                               | B thấy đơn mới                                                                                         | 🟡     |
| TC-EX-11 | Type giải trình ABSENT — không có attendance record | Vắng hôm đó, không có bản ghi attendance          | Cần có bản ghi attendance mới tạo giải trình được                             | Giải trình phải liên kết với bản ghi attendance, ABSENT cần có record                                  | 🟠     |

---

### GROUP 5 — Cài đặt chấm công (Settings)

| ID        | Mô tả                                  | Bước thực hiện                                     | Kết quả mong đợi                                                                         | Mức độ |
| --------- | -------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| TC-SET-01 | Bật GPS + lưu — hiệu lực ngay          | Bật `requireGps`, nhấn Lưu                         | Config cập nhật, WebSocket `config:updated` emit, check-in session tiếp theo áp dụng GPS | 🔴     |
| TC-SET-02 | Thêm WiFi whitelist                    | Nhập SSID + BSSID, nhấn Thêm                       | SSID xuất hiện trong danh sách, `wifiWhitelist` DB cập nhật                              | 🟠     |
| TC-SET-03 | Xóa WiFi whitelist                     | Nhấn xóa SSID                                      | SSID bị xóa khỏi danh sách                                                               | 🟠     |
| TC-SET-04 | Hệ số OT — thay đổi và tính lại        | Đổi `otWeekdayCoeff = 2.0`, tạo đơn OT ngày thường | `coefficient = 2.0` trên đơn mới                                                         | 🟠     |
| TC-SET-05 | Thêm ngày lễ multiple-day              | `date = 01/09/2025`, `endDate = 02/09/2025`        | Cả 2 ngày hiện `L` trên bảng công                                                        | 🟠     |
| TC-SET-06 | Không có quyền ATTENDANCE_SHIFT_MANAGE | Role không có quyền                                | Không thể truy cập trang Settings                                                        | 🔴     |

---

### GROUP 6 — Ca làm việc (Shifts) — Tóm tắt

> Chi tiết xem tại `shifts/QA_SHIFTS_MODULE.md` (41 test cases)

| ID       | Mô tả                                              | Mức độ |
| -------- | -------------------------------------------------- | ------ |
| TC-SH-01 | Tạo ca, phân ca, xem lịch — core flow              | 🔴     |
| TC-SH-02 | Lọc nhân viên theo phòng ban trên lịch ca          | 🟠     |
| TC-SH-03 | Màu ca ổn định theo hash ID (không đổi khi reload) | 🟡     |

---

### GROUP 7 — WebSocket & Realtime

| ID       | Mô tả                                               | Bước thực hiện            | Kết quả mong đợi                                                                     | Mức độ |
| -------- | --------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------ | ------ |
| TC-WS-01 | `attendance:check-in` → Monthly invalidate          | Nhân viên check-in        | Monthly page tự cập nhật                                                             | 🟠     |
| TC-WS-02 | `attendance:check-out` → Monthly invalidate         | Nhân viên check-out       | Monthly page tự cập nhật                                                             | 🟠     |
| TC-WS-03 | `config:updated` → Dashboard reload config          | Admin cập nhật config     | Dashboard nhận event, reload config                                                  | 🟠     |
| TC-WS-04 | `shift:updated` → Dashboard reload shifts           | Admin cập nhật ca         | Dashboard hiển thị ca mới                                                            | 🟠     |
| TC-WS-05 | `overtime:approved` → chỉ gửi đến user liên quan    | `emitToUser(userId, ...)` | Chỉ user sở hữu đơn nhận notification                                                | 🟠     |
| TC-WS-06 | `explanation:approved` → emitToUser với userId rỗng | `attendance.userId` null  | **[EDGE CASE]** Nếu attendance bị xóa, emit với `userId = ""` → không gây lỗi server | 🟡     |

---

### GROUP 8 — Phân quyền & Bảo mật

| ID        | Mô tả                                                         | Bước thực hiện                                     | Kết quả mong đợi                                               | Mức độ |
| --------- | ------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- | ------ |
| TC-SEC-01 | Unauthenticated user truy cập /attendance                     | Logout, truy cập /attendance                       | Redirect về /login                                             | 🔴     |
| TC-SEC-02 | getMonthlyAttendance trả về đúng scope                        | `canViewAll = false`                               | Chỉ thấy dữ liệu của bản thân                                  | 🔴     |
| TC-SEC-03 | getOvertimeRequests scope đúng                                | `canViewAll = false`                               | Tab "Của tôi" chỉ thấy đơn của mình                            | 🔴     |
| TC-SEC-04 | approveOvertimeRequest — kiểm tra ATTENDANCE_OVERTIME_APPROVE | Không có quyền gọi trực tiếp                       | `requirePermission` throw lỗi 403                              | 🔴     |
| TC-SEC-05 | cancelOvertimeRequest — kiểm tra userId                       | User A cancel đơn của B bằng cách gọi thẳng action | Lỗi "Bạn không có quyền hủy đơn này."                          | 🔴     |
| TC-SEC-06 | submitExplanation — kiểm tra attendance thuộc user            | Gửi `attendanceId` của người khác                  | Lỗi "Không tìm thấy bản ghi chấm công hợp lệ."                 | 🔴     |
| TC-SEC-07 | lockMonthlySummary — yêu cầu ATTENDANCE_VIEW_ALL              | Không có quyền                                     | 403                                                            | 🔴     |
| TC-SEC-08 | Bản ghi check-in chỉ dùng `userId` từ session                 | Client không thể truyền `userId` giả               | Server luôn dùng `session.user.id`, không nhận userId từ input | 🔴     |

---

## Nhiệm vụ 2 — Phân tích Logic & Tối ưu + Các Bug cần sửa

### BUG-LIST

| ID          | Vị trí                                 | Mức độ | Mô tả                                                                                                                                                                | Trạng thái                 |
| ----------- | -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| OT-BUG-01   | `overtime/overtime-client.tsx`         | 🔴     | `handleCreate()` không validate `startTime < endTime` phía client                                                                                                    | **CẦN SỬA**                |
| EX-BUG-01   | `explanations/explanations-client.tsx` | 🟠     | Submit form khi `attendanceId = ""` không bị chặn phía client                                                                                                        | **CẦN SỬA**                |
| MO-BUG-01   | `monthly/monthly-client.tsx`           | 🟠     | "Khóa bảng công" không có dialog xác nhận — bất khả nghịch                                                                                                           | **CẦN SỬA**                |
| WS-BUG-01   | `actions.ts:approveExplanation`        | 🟡     | `emitToUser("", ...)` khi `explanation.attendance` bị xóa — emit với userId rỗng                                                                                     | **THEO DÕI**               |
| MO-BUG-02   | `monthly/monthly-client.tsx:gridData`  | 🟡     | Ngày ON_LEAVE không được tính `workDays += 1` trong `gridData` summary (chỉ ON_LEAVE từ DB mới đúng) — tính workDays chỉ đếm PRESENT/LATE/EARLY_LEAVE/LATE_AND_EARLY | **ĐÚNG** (leaveDays riêng) |
| CALC-BUG-01 | `actions.ts:calculateMonthlySummary`   | 🟡     | `calculateMonthlySummary` lấy toàn bộ `users` không lọc theo department — tính cả nhân viên đã nghỉ việc                                                             | **THEO DÕI**               |

---

### Chi tiết Bug và Fix

#### OT-BUG-01 — Thiếu validation `startTime < endTime` phía client

**File:** `src/app/(protected)/attendance/overtime/overtime-client.tsx`

**Vấn đề:**

```typescript
// Hiện tại - chỉ kiểm tra date và reason
const handleCreate = () => {
    if (!form.date || !form.reason) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
    }
    createMutation.mutate(form);
};
```

Server có validate (`hours <= 0` → throw), nhưng user phải đợi round-trip mới biết lỗi. Fix cần thêm client-side guard:

```typescript
const handleCreate = () => {
    if (!form.date || !form.reason) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
    }
    // Validate thứ tự thời gian
    if (form.startTime >= form.endTime) {
        toast.error("Giờ kết thúc phải sau giờ bắt đầu");
        return;
    }
    createMutation.mutate(form);
};
```

---

#### EX-BUG-01 — Không chặn submit khi `attendanceId` rỗng

**File:** `src/app/(protected)/attendance/explanations/explanations-client.tsx`

**Vấn đề:** Nếu user không chọn bản ghi attendance (form mặc định `attendanceId = ""`), form vẫn submit và server mới trả lỗi.

**Fix:** Thêm guard trong `handleSubmit`:

```typescript
const handleSubmit = () => {
    if (!form.attendanceId) {
        toast.error("Vui lòng chọn bản ghi chấm công cần giải trình");
        return;
    }
    if (!form.reason || form.reason.length < 5) {
        toast.error("Lý do phải có ít nhất 5 ký tự");
        return;
    }
    submitMutation.mutate(form);
};
```

---

#### MO-BUG-01 — Khóa bảng công không có xác nhận

**File:** `src/app/(protected)/attendance/monthly/monthly-client.tsx`

**Vấn đề:** Không có cơ chế unlock trong UI. Nếu user nhấn nhầm "Khóa bảng công", không thể hoàn tác qua UI.

**Fix:** Bổ sung confirm dialog hoặc dùng `window.confirm()` tạm thời trước khi merge Alert Dialog component:

```typescript
const handleLock = () => {
    if (
        !window.confirm(
            `Bạn có chắc muốn khóa bảng công tháng ${month}/${year}? Thao tác này không thể hoàn tác.`,
        )
    )
        return;
    lockMutation.mutate();
};
```

Và trong JSX đổi `onClick={() => lockMutation.mutate()}` → `onClick={handleLock}`.

---

### Phân tích Logic bổ sung

#### L-01: `calculateMonthlySummary` không tương thích với Department Filter

- **Vấn đề:** Hàm server `calculateMonthlySummary` tính cho **tất cả users** (không lọc department), trong khi UI cho phép quản lý theo phòng ban.
- **Ảnh hưởng:** Nhấn "Tính công" trên view đã lọc phòng ban vẫn tính lại toàn tổ chức → chậm không cần thiết.
- **Đề xuất:** Không cấp thiết nếu công ty nhỏ; có thể thêm `departmentId` param cho `calculateMonthlySummary` sau.

#### L-02: `gridData` dùng `date < today` để mark ABSENT

- **Vấn đề:** Nếu nhân viên có ngày nghỉ phép đã duyệt (status `ON_LEAVE` trong hệ thống khác) nhưng **không có bản ghi attendance** tương ứng trong DB, `gridData` sẽ mark là `ABSENT`.
- **Ảnh hưởng:** Hiển thị sai trên bảng công, `calculateMonthlySummary` cũng sẽ tính sai `absentDays`.
- **Giải pháp hiện tại:** Hệ thống leave cần tạo attendance record với `status = ON_LEAVE` khi phê duyệt đơn nghỉ.

#### L-03: WorkHours tính không trừ break khi check-out bất thường

- **Logic hiện tại** (`checkOut`): workHours = max(0, (diffMs / 3600000) - breakMins/60) \* 100 / 100
- **Lưu ý:** `Math.round(...) / 100` làm tròn 2 chữ số thập phân — đúng.
- **Edge case:** Nếu nhân viên chỉ làm ít hơn `breakMinutes` (ví dụ làm 30 phút với break 60 phút), `workHours = 0` — hành vi đúng theo code hiện tại (Math.max(0,...)).

#### L-04: `detectCurrentShift` — buffer 30 phút trước ca & 15 phút sau ca

- Shift detection có buffer: `currentMinutes >= shiftStart - 30 && currentMinutes <= shiftEnd + 15`
- Nếu có 2 ca liền kề (ca 1 kết thúc 12:00, ca 2 bắt đầu 12:30), buffer có thể chồng lấp (12:00 + 15 = 12:15, và 12:30 - 30 = 12:00). Lúc 12:05 cả 2 ca đều match → ca đầu tiên trong mảng được chọn (do `.find()` trả về first match).
- **Không nguy hiểm** nhưng cần test với lịch ca dày.

---

## Nhiệm vụ 3 — Hướng dẫn Sử dụng (User Guide)

### Module Chấm Công — Hướng dẫn Người dùng

---

#### 1. Trang Chấm Công Hôm Nay (`/attendance`)

**Dành cho:** Tất cả nhân viên có ca làm việc

**Cách check-in:**

1. Mở trang **Chấm Công** từ menu bên trái.
2. Hệ thống tự động hiển thị ca làm việc hôm nay. Nếu có nhiều ca, chọn ca muốn check-in từ danh sách.
3. Nhấn nút **"Check-in"**.
4. Nếu hệ thống yêu cầu GPS/WiFi/Selfie, hoàn thành các bước xác thực.
5. Hệ thống ghi nhận thời gian check-in. Nếu đến muộn hơn ngưỡng quy định, trạng thái sẽ là **Đi muộn**.

**Cách check-out:**

1. Cuối ngày, mở lại trang **Chấm Công**.
2. Nhấn nút **"Check-out"**.
3. Hệ thống tính số giờ làm việc và cập nhật trạng thái (đúng giờ / về sớm).

**Các trạng thái chấm công:**
| Ký hiệu | Tên | Nghĩa |
|---------|-----|-------|
| ✓ | Đúng giờ | Check-in và check-out đúng giờ |
| M | Đi muộn | Check-in sau ngưỡng muộn |
| S | Về sớm | Check-out trước ngưỡng sớm |
| MS | Muộn & Sớm | Cả hai |
| × | Vắng mặt | Không có chấm công ngày đó |
| ½ | Nửa ngày | Chỉ làm nửa ngày |
| P | Nghỉ phép | Ngày nghỉ phép đã duyệt |
| L | Ngày lễ | Ngày lễ quốc gia |

**Lưu ý:**

- Chỉ có thể check-in nếu được phân ca. Liên hệ quản lý nếu không thấy ca.
- Mỗi ngày chỉ được check-in và check-out **một lần**.

---

#### 2. Bảng Công Tháng (`/attendance/monthly`)

**Dành cho:** Quản lý (xem toàn bộ), Nhân viên (xem chính mình)

**Xem bảng công:**

1. Mở **Bảng công tháng** từ menu **Chấm Công → Tổng hợp tháng**.
2. Dùng nút `<` `>` để điều hướng giữa các tháng.
3. Chế độ **Lưới**: xem từng ngày theo ký hiệu (✓, M, S...).
4. Chế độ **Tổng hợp**: xem số liệu tổng (công, muộn, vắng, OT).

**Lọc theo phòng ban** (Quản lý):

- Chọn phòng ban từ dropdown để chỉ xem nhân viên thuộc phòng đó.

**Tính công và Khóa bảng** (Quản lý):

1. Cuối tháng, nhấn **"Tính công"** để hệ thống tổng hợp lại toàn bộ dữ liệu.
2. Sau khi kiểm tra, nhấn **"Khóa bảng công"** để chốt số liệu.
   ⚠️ **Lưu ý:** Khóa bảng công là thao tác **không thể hoàn tác** qua giao diện. Đảm bảo đã kiểm tra kỹ trước khi khóa.

---

#### 3. Đơn Tăng Ca (`/attendance/overtime`)

**Dành cho:** Tất cả nhân viên (tạo đơn), Quản lý (duyệt đơn)

**Tạo đơn tăng ca:**

1. Vào **Chấm Công → Tăng ca**.
2. Nhấn **"Tạo đơn OT"**.
3. Điền thông tin:
    - **Ngày**: ngày làm tăng ca
    - **Giờ bắt đầu / Kết thúc**: thời gian OT (giờ kết thúc phải **sau** giờ bắt đầu)
    - **Lý do**: tối thiểu 5 ký tự
4. Nhấn **"Tạo"**. Đơn sẽ ở trạng thái **Chờ duyệt**.

**Theo dõi đơn:**

- Tab **"Của tôi"**: danh sách đơn OT cá nhân.
- Trạng thái: Chờ duyệt → Đã duyệt / Từ chối / Đã hủy.
- Có thể **Hủy** đơn khi đang **Chờ duyệt**.

**Duyệt đơn OT** (Quản lý):

1. Vào tab **"Chờ duyệt"**.
2. Nhấn **"Duyệt"** hoặc **"Từ chối"** (cần nhập lý do từ chối).

**Hệ số OT:**
| Loại ngày | Mặc định |
|-----------|----------|
| Ngày thường | 1.5x |
| Cuối tuần | 2.0x |
| Ngày lễ | 3.0x |

Hệ số có thể thay đổi trong **Cài đặt chấm công**.

---

#### 4. Giải Trình Chấm Công (`/attendance/explanations`)

**Dành cho:** Nhân viên (nộp giải trình), Quản lý (duyệt giải trình)

**Khi nào cần giải trình:**

- Bị đánh dấu **Đi muộn** / **Về sớm** / **Vắng mặt** do sự cố ngoài ý muốn.
- Quên check-out.

**Nộp giải trình:**

1. Vào **Chấm Công → Giải trình**.
2. Nhấn **"Tạo giải trình"**.
3. Chọn **Bản ghi chấm công** cần giải trình (ngày và ca tương ứng).
4. Chọn **Loại giải trình**: Đi muộn / Về sớm / Vắng mặt / Quên check-out / Khác.
5. Nhập **Lý do** (tối thiểu 5 ký tự).
6. Nhấn **"Nộp"**.

**Lưu ý:**

- Có thể **cập nhật lại** giải trình nếu chưa được duyệt.
- Giải trình đã **Duyệt** không thể sửa.
- Khi giải trình được duyệt, trạng thái chấm công ngày đó sẽ được cập nhật thành **Đúng giờ**.

**Duyệt giải trình** (Quản lý):

1. Vào tab **"Chờ duyệt"**.
2. Xem chi tiết giải trình, nhấn **"Duyệt"** hoặc **"Từ chối"** (kèm lý do từ chối).

---

#### 5. Cài Đặt Chấm Công (`/attendance/settings`)

> **Chỉ dành cho:** Quản trị viên có quyền `ATTENDANCE_SHIFT_MANAGE`

| Tab                 | Chức năng                                             |
| ------------------- | ----------------------------------------------------- |
| **Chung**           | Bật/tắt GPS, WiFi, Selfie; hệ số OT; chuẩn công tháng |
| **Phương thức**     | Quản lý danh sách WiFi được phép                      |
| **Ngày lễ**         | Thêm/xóa ngày lễ (hỗ trợ khoảng ngày)                 |
| **Thiết bị**        | Quản lý máy chấm công vật lý                          |
| **Chu kỳ làm việc** | Cấu hình work cycle                                   |

---

#### 6. Quản Lý Ca Làm Việc (`/attendance/shifts`)

> Chi tiết xem hướng dẫn `shifts/QA_SHIFTS_MODULE.md` — Nhiệm vụ 3

Tóm tắt:

- **Tạo ca**: Tên, mã ca, giờ vào/ra, nghỉ giữa ca, ngưỡng muộn/sớm.
- **Phân ca**: Gán ca cho nhân viên theo ngày/khoảng thời gian.
- **Lịch ca**: Xem lịch theo tuần, lọc theo phòng ban/nhân viên.
