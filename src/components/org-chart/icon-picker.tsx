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
    Building2: { icon: Building2, label: "Building" },
    Code: { icon: Code, label: "Engineering" },
    Users: { icon: Users, label: "HR" },
    Briefcase: { icon: Briefcase, label: "Business" },
    GraduationCap: { icon: GraduationCap, label: "Training" },
    HeartPulse: { icon: HeartPulse, label: "Medical" },
    Scale: { icon: Scale, label: "Legal" },
    Wallet: { icon: Wallet, label: "Finance" },
    Settings: { icon: Settings, label: "Settings" },
    ShieldCheck: { icon: ShieldCheck, label: "Security" },
    Megaphone: { icon: Megaphone, label: "Marketing" },
    BarChart3: { icon: BarChart3, label: "Analytics" },
    Truck: { icon: Truck, label: "Logistics" },
    Factory: { icon: Factory, label: "Manufacturing" },
    Wrench: { icon: Wrench, label: "Technical" },
    Globe: { icon: Globe, label: "Global" },
    Landmark: { icon: Landmark, label: "Administration" },
    Store: { icon: Store, label: "Store" },
    HardHat: { icon: HardHat, label: "Construction" },
    FlaskConical: { icon: FlaskConical, label: "R&D" },
    Palette: { icon: Palette, label: "Design" },
    Monitor: { icon: Monitor, label: "IT" },
    Server: { icon: Server, label: "Infrastructure" },
    Database: { icon: Database, label: "Data" },
    CloudCog: { icon: CloudCog, label: "Cloud" },
    Phone: { icon: Phone, label: "Support" },
    Mail: { icon: Mail, label: "Communications" },
    BookOpen: { icon: BookOpen, label: "Library" },
    Lightbulb: { icon: Lightbulb, label: "Innovation" },
    Target: { icon: Target, label: "Strategy" },
    TrendingUp: { icon: TrendingUp, label: "Growth" },
    PieChart: { icon: PieChart, label: "Reports" },
    Layers: { icon: Layers, label: "General" },
    Boxes: { icon: Boxes, label: "Warehouse" },
    Package: { icon: Package, label: "Packaging" },
};

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
    className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
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
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm w-full",
                        "hover:bg-accent transition-colors bg-input/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        className
                    )}
                >
                    <div className="rounded-md bg-primary/10 p-1.5">
                        <SelectedIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground truncate flex-1 text-left">
                        {value && DEPARTMENT_ICONS[value]
                            ? DEPARTMENT_ICONS[value].label
                            : "Select icon..."}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Search icon..."
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
                                No icon found
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
