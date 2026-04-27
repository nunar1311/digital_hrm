"use client";

import {
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Minus,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContractEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
}

// ─── Toolbar Button ───────────────────────────────────────────────────────
function ToolbarButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(isActive && "bg-accent text-accent-foreground")}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Heading Dropdown ──────────────────────────────────────────────────────
const HEADING_OPTIONS = [
  { level: 0 as const, label: "Đoạn văn", icon: Pilcrow },
  { level: 1 as const, label: "Tiêu đề 1", icon: Heading1 },
  { level: 2 as const, label: "Tiêu đề 2", icon: Heading2 },
  { level: 3 as const, label: "Tiêu đề 3", icon: Heading3 },
  { level: 4 as const, label: "Tiêu đề 4", icon: Heading4 },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────
export const ContractEditor = forwardRef<any, ContractEditorProps>(
  function ContractEditor(
    {
      content,
      onChange,
      editable = true,
      placeholder = "Bắt đầu soạn thảo hợp đồng...",
    },
    ref,
  ) {
    // Track whether the update came from outside (prop change) vs inside (user typing)
    const isExternalUpdate = useRef(false);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Underline,
        Table.configure({
          resizable: true,
          HTMLAttributes: { class: "contract-table" },
        }),
        TableRow,
        TableCell,
        TableHeader,
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        Placeholder.configure({ placeholder }),
      ],
      editable,
      content: content || "<p></p>",
      onUpdate: ({ editor: ed }) => {
        if (!isExternalUpdate.current) {
          onChange(ed.getHTML());
        }
      },
    });

    // Sync external content changes (e.g. AI generate, import file, template load)
    useEffect(() => {
      if (!editor) return;
      const currentHtml = editor.getHTML();
      // Avoid re-setting if content is effectively the same
      if (content === currentHtml) return;
      // Also skip empty-ish equivalences
      if (
        (!content || content === "<p></p>") &&
        (!currentHtml || currentHtml === "<p></p>")
      )
        return;

      isExternalUpdate.current = true;
      editor.commands.setContent(content || "<p></p>", { emitUpdate: false });
      isExternalUpdate.current = false;
    }, [content, editor]);

    // Sync editable
    useEffect(() => {
      if (editor) {
        editor.setEditable(editable);
      }
    }, [editable, editor]);

    // ─── Insert variable at cursor ────────────────────────────────────────
    const insertVariable = useCallback(
      (variableKey: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(variableKey).run();
      },
      [editor],
    );

    // Expose editor instance to parent via ref
    useImperativeHandle(ref, () => editor, [editor]);

    if (!editor) {
      return (
        <div className="min-h-[50vh] bg-muted/20 border rounded-md flex items-center justify-center">
          <div className="text-sm text-muted-foreground">
            Đang tải trình soạn thảo...
          </div>
        </div>
      );
    }

    // ─── Current heading level for dropdown label ─────────────────────────
    const activeHeading = HEADING_OPTIONS.find((h) =>
      h.level === 0
        ? !editor.isActive("heading")
        : editor.isActive("heading", { level: h.level }),
    );
    const ActiveHeadingIcon = activeHeading?.icon || Pilcrow;

    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col relative w-full border-x border-b border-border/40 rounded-b-md">
          {/* ── Toolbar ── */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-y border-border/60 flex-wrap sticky -top-10 z-10 bg-background/95 backdrop-blur shadow-sm">
            {/* Heading Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="xs">
                  <ActiveHeadingIcon className="text-muted-foreground" />
                  <span className="hidden sm:inline font-medium">
                    {activeHeading?.label || "Đoạn văn"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {HEADING_OPTIONS.map((h) => {
                  const HIcon = h.icon;
                  return (
                    <DropdownMenuItem
                      key={h.level}
                      onClick={() => {
                        if (h.level === 0) {
                          editor.chain().focus().setParagraph().run();
                        } else {
                          editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: h.level })
                            .run();
                        }
                      }}
                      className={cn(
                        "text-sm cursor-pointer py-1.5",
                        h.level === 0
                          ? !editor.isActive("heading") &&
                              "bg-accent/50 font-medium"
                          : editor.isActive("heading", { level: h.level }) &&
                              "bg-accent/50 font-medium",
                      )}
                    >
                      <HIcon className="h-4 w-4 opacity-70" />
                      {h.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-4!" />

            {/* Formatting */}
            <ToolbarButton
              icon={Bold}
              label="In đậm (Ctrl+B)"
              isActive={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              icon={Italic}
              label="In nghiêng (Ctrl+I)"
              isActive={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              icon={UnderlineIcon}
              label="Gạch chân (Ctrl+U)"
              isActive={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <ToolbarButton
              icon={Strikethrough}
              label="Gạch ngang"
              isActive={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />

            <Separator orientation="vertical" className="h-4!" />

            {/* Alignment */}
            <ToolbarButton
              icon={AlignLeft}
              label="Căn trái"
              isActive={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            />
            <ToolbarButton
              icon={AlignCenter}
              label="Căn giữa"
              isActive={editor.isActive({ textAlign: "center" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
            />
            <ToolbarButton
              icon={AlignRight}
              label="Căn phải"
              isActive={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            />
            <ToolbarButton
              icon={AlignJustify}
              label="Căn đều"
              isActive={editor.isActive({ textAlign: "justify" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
            />

            <Separator orientation="vertical" className="h-4!" />

            {/* Lists */}
            <ToolbarButton
              icon={List}
              label="Danh sách"
              isActive={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              icon={ListOrdered}
              label="Danh sách số"
              isActive={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />

            <Separator orientation="vertical" className="h-4!" />

            {/* Insert */}
            <ToolbarButton
              icon={TableIcon}
              label="Chèn bảng 3×2"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 2, withHeaderRow: false })
                  .run()
              }
            />
            <ToolbarButton
              icon={Minus}
              label="Đường kẻ ngang"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />

            <Separator orientation="vertical" className="h-4!" />

            {/* Undo / Redo */}
            <ToolbarButton
              icon={Undo2}
              label="Hoàn tác (Ctrl+Z)"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            />
            <ToolbarButton
              icon={Redo2}
              label="Làm lại (Ctrl+Y)"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            />
          </div>

          {/* ── Editor Content Area ── */}
          <div className="flex-1 py-4 px-2 sm:px-4">
            <EditorContent
              editor={editor}
              className="contract-editor-content min-h-[300px]"
            />
          </div>
        </div>
      </TooltipProvider>
    );
  },
);
