"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, FileText, Search } from "lucide-react";
import { toast } from "sonner";

import {
  deleteContractTemplate,
  getContractTemplates,
} from "@/app/(protected)/contracts/actions";
import type { ContractTemplateItem } from "@/types/contract";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useClickOutside, useMergedRef } from "@mantine/hooks";
import { vi } from "date-fns/locale";
import { Separator } from "../ui/separator";

interface Props {
  initialTemplates: ContractTemplateItem[];
}

export function ContractTemplateManager({ initialTemplates }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click outside to close search
  const clickOutsideRef = useClickOutside(() => {
    if (searchExpanded) {
      if (searchQuery.trim()) {
        setSearchQuery("");
      }
      setSearchExpanded(false);
    }
  });
  const mergedSearchRef = useMergedRef(searchContainerRef, clickOutsideRef);

  // Search toggle handlers
  const handleSearchToggle = useCallback(() => {
    if (!searchExpanded) {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      if (searchQuery.trim()) {
        setSearchQuery("");
      }
      setSearchExpanded(false);
    }
  }, [searchExpanded, searchQuery]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchQuery("");
        setSearchExpanded(false);
      }
    },
    [],
  );

  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["contracts", "templates"],
    queryFn: () => getContractTemplates({ includeInactive: true }),
    initialData: initialTemplates,
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [templates, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: deleteContractTemplate,
    onSuccess: () => {
      toast.success("Đã xóa hoặc khóa mẫu hợp đồng");
      setTemplateToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["contracts", "templates"] });
    },
    onError: () => toast.error("Không thể xóa mẫu hợp đồng"),
  });

  const handleSelectTemplate = (template: ContractTemplateItem) => {
    router.push(`/contracts/templates/${template.id}`);
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col">
      <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
        <AlertDialog
          open={!!templateToDelete}
          onOpenChange={(open) => !open && setTemplateToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa mẫu hợp đồng</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa mẫu hợp đồng này không? Hành động này
                không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  if (templateToDelete) {
                    deleteMutation.mutate(templateToDelete);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <section>
          <header className="p-2 flex items-center h-10 justify-between border-b">
            <h1 className="font-bold truncate">Mẫu hợp đồng</h1>
          </header>
        </section>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-end gap-2 px-2 py-2">
            <div className="relative flex items-center" ref={mergedSearchRef}>
              <Input
                ref={searchInputRef}
                placeholder="Tìm kiếm mẫu hợp đồng..."
                className={cn(
                  "h-7 text-xs transition-all duration-300 ease-in-out pr-6",
                  searchExpanded
                    ? "w-64 opacity-100 pl-3"
                    : "w-0 opacity-0 pl-0",
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <Button
                size={"icon-xs"}
                variant={"ghost"}
                onClick={handleSearchToggle}
                className={cn(
                  "absolute right-0.5 z-10",
                  searchExpanded && "[&_svg]:text-primary",
                )}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
            <Separator orientation="vertical" className="h-4!" />
            <Button
              size="xs"
              onClick={() => {
                router.push("/contracts/templates/new");
              }}
            >
              <Plus className="h-3 w-3" />
              Mẫu hợp đồng
            </Button>
          </div>

          <section className="flex-1 relative h-full min-h-0 overflow-hidden">
            <div className="h-full flex flex-col pb-8 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-7 px-2 select-none z-10 relative w-[300px]">
                      Tên mẫu
                    </TableHead>
                    <TableHead className="h-7 px-2 select-none z-10 relative">
                      Tags
                    </TableHead>
                    <TableHead className="h-7 px-2 select-none z-10 relative">
                      Cập nhật lúc
                    </TableHead>
                    <TableHead className="h-7 px-2 select-none z-10 relative">
                      Tạo lúc
                    </TableHead>
                    <TableHead className="h-7 px-2 select-none z-10 relative w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Không tìm thấy dữ liệu.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow
                        key={template.id}
                        className="cursor-pointer hover:bg-muted/50 group"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <TableCell className="px-2 py-1.5 font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {template.name}
                            </span>
                            {template.isDefault && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1 rounded-sm shrink-0"
                              >
                                Mặc định
                              </Badge>
                            )}
                            {!template.isActive && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1 rounded-sm text-muted-foreground shrink-0"
                              >
                                Đã khóa
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-muted-foreground text-xs">
                          {template.updatedAt
                            ? format(
                                new Date(template.updatedAt),
                                "MMMM d, yyyy",
                                { locale: vi },
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-muted-foreground text-xs">
                          {format(
                            new Date(template.createdAt),
                            "MMMM d, yyyy",
                            {
                              locale: vi,
                            },
                          )}
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete(template.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
