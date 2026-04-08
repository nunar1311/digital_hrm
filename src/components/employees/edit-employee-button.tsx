"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  AddEmployeeDialog,
  type EmployeeEditData,
} from "@/components/employees/add-employee-dialog";

interface EditEmployeeButtonProps {
  employee: EmployeeEditData;
}

export function EditEmployeeButton({ employee }: EditEmployeeButtonProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("ProtectedPages");

  return (
    <>
      <Button size="xs" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        {t("employeesEdit")}
      </Button>
      <AddEmployeeDialog
        open={open}
        onClose={() => setOpen(false)}
        employee={employee}
      />
    </>
  );
}
