import { Badge } from "@/components/ui/badge";

interface Props {
    status: string | undefined | null;
}

export function EmployeeStatusBadge({ status }: Props) {
    switch (status) {
        case 'ACTIVE':
            return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 border-emerald-200">Đang làm việc</Badge>;
        case 'ON_LEAVE':
            return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-600 border-amber-200">Nghỉ phép</Badge>;
        case 'RESIGNED':
            return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50 hover:text-slate-600 border-slate-200">Đã nghỉ việc</Badge>;
        case 'TERMINATED':
            return <Badge variant="destructive">Sa thải</Badge>;
        default:
            return <Badge variant="secondary">Chưa rõ</Badge>;
    }
}
