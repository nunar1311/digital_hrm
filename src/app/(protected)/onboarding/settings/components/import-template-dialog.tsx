"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileUp,
  Upload,
  AlignLeft,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { importTemplateFromJson } from "../../actions";
import { type ExportedTemplate } from "@/types/onboarding";

interface ImportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportTemplateDialogProps) {
  const [jsonText, setJsonText] = useState("");
  const [parsedData, setParsedData] = useState<ExportedTemplate | null>(null);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: importTemplateFromJson,
    onSuccess: () => {
      toast.success("Đã nhập template thành công");
      setJsonText("");
      setParsedData(null);
      setParseError("");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Nhập template thất bại"),
  });

  const handleParseJson = () => {
    setParseError("");
    if (!jsonText.trim()) {
      setParseError("Vui lòng nhập dữ liệu JSON");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText) as ExportedTemplate;
      if (!parsed.name) {
        setParseError("JSON thiếu trường 'name'");
        return;
      }
      setParsedData(parsed);
    } catch {
      setParseError("JSON không hợp lệ. Vui lòng kiểm tra lại.");
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    importMutation.mutate(parsedData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setParseError("");
      setParsedData(null);
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setJsonText("");
    setParsedData(null);
    setParseError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-4 w-4 text-blue-600" />
            Nhập template từ JSON
          </DialogTitle>
          <DialogDescription>
            Dán dữ liệu JSON hoặc tải lên file để nhập template mới
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="gap-1">
              <AlignLeft className="h-3.5 w-3.5" />
              Dán JSON
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1">
              <FileUp className="h-3.5 w-3.5" />
              Tải file
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-3">
            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setParsedData(null);
                setParseError("");
              }}
              placeholder={`Dán nội dung JSON vào đây...\n\nVí dụ:\n{\n  "name": "Template Tiếp nhận",\n  "description": "Mô tả template",\n  "tasks": [\n    {\n      "title": "Cấp laptop",\n      "category": "EQUIPMENT",\n      "dueDays": 1,\n      "isRequired": true\n    }\n  ]\n}`}
              rows={10}
              className="font-mono text-xs"
            />

            {parseError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {parseError}
              </p>
            )}

            <Button
              onClick={handleParseJson}
              variant="outline"
              className="w-full"
            >
              Kiểm tra dữ liệu
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                "hover:border-primary/50 hover:bg-primary/5",
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Click để chọn file JSON</p>
              <p className="text-xs text-muted-foreground mt-1">
                File .json chứa cấu trúc template hợp lệ
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {parsedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-800 font-medium">
              <Check className="h-4 w-4" />
              Dữ liệu hợp lệ - Preview:
            </div>

            <div className="bg-white rounded border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{parsedData.name}</span>
              </div>
              {parsedData.description && (
                <p className="text-xs text-muted-foreground ml-6">
                  {parsedData.description}
                </p>
              )}
              <div className="ml-6 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {parsedData.tasks?.length || 0} tasks
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setParsedData(null)}>
                Quay lại
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Check className="h-4 w-4 mr-2" />
                Nhập template ({parsedData.tasks?.length || 0} tasks)
              </Button>
            </DialogFooter>
          </div>
        )}

        {!parsedData && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
