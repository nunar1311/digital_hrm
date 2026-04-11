"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ContractExpiryCardItem {
  contractId: string;
  contractNumber: string;
  employeeName: string;
  username: string | null;
  endDate: string;
  daysUntilExpiry: number;
}

interface Props {
  items: ContractExpiryCardItem[];
}

export default function CardContractExpiryList({ items }: Props) {
  const topItems = items.slice(0, 5);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Hợp đồng sắp hết hạn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topItems.length === 0 ? (
          <div className="h-full min-h-28 flex items-center justify-center text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Không có hợp đồng sắp hết hạn.
            </div>
          </div>
        ) : (
          topItems.map((item) => (
            <Link
              key={`${item.contractId}-${item.daysUntilExpiry}`}
              href={`/contracts/${item.contractId}`}
              className="block rounded-md border p-2 hover:bg-muted"
            >
              <p className="text-xs font-medium">
                {item.employeeName} ({item.username || "N/A"})
              </p>
              <p className="text-xs text-muted-foreground">
                {item.contractNumber}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                <CalendarClock className="h-3.5 w-3.5" />
                Hết hạn sau {item.daysUntilExpiry} ngày (
                {new Date(item.endDate).toLocaleDateString("vi-VN")})
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
