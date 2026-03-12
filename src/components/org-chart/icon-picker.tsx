"use client";

import { useState, useMemo } from "react";
import {
    Building2,
    Code,
    Users,
    Briefcase,
    GraduationCap,
    HeartPulse,
    Scale,
    Wallet,
    Settings,
    ShieldCheck,
    Megaphone,
    BarChart3,
    Truck,
    Factory,
    Wrench,
    Globe,
    Landmark,
    Store,
    HardHat,
    FlaskConical,
    Palette,
    Monitor,
    Server,
    Database,
    CloudCog,
    Phone,
    Mail,
    BookOpen,
    Lightbulb,
    Target,
    TrendingUp,
    PieChart,
    Layers,
    Boxes,
    Package,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export const DEPARTMENT_ICONS: Record<
    string,
    { icon: LucideIcon; label: string }
> = {
    Building2: { icon: Building2, label: "Tòa nhà" },
    Code: { icon: Code, label: "Lập trình" },
    Users: { icon: Users, label: "Nhân sự" },
    Briefcase: { icon: Briefcase, label: "Kinh doanh" },
    GraduationCap: { icon: GraduationCap, label: "Đào tạo" },
    HeartPulse: { icon: HeartPulse, label: "Y tế" },
    Scale: { icon: Scale, label: "Pháp lý" },
    Wallet: { icon: Wallet, label: "Tài chính" },
    Settings: { icon: Settings, label: "Cài đặt" },
    ShieldCheck: { icon: ShieldCheck, label: "An ninh" },
    Megaphone: { icon: Megaphone, label: "Marketing" },
    BarChart3: { icon: BarChart3, label: "Phân tích" },
    Truck: { icon: Truck, label: "Vận chuyển" },
    Factory: { icon: Factory, label: "Sản xuất" },
    Wrench: { icon: Wrench, label: "Kỹ thuật" },
    Globe: { icon: Globe, label: "Quốc tế" },
    Landmark: { icon: Landmark, label: "Hành chính" },
    Store: { icon: Store, label: "Cửa hàng" },
    HardHat: { icon: HardHat, label: "Xây dựng" },
    FlaskConical: { icon: FlaskConical, label: "R&D" },
    Palette: { icon: Palette, label: "Thiết kế" },
    Monitor: { icon: Monitor, label: "IT" },
    Server: { icon: Server, label: "Hạ tầng" },
    Database: { icon: Database, label: "Dữ liệu" },
    CloudCog: { icon: CloudCog, label: "Cloud" },
    Phone: { icon: Phone, label: "CSKH" },
    Mail: { icon: Mail, label: "Truyền thông" },
    BookOpen: { icon: BookOpen, label: "Thư viện" },
    Lightbulb: { icon: Lightbulb, label: "Sáng tạo" },
    Target: { icon: Target, label: "Chiến lược" },
    TrendingUp: { icon: TrendingUp, label: "Tăng trưởng" },
    PieChart: { icon: PieChart, label: "Báo cáo" },
    Layers: { icon: Layers, label: "Tổng hợp" },
    Boxes: { icon: Boxes, label: "Kho vận" },
    Package: { icon: Package, label: "Đóng gói" },
};

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return Object.entries(DEPARTMENT_ICONS);
        const q = search.toLowerCase();
        return Object.entries(DEPARTMENT_ICONS).filter(
            ([key, { label }]) =>
                key.toLowerCase().includes(q) ||
                label.toLowerCase().includes(q),
        );
    }, [search]);

    const SelectedIcon =
        value && DEPARTMENT_ICONS[value]
            ? DEPARTMENT_ICONS[value].icon
            : Building2;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm w-[40%]",
                        "hover:bg-accent transition-colors bg-input/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                >
                    <div className="rounded-md bg-primary/10 p-1.5">
                        <SelectedIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground truncate flex-1 text-left">
                        {value && DEPARTMENT_ICONS[value]
                            ? DEPARTMENT_ICONS[value].label
                            : "Chọn icon..."}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Tìm icon..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8"
                    />
                </div>
                <ScrollArea className="h-[240px]">
                    <div className="grid grid-cols-6 gap-1 p-2">
                        {filtered.map(
                            ([key, { icon: Icon, label }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    title={label}
                                    className={cn(
                                        "flex items-center justify-center rounded-md p-2 transition-colors",
                                        "hover:bg-accent",
                                        value === key &&
                                            "bg-primary/10 ring-2 ring-primary/50",
                                    )}
                                    onClick={() => {
                                        onChange(key);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <Icon className="h-4 w-4" />
                                </button>
                            ),
                        )}
                        {filtered.length === 0 && (
                            <p className="col-span-6 text-center text-xs text-muted-foreground py-4">
                                Không tìm thấy icon
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
