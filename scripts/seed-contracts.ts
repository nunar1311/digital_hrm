import { prisma } from '../src/lib/prisma';

const templates = [
  {
    code: 'hd-thu-viec',
    name: 'Hợp đồng thử việc',
    description: 'Mẫu hợp đồng thử việc tiêu chuẩn cho nhân viên mới',
    isDefault: false,
    isActive: true,
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
--------------------

HỢP ĐỒNG THỬ VIỆC
Số: {{contractNumber}}

Hôm nay, ngày {{today}}, tại văn phòng công ty {{companyName}}, chúng tôi gồm:

BÊN A (Người sử dụng lao động):
Công ty: {{companyName}}
Địa chỉ: {{companyAddress}}

BÊN B (Người lao động):
Ông/Bà: {{employeeName}}
Bộ phận: {{employeeDepartment}}
Chức vụ: {{employeePosition}}

Điều 1: Thời hạn thử việc
- Thời gian thử việc: Từ ngày {{startDate}} đến ngày {{endDate}}.

Điều 2: Mức lương và Phụ cấp
- Mức lương thử việc: {{probationSalary}}.
- Trong thời gian thử việc, Người lao động được hưởng các chế độ theo quy định của công ty.

Điều 3: Nghĩa vụ và Quyền lợi
- Người lao động có nghĩa vụ hoàn thành tốt các công việc được giao.
- Công ty có trách nhiệm hỗ trợ và tạo điều kiện làm việc tốt nhất.

ĐẠI DIỆN BÊN A                 ĐẠI DIỆN BÊN B
(Ký, ghi rõ họ tên)            (Ký, ghi rõ họ tên)
`
  },
  {
    code: 'hd-1-nam',
    name: 'Hợp đồng lao động xác định thời hạn 1 năm',
    description: 'Dành cho nhân viên đã qua thử việc',
    isDefault: true,
    isActive: true,
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
--------------------

HỢP ĐỒNG LAO ĐỘNG
Số: {{contractNumber}}

Hôm nay, ngày {{today}}, tại văn phòng công ty {{companyName}}, chúng tôi gồm:

BÊN A (Người sử dụng lao động):
Công ty: {{companyName}}
Địa chỉ: {{companyAddress}}

BÊN B (Người lao động):
Ông/Bà: {{employeeName}}
Bộ phận: {{employeeDepartment}}
Chức vụ: {{employeePosition}}

Điều 1: Điều khoản chung
- Loại hợp đồng: Hợp đồng lao động xác định thời hạn 01 năm.
- Thời hạn: Từ ngày {{startDate}} đến ngày {{endDate}}.

Điều 2: Chế độ làm việc và lương
- Mức lương chính thức: {{salary}}.
- Hình thức trả lương: Chuyển khoản hoặc tiền mặt.
- Ngày trả lương: Ngày mùng 5 hàng tháng.

Điều 3: Bảo hiểm và phúc lợi
- Công ty đóng đầy đủ BHXH, BHYT, BHTN theo quy định của pháp luật sau khi ký hợp đồng chính thức.

ĐẠI DIỆN BÊN A                 ĐẠI DIỆN BÊN B
(Ký, ghi rõ họ tên)            (Ký, ghi rõ họ tên)
`
  },
  {
    code: 'hd-khong-thoi-han',
    name: 'Hợp đồng lao động không xác định thời hạn',
    description: 'Dành cho nhân sự gắn bó lâu dài',
    isDefault: false,
    isActive: true,
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
--------------------

HỢP ĐỒNG LAO ĐỘNG
Số: {{contractNumber}}

Hôm nay, ngày {{today}}, tại văn phòng công ty {{companyName}}, chúng tôi gồm:

BÊN A (Người sử dụng lao động):
Công ty: {{companyName}}
Địa chỉ: {{companyAddress}}

BÊN B (Người lao động):
Ông/Bà: {{employeeName}}
Bộ phận: {{employeeDepartment}}
Chức vụ: {{employeePosition}}

Điều 1: Điều khoản chung
- Loại hợp đồng: Hợp đồng lao động không xác định thời hạn.
- Thời gian bắt đầu: Từ ngày {{startDate}}.

Điều 2: Chế độ làm việc và lương
- Mức lương chính thức: {{salary}}.
- Phụ cấp: Theo quy chế hiện hành của công ty.

Điều 3: Nghĩa vụ và quyền lợi
- Người lao động có trách nhiệm bảo mật thông tin kinh doanh.
- Công ty thực hiện chế độ thưởng Lễ, Tết theo quy định.

ĐẠI DIỆN BÊN A                 ĐẠI DIỆN BÊN B
(Ký, ghi rõ họ tên)            (Ký, ghi rõ họ tên)
`
  }
];

async function main() {
  console.log('Seeding contract templates...');
  for (const t of templates) {
    await prisma.contractTemplate.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
    console.log('Seeded template:', t.name);
  }
  console.log('Seeding completed!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
