"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ParagraphEditor } from "./paragraph-editor";
import type { ChapterContent, ChapterImage, ChapterTable, Footnote, Paragraph } from "@/lib/api/chapters";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newParagraph(order: number): Paragraph {
  return {
    id: newId(),
    text: "",
    style: "normal",
    order,
    indent: 0,
    alignment: "left",
    isBold: false,
    isItalic: false,
    isUnderline: false,
  };
}

export function ChapterContentEditor({
  value,
  onChange,
}: {
  value: ChapterContent;
  onChange: (content: ChapterContent) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function addParagraph() {
    onChange({ ...value, paragraphs: [...value.paragraphs, newParagraph(value.paragraphs.length)] });
  }

  function updateParagraph(updated: Paragraph) {
    onChange({
      ...value,
      paragraphs: value.paragraphs.map((p) => (p.id === updated.id ? updated : p)),
    });
  }

  function removeParagraph(id: string) {
    onChange({ ...value, paragraphs: value.paragraphs.filter((p) => p.id !== id) });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.paragraphs.findIndex((p) => p.id === active.id);
    const newIndex = value.paragraphs.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(value.paragraphs, oldIndex, newIndex).map((p, i) => ({
      ...p,
      order: i,
    }));
    onChange({ ...value, paragraphs: reordered });
  }

  function addImage() {
    const image: ChapterImage = { id: newId(), url: "", caption: "", altText: "", alignment: "center" };
    onChange({ ...value, images: [...(value.images ?? []), image] });
  }

  function updateImage(id: string, patch: Partial<ChapterImage>) {
    onChange({
      ...value,
      images: (value.images ?? []).map((img) => (img.id === id ? { ...img, ...patch } : img)),
    });
  }

  function removeImage(id: string) {
    onChange({ ...value, images: (value.images ?? []).filter((img) => img.id !== id) });
  }

  function addTable() {
    const table: ChapterTable = { id: newId(), caption: "", headers: [], rows: [] };
    onChange({ ...value, tables: [...(value.tables ?? []), table] });
  }

  function updateTable(id: string, patch: Partial<ChapterTable>) {
    onChange({
      ...value,
      tables: (value.tables ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }

  function removeTable(id: string) {
    onChange({ ...value, tables: (value.tables ?? []).filter((t) => t.id !== id) });
  }

  function addFootnote() {
    const footnote: Footnote = { id: newId(), reference: "", content: "" };
    onChange({ ...value, footnotes: [...(value.footnotes ?? []), footnote] });
  }

  function updateFootnote(id: string, patch: Partial<Footnote>) {
    onChange({
      ...value,
      footnotes: (value.footnotes ?? []).map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  }

  function removeFootnote(id: string) {
    onChange({ ...value, footnotes: (value.footnotes ?? []).filter((f) => f.id !== id) });
  }

  return (
    <div className="space-y-4">
      <Textarea
        label="Mở đầu (Introduction)"
        value={value.introduction ?? ""}
        onChange={(e) => onChange({ ...value, introduction: e.target.value })}
        rows={2}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Đoạn văn</label>
          <Button type="button" size="sm" variant="outline" onClick={addParagraph}>
            + Thêm đoạn
          </Button>
        </div>
        {value.paragraphs.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
            Chưa có đoạn văn nào — bấm &quot;+ Thêm đoạn&quot; để bắt đầu.
          </p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={value.paragraphs.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {value.paragraphs.map((paragraph) => (
                <ParagraphEditor
                  key={paragraph.id}
                  paragraph={paragraph}
                  onChange={updateParagraph}
                  onRemove={() => removeParagraph(paragraph.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Textarea
        label="Kết luận (Conclusion)"
        value={value.conclusion ?? ""}
        onChange={(e) => onChange({ ...value, conclusion: e.target.value })}
        rows={2}
      />

      <Card>
        <CardHeader
          title="Hình ảnh"
          action={
            <Button type="button" size="sm" variant="outline" onClick={addImage}>
              + Thêm ảnh
            </Button>
          }
        />
        {(value.images ?? []).length > 0 && (
          <CardBody className="space-y-3">
            {(value.images ?? []).map((image) => (
              <div key={image.id} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-3">
                <Input
                  placeholder="URL ảnh"
                  value={image.url}
                  onChange={(e) => updateImage(image.id, { url: e.target.value })}
                />
                <Input
                  placeholder="Chú thích"
                  value={image.caption ?? ""}
                  onChange={(e) => updateImage(image.id, { caption: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Alt text"
                    value={image.altText ?? ""}
                    onChange={(e) => updateImage(image.id, { altText: e.target.value })}
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeImage(image.id)}>
                    Xóa
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Bảng biểu"
          description="Nhập tiêu đề cột và các dòng, mỗi ô cách nhau bởi dấu phẩy"
          action={
            <Button type="button" size="sm" variant="outline" onClick={addTable}>
              + Thêm bảng
            </Button>
          }
        />
        {(value.tables ?? []).length > 0 && (
          <CardBody className="space-y-3">
            {(value.tables ?? []).map((table) => (
              <div key={table.id} className="space-y-2 rounded-md border border-slate-200 p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Chú thích bảng"
                    value={table.caption ?? ""}
                    onChange={(e) => updateTable(table.id, { caption: e.target.value })}
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeTable(table.id)}>
                    Xóa bảng
                  </Button>
                </div>
                <Input
                  placeholder="Tiêu đề cột, cách nhau bởi dấu phẩy (VD: Tên, Số lượng, Giá)"
                  value={table.headers.join(", ")}
                  onChange={(e) =>
                    updateTable(table.id, {
                      headers: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
                <Textarea
                  placeholder={"Mỗi dòng 1 hàng, các ô cách nhau bởi dấu phẩy\nVD: Sách A, 5, 100000"}
                  rows={3}
                  value={table.rows.map((r) => r.join(", ")).join("\n")}
                  onChange={(e) =>
                    updateTable(table.id, {
                      rows: e.target.value
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line) => line.split(",").map((cell) => cell.trim())),
                    })
                  }
                />
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Chú thích cuối trang"
          action={
            <Button type="button" size="sm" variant="outline" onClick={addFootnote}>
              + Thêm chú thích
            </Button>
          }
        />
        {(value.footnotes ?? []).length > 0 && (
          <CardBody className="space-y-2">
            {(value.footnotes ?? []).map((footnote) => (
              <div key={footnote.id} className="flex gap-2">
                <Input
                  placeholder="Ký hiệu (VD: 1)"
                  className="w-24"
                  value={footnote.reference}
                  onChange={(e) => updateFootnote(footnote.id, { reference: e.target.value })}
                />
                <Input
                  placeholder="Nội dung chú thích"
                  value={footnote.content}
                  onChange={(e) => updateFootnote(footnote.id, { content: e.target.value })}
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeFootnote(footnote.id)}>
                  Xóa
                </Button>
              </div>
            ))}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
