import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/app/(protected)/assets/constants";

interface Props {
  employeeId: string;
}

const mockContracts = [
  {
    id: "1",
    employeeId: "1",
    contractCode: "1234567890",
    contractType: "PROBATION",
    startDate: "2024-01-01",
    endDate: "2024-01-01",
    status: "ACTIVE",
    salary: 1000000,
    allowances: {
      "1": 1000000,
      "2": 2000000,
    },
  },
];
export function ContractsTab({ employeeId }: Props) {
  const contracts = mockContracts
    .filter((c) => c.employeeId === employeeId)
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

  return (
    <div className="space-y-4">
      {contracts.length > 0 ? (
        contracts.map((contract) => {
          const isExpired = contract.endDate
            ? new Date(contract.endDate) < new Date()
            : false;

          return (
            <Card
              key={contract.id}
              className={
                contract.status === "ACTIVE" && !isExpired
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
                        {contract.contractCode}
                      </h3>

                      <Badge
                        variant={
                          contract.status === "ACTIVE" && !isExpired
                            ? "default"
                            : contract.status === "TERMINATED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {contract.status === "ACTIVE" && !isExpired
                          ? "Đang hiệu lực"
                          : contract.status === "ACTIVE" && isExpired
                            ? "Đã hết hạn"
                            : contract.status === "TERMINATED"
                              ? "Đã chấm dứt"
                              : "Bản nháp"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Loại hợp đồng
                        </div>
                        <div className="font-medium">
                          {contract.contractType === "PROBATION"
                            ? "Thử việc"
                            : contract.contractType === "DEFINITE"
                              ? "Có thời hạn"
                              : contract.contractType === "INDEFINITE"
                                ? "Vô thời hạn"
                                : "Thời vụ"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Mức lương cơ bản
                        </div>
                        <div className="font-medium text-emerald-600 font-mono">
                          {formatCurrency(Number(contract.salary))}
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

                  {/* Right side: Allowances */}
                  {contract.allowances &&
                    Object.keys(contract.allowances).length > 0 && (
                      <div className="w-full md:w-64 bg-muted/30 rounded-lg p-4 border flex flex-col justify-center">
                        <h4 className="text-sm font-semibold mb-3">
                          Các khoản phụ cấp
                        </h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(
                            contract.allowances as Record<string, number>,
                          ).map(([key, amount]) => (
                            <div
                              key={key}
                              className="flex justify-between items-center bg-background px-3 py-1.5 rounded-md border"
                            >
                              <span className="text-muted-foreground capitalize">
                                {key}
                              </span>
                              <span className="font-mono font-medium">
                                {formatCurrency(amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
