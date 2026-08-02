"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Paragraph } from "@/lib/api/chapters";

const STYLE_OPTIONS = [
  { value: "normal", label: "Văn bản thường" },
  { value: "heading1", label: "Tiêu đề 1" },
  { value: "heading2", label: "Tiêu đề 2" },
  { value: "heading3", label: "Tiêu đề 3" },
  { value: "quote", label: "Trích dẫn" },
];

const ALIGNMENT_OPTIONS = ["left", "center", "right", "justify"];

export function ParagraphEditor({
  paragraph,
  onChange,
  onRemove,
}: {
  paragraph: Paragraph;
  onChange: (paragraph: Paragraph) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: paragraph.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  function update(patch: Partial<Paragraph>) {
    onChange({ ...paragraph, ...patch });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`space-y-2 rounded-lg border border-slate-200 bg-white p-3 ${isDragging ? "opacity-60 shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Kéo để sắp xếp lại đoạn văn"
          className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing"
        >
          ⠿
        </button>
        <Select
          value={paragraph.style ?? "normal"}
          onChange={(e) => update({ style: e.target.value })}
          className="w-40"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={paragraph.alignment}
          onChange={(e) => update({ alignment: e.target.value })}
          className="w-32"
        >
          {ALIGNMENT_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => update({ isBold: !paragraph.isBold })}
            aria-pressed={paragraph.isBold}
            className={`h-8 w-8 rounded font-bold ${paragraph.isBold ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => update({ isItalic: !paragraph.isItalic })}
            aria-pressed={paragraph.isItalic}
            className={`h-8 w-8 rounded italic ${paragraph.isItalic ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => update({ isUnderline: !paragraph.isUnderline })}
            aria-pressed={paragraph.isUnderline}
            className={`h-8 w-8 rounded underline ${paragraph.isUnderline ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            U
          </button>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove} className="ml-auto">
          Xóa đoạn
        </Button>
      </div>

      <Textarea
        value={paragraph.text}
        onChange={(e) => update({ text: e.target.value })}
        rows={3}
        placeholder="Nội dung đoạn văn..."
        style={{
          fontWeight: paragraph.isBold ? 700 : 400,
          fontStyle: paragraph.isItalic ? "italic" : "normal",
          textDecoration: paragraph.isUnderline ? "underline" : "none",
          textAlign: paragraph.alignment as React.CSSProperties["textAlign"],
          color: paragraph.color || undefined,
          backgroundColor: paragraph.backgroundColor || undefined,
        }}
      />
    </div>
  );
}
