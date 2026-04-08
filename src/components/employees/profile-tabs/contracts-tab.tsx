import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, CalendarDays, FileText } from "lucide-react";
import { formatCurrency } from "@/app/(protected)/assets/constants";
import { getContractsByEmployee } from "@/app/(protected)/contracts/actions";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";

interface Props {
  employeeId: string;
}

export async function ContractsTab({ employeeId }: Props) {
  const contracts = await getContractsByEmployee(employeeId);

  return (
    <div className="space-y-4">
      {contracts.length > 0 ? (
        contracts.map((contract) => {
          return (
            <Card
              key={contract.id}
              className={
                contract.status === "ACTIVE" && !contract.isExpiringIn15Days
                  ? "border-primary/50 ring-1 ring-primary/20"
                  : "opacity-75 grayscale-20"
              }
            >
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left side: Basic Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">
                        {contract.contractNumber}
                      </h3>

                      <ContractStatusBadge status={contract.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Loại hợp đồng
                        </div>
                        <div className="font-medium">
                          {contract.contractTypeName}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Mức lương cơ bản
                        </div>
                        <div className="font-medium text-emerald-600 font-mono">
                          {contract.salary
                            ? formatCurrency(Number(contract.salary))
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Bắt đầu
                        </div>
                        <div className="font-medium">
                          {new Date(contract.startDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Kết thúc
                        </div>
                        <div className="font-medium">
                          {contract.endDate
                            ? new Date(contract.endDate).toLocaleDateString(
                                "vi-VN",
                              )
                            : "Không thời hạn"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64 bg-muted/30 rounded-lg p-4 border flex flex-col justify-center gap-2">
                    <h4 className="text-sm font-semibold">Thông tin nhanh</h4>
                    <p className="text-xs text-muted-foreground">
                      Mẫu áp dụng: {contract.templateName || "Mặc định"}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      <Link href={`/contracts/${contract.id}`}>
                        <FileText className="h-3.5 w-3.5" />
                        Xem chi tiết
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
            <ScrollText className="h-10 w-10 mb-3 opacity-20" />
            <p>Không tìm thấy hợp đồng nào cho nhân viên này.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
