"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Save,
  Wand2,
  Sparkles,
  ChevronDown,
  Upload,
  ArrowLeft,
  Copy,
  X,
  FileText,
  Settings,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  upsertContractTemplate,
  importContractFromDocx,
  importContractFromOldDoc,
  importContractFromPdf,
} from "@/app/(protected)/contracts/actions";
import {
  generateContractTemplateWithAI,
  formatImportedContractWithAI,
  autoFillContractVariablesWithAI,
} from "@/app/(protected)/contracts/ai-actions";
import type { ContractTemplateItem } from "@/types/contract";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ContractEditor } from "./contract-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  formSchema,
  type FormValues,
  EMPTY_FORM,
  CONTRACT_VARIABLES,
  PREVIEW_DUMMY_DATA,
} from "./contract-template-constants";
import { A4PaginatedPreview } from "./a4-paginated-preview";

interface Props {
  initialData?: ContractTemplateItem | null;
}

export function ContractTemplateDetailClient({ initialData }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const editorRef = useRef<any>(null);
  const [isPreview, setIsPreview] = useState(false);

  const aiFormSchema = z.object({
    prompt: z.string().min(1, "Vui lòng nhập yêu cầu"),
  });

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: { prompt: "" },
  });

  const rhf = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          id: initialData.id,
          code: initialData.code || "",
          name: initialData.name,
          description: initialData.description || "",
          content: initialData.content || "",
          isDefault: initialData.isDefault,
          isActive: initialData.isActive,
        }
      : EMPTY_FORM,
  });

  const selectedTemplateId = rhf.watch("id");

  const generateAIMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await generateContractTemplateWithAI(prompt);
      if (!res.success) throw new Error(res.error || "Lỗi khi tạo bằng AI");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Tạo mẫu hợp đồng thành công!");
      rhf.setValue("code", data?.code || rhf.getValues("code"), {
        shouldDirty: true,
      });
      rhf.setValue("name", data?.name || rhf.getValues("name"), {
        shouldValidate: true,
        shouldDirty: true,
      });
      rhf.setValue(
        "description",
        data?.description || rhf.getValues("description"),
        { shouldDirty: true },
      );

      let contentToSet = data?.content || rhf.getValues("content") || "";
      if (contentToSet && !contentToSet.includes("<p>")) {
        contentToSet = contentToSet
          .split("\n")
          .map((line: any) => `<p>${line}</p>`)
          .join("");
      }

      rhf.setValue("content", contentToSet, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setIsAiDialogOpen(false);
      aiForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Không thể tạo mẫu bằng AI");
    },
  });

  const autoFillVariablesMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await autoFillContractVariablesWithAI(content);
      if (!res.success) throw new Error(res.error || "Lỗi khi điền biến AI");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Điền biến tự động thành công!");
      if (data?.content) {
        rhf.setValue("content", data.content, {
          shouldValidate: true,
          shouldDirty: true,
        });

        // Update tiptap editor if it's currently focused or loaded
        const editor = editorRef.current;
        if (editor?.chain) {
          editor.commands.setContent(data.content);
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Không thể điền biến tự động");
    },
  });

  const saveMutation = useMutation({
    mutationFn: upsertContractTemplate,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.message || "Không thể lưu mẫu hợp đồng");
        return;
      }
      toast.success("Đã lưu mẫu hợp đồng");
      queryClient.invalidateQueries({ queryKey: ["contracts", "templates"] });
      // Redirect to the list view or maybe we just stay here
      router.push("/contracts/templates");
    },
    onError: () => toast.error("Không thể lưu mẫu hợp đồng"),
  });

  const handleCloneTemplate = () => {
    const currentValues = rhf.getValues();
    rhf.reset({
      ...currentValues,
      id: undefined,
      name: `${currentValues.name} - Copy`,
    });
    toast.info("Đã nhân bản bản nháp. Vui lòng lưu để tạo mẫu mới.");
  };

  const insertVariable = useCallback(
    (variableKey: string) => {
      const editor = editorRef.current;
      if (editor?.chain) {
        editor.chain().focus().insertContent(variableKey).run();
        setTimeout(() => {
          if (editor?.getHTML) {
            rhf.setValue("content", editor.getHTML(), {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }, 50);
      } else {
        const currentContent = rhf.getValues("content") || "";
        rhf.setValue("content", currentContent + " " + variableKey, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [rhf],
  );

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      setIsImporting(true);

      let extractedHtml = "";

      if (extension === "docx") {
        const formData = new FormData();
        formData.append("file", file);

        const result = await importContractFromDocx(formData);
        if (!result.success || !result.html) {
          toast.error(result.message || "Lỗi khi import DOCX", {
            duration: 10000,
          });
          return;
        }
        extractedHtml = result.html;
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Lỗi khi đọc file"));
          reader.readAsDataURL(file);
        });

        const base64String = dataUrl.split(",")[1];
        if (!base64String) {
          toast.error("Định dạng dữ liệu không hợp lệ");
          return;
        }

        let result;
        if (extension === "doc") {
          result = await importContractFromOldDoc(base64String);
        } else if (extension === "pdf") {
          result = await importContractFromPdf(base64String);
        } else {
          toast.error("Định dạng file không được hỗ trợ");
          return;
        }

        if (!result.success || !result.html) {
          toast.error(result.message || "Lỗi khi import file");
          return;
        }
        extractedHtml = result.html;
      }

      const aiFormatPromise = formatImportedContractWithAI(extractedHtml)
        .then((aiResult) => {
          if (aiResult.success && aiResult.data?.content) {
            rhf.setValue("content", aiResult.data.content, {
              shouldDirty: true,
              shouldValidate: true,
            });

            if (aiResult.data.detectedName && !rhf.getValues("name")) {
              rhf.setValue("name", aiResult.data.detectedName, {
                shouldDirty: true,
              });
            }
            if (aiResult.data.detectedCode && !rhf.getValues("code")) {
              rhf.setValue("code", aiResult.data.detectedCode, {
                shouldDirty: true,
              });
            }

            return "AI đã format hợp đồng thành công!";
          } else {
            console.warn(
              "AI format failed, using raw content:",
              aiResult.error,
            );
            rhf.setValue("content", extractedHtml, {
              shouldDirty: true,
              shouldValidate: true,
            });
            throw new Error(
              "Không thể format bằng AI. Đã sử dụng nội dung gốc.",
            );
          }
        })
        .catch((err) => {
          if (!rhf.getValues("content")) {
            rhf.setValue("content", extractedHtml, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
          throw err;
        });

      toast.promise(aiFormatPromise, {
        loading: "Trích xuất thành công! Đang format bằng AI...",
        success: (msg) => msg as string,
        error: (err) =>
          err?.message || "Không thể format bằng AI. Đã sử dụng nội dung gốc.",
      });
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi import");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getPreviewContent = (content: string) => {
    if (!content) return "";
    let preview = content;
    Object.entries(PREVIEW_DUMMY_DATA).forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
      preview = preview.replace(
        regex,
        `<span class="bg-primary/20 text-primary font-medium px-1 rounded">${value}</span>`,
      );
    });
    return preview;
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <div className="w-full min-h-0 h-full grow flex flex-col bg-background">
      <Form {...rhf}>
        <div className="w-full min-h-0 h-full min-w-0 flex flex-col relative">
          <Dialog
            open={isAiDialogOpen}
            onOpenChange={(open) => {
              setIsAiDialogOpen(open);
              if (!open) aiForm.reset();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo mẫu hợp đồng bằng AI</DialogTitle>
                <DialogDescription>
                  Nhập yêu cầu của bạn, AI sẽ tự động sinh nội dung, tiêu đề và
                  điền sẵn các biến (placeholders) cần thiết.
                </DialogDescription>
              </DialogHeader>
              <Form {...aiForm}>
                <form
                  onSubmit={aiForm.handleSubmit((values) =>
                    generateAIMutation.mutate(values.prompt),
                  )}
                >
                  <div className="py-4">
                    <FormField
                      control={aiForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yêu cầu</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="VD: Tạo mẫu hợp đồng cộng tác viên..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAiDialogOpen(false)}
                      disabled={generateAIMutation.isPending}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={generateAIMutation.isPending}
                    >
                      {generateAIMutation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Tạo nội dung
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <section>
            <header className="p-2 sm:px-4 flex items-center justify-between h-10 border-b bg-background">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <h1 className="text-sm font-medium text-muted-foreground ">
                    Hợp đồng /
                  </h1>
                  {rhf.getValues("name") && (
                    <h1 className="text-sm font-medium flex items-center gap-1">
                      <FileText className="size-3.5 text-blue-500" />
                      {rhf.getValues("name")}
                    </h1>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Editor tools - Hidden in preview mode */}
                {!isPreview && (
                  <>
                    {/* Insert Variable Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" /> Chèn biến
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-64 max-h-[400px] overflow-y-auto"
                      >
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Thông tin Công ty
                          </DropdownMenuLabel>
                          {CONTRACT_VARIABLES.filter((v) =>
                            v.key.startsWith("{{company"),
                          ).map((v) => (
                            <DropdownMenuItem
                              key={v.key}
                              onClick={() => insertVariable(v.key)}
                              className="text-xs py-1.5 cursor-pointer"
                            >
                              {v.label}{" "}
                              <span className="ml-auto text-muted-foreground opacity-50 font-mono text-[10px]">
                                {v.key}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Thông tin Nhân viên
                          </DropdownMenuLabel>
                          {CONTRACT_VARIABLES.filter((v) =>
                            v.key.startsWith("{{employee"),
                          ).map((v) => (
                            <DropdownMenuItem
                              key={v.key}
                              onClick={() => insertVariable(v.key)}
                              className="text-xs py-1.5 cursor-pointer"
                            >
                              {v.label}{" "}
                              <span className="ml-auto text-muted-foreground opacity-50 font-mono text-[10px]">
                                {v.key}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Thông tin Hợp đồng
                          </DropdownMenuLabel>
                          {CONTRACT_VARIABLES.filter(
                            (v) =>
                              !v.key.startsWith("{{company") &&
                              !v.key.startsWith("{{employee"),
                          ).map((v) => (
                            <DropdownMenuItem
                              key={v.key}
                              onClick={() => insertVariable(v.key)}
                              className="text-xs py-1.5 cursor-pointer"
                            >
                              {v.label}{" "}
                              <span className="ml-auto text-muted-foreground opacity-50 font-mono text-[10px]">
                                {v.key}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Import File */}
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImportFile}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting || generateAIMutation.isPending}
                    >
                      {isImporting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Import
                    </Button>

                    {/* AI Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setIsAiDialogOpen(true)}
                      disabled={
                        isImporting ||
                        generateAIMutation.isPending ||
                        autoFillVariablesMutation.isPending
                      }
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Sinh AI
                    </Button>

                    {/* AI Auto Fill Variables Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        const content = rhf.getValues("content");
                        if (!content || content.length < 20) {
                          toast.error(
                            "Vui lòng nhập nội dung hợp đồng trước khi dùng AI điền biến",
                          );
                          return;
                        }
                        autoFillVariablesMutation.mutate(content);
                      }}
                      disabled={
                        isImporting ||
                        autoFillVariablesMutation.isPending ||
                        generateAIMutation.isPending
                      }
                    >
                      {autoFillVariablesMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      Điền biến AI
                    </Button>

                    {/* Settings Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="xs">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80 p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium leading-none text-sm">
                            Cài đặt mẫu hợp đồng
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Cấu hình các thuộc tính bổ sung.
                          </p>
                          <div className="grid gap-4">
                            <FormField
                              control={rhf.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                                  <FormLabel className="text-xs">
                                    Mã mẫu
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="VD: HDLD-01"
                                      className="col-span-2 h-8 text-xs"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={rhf.control}
                              name="isDefault"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between space-y-0">
                                  <FormLabel className="text-xs">
                                    Mặc định
                                  </FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={rhf.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between space-y-0">
                                  <FormLabel className="text-xs">
                                    Kích hoạt
                                  </FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </>
                )}

                {/* Preview Toggle */}
                <Button
                  type="button"
                  variant={isPreview ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setIsPreview(!isPreview)}
                >
                  {isPreview ? "Quay lại" : "Xem trước"}
                </Button>

                {/* Separator */}
                <div className="w-px h-4 bg-border mx-1"></div>

                {selectedTemplateId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleCloneTemplate}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Button
                  type="submit"
                  form="contract-form"
                  disabled={saveMutation.isPending}
                  size="xs"
                >
                  {saveMutation.isPending && (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  )}
                  Lưu
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="ghost"
                  disabled={saveMutation.isPending}
                  size="xs"
                >
                  <X />
                </Button>
              </div>
            </header>
          </section>

          <section className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-background">
            <form
              id="contract-form"
              onSubmit={rhf.handleSubmit(onSubmit)}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Title Input */}
              <FormField
                control={rhf.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Tên mẫu hợp đồng không tiêu đề..."
                        className="w-full text-3xl md:text-4xl font-bold bg-transparent border-0 outline-none focus:ring-0 placeholder:text-muted-foreground/30 px-0 h-auto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Input */}
              <FormField
                control={rhf.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        value={field.value || ""}
                        placeholder="Thêm mô tả cho mẫu hợp đồng này..."
                        className="w-full text-base md:text-lg text-muted-foreground bg-transparent border-0 outline-none focus:ring-0 placeholder:text-muted-foreground/40 px-0 h-auto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Editor Section */}
              <FormField
                control={rhf.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    {isPreview ? (
                      <A4PaginatedPreview
                        htmlContent={
                          getPreviewContent(field.value) ||
                          '<span class="text-muted-foreground italic">Chưa có nội dung...</span>'
                        }
                      />
                    ) : (
                      <FormControl>
                        <ContractEditor
                          content={field.value || ""}
                          onChange={(html) => {
                            field.onChange(html);
                          }}
                          ref={editorRef}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </section>
        </div>
      </Form>
    </div>
  );
}
