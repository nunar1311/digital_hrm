export type TemplateDepartment = {
    name: string;
    code: string;
    logo: string;
    description: string;
    secondaryParentCodes?: string[];
    children?: TemplateDepartment[];
};

export type CompanyStructureTemplate = {
    id: string;
    name: string;
    departments: TemplateDepartment[];
};

export const COMPANY_STRUCTURE_TEMPLATES: CompanyStructureTemplate[] =
    [
        {
            id: "JSC",
            name: "Công ty Cổ phần",
            departments: [
                {
                    name: "Đại hội đồng cổ đông",
                    code: "DHDCĐ",
                    logo: "Users",
                    description:
                        "Đại hội đồng cổ đông của công ty cổ phần",
                    children: [
                        {
                            name: "Ban Kiểm soát",
                            code: "BKS",
                            logo: "ShieldCheck",
                            description:
                                "Giám sát hoạt động quản lý, điều hành",
                        },
                        {
                            name: "Hội đồng Quản trị",
                            code: "HDQT",
                            logo: "Building2",
                            description:
                                "Cơ quan quản lý cao nhất của công ty cổ phần",
                            secondaryParentCodes: ["BKS"],
                            children: [
                                {
                                    name: "Ban Giám đốc",
                                    code: "BGD",
                                    logo: "Briefcase",
                                    description:
                                        "Điều hành hoạt động kinh doanh hàng ngày",
                                    secondaryParentCodes: ["BKS"],
                                    children: [
                                        {
                                            name: "Phòng Hành chính - Nhân sự",
                                            code: "HCNS",
                                            logo: "Users",
                                            description:
                                                "Quản lý nhân sự, tiền lương, hành chính",
                                        },
                                        {
                                            name: "Phòng Tài chính - Kế toán",
                                            code: "TCKT",
                                            logo: "Wallet",
                                            description:
                                                "Quản lý tài chính, kế toán, thuế",
                                        },
                                        {
                                            name: "Phòng Kinh doanh",
                                            code: "KD",
                                            logo: "TrendingUp",
                                            description:
                                                "Phát triển thị trường, bán hàng",
                                        },
                                        {
                                            name: "Phòng Kỹ thuật - Công nghệ",
                                            code: "KTCN",
                                            logo: "Code",
                                            description:
                                                "Nghiên cứu, phát triển công nghệ",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: "LLC",
            name: "Công ty TNHH",
            departments: [
                {
                    name: "Hội đồng Thành viên",
                    code: "HDTV",
                    logo: "Users",
                    description:
                        "Cơ quan quyết định cao nhất của công ty TNHH",
                    children: [
                        {
                            name: "Giám đốc / Tổng giám đốc",
                            code: "GD",
                            logo: "Briefcase",
                            description:
                                "Người điều hành hoạt động kinh doanh",
                            children: [
                                {
                                    name: "Phòng Tổng hợp",
                                    code: "TH",
                                    logo: "Layers",
                                    description:
                                        "Phụ trách Hành chính, Nhân sự, IT",
                                },
                                {
                                    name: "Phòng Kế toán",
                                    code: "KT",
                                    logo: "PieChart",
                                    description:
                                        "Phụ trách tài chính, kế toán",
                                },
                                {
                                    name: "Phòng Bán hàng & Marketing",
                                    code: "SM",
                                    logo: "Megaphone",
                                    description:
                                        "Tìm kiếm khách hàng, xúc tiến bán hàng",
                                },
                                {
                                    name: "Phòng Vận hành / Sản xuất",
                                    code: "SX",
                                    logo: "Factory",
                                    description:
                                        "Thực hiện dịch vụ hoặc sản xuất sản phẩm",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: "PARTNERSHIP",
            name: "Công ty Hợp danh",
            departments: [
                {
                    name: "Hội đồng Thành viên Hợp danh",
                    code: "HDTVHD",
                    logo: "Users",
                    description:
                        "Các thành viên hợp danh cùng quản lý công ty",
                    children: [
                        {
                            name: "Bộ phận Chuyên môn 1",
                            code: "CM1",
                            logo: "HardHat",
                            description:
                                "Mảng nghiệp vụ do Thành viên hợp danh 1 phụ trách",
                        },
                        {
                            name: "Bộ phận Chuyên môn 2",
                            code: "CM2",
                            logo: "FlaskConical",
                            description:
                                "Mảng nghiệp vụ do Thành viên hợp danh 2 phụ trách",
                        },
                        {
                            name: "Bộ phận Hỗ trợ",
                            code: "HT",
                            logo: "Settings",
                            description:
                                "Hành chính, Kế toán dùng chung",
                        },
                    ],
                },
            ],
        },
        {
            id: "SOLE_PROPRIETORSHIP",
            name: "Doanh nghiệp Tư nhân",
            departments: [
                {
                    name: "Chủ Doanh nghiệp",
                    code: "CDN",
                    logo: "Building2",
                    description:
                        "Người đại diện theo pháp luật và quyết định mọi hoạt động",
                    children: [
                        {
                            name: "Cửa hàng / Xưởng",
                            code: "CH",
                            logo: "Store",
                            description:
                                "Nơi giới thiệu, bán sản phẩm hoặc sản xuất",
                        },
                        {
                            name: "Bộ phận Quản trị",
                            code: "QT",
                            logo: "Scale",
                            description:
                                "Hỗ trợ nhân sự, pháp lý, sổ sách",
                        },
                        {
                            name: "Kinh doanh & Vận chuyển",
                            code: "KDVC",
                            logo: "Truck",
                            description:
                                "Giao nhận, thu mua, bán hàng",
                        },
                    ],
                },
            ],
        },
    ];
