"use client";

import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-md border border-slate-200 bg-slate-50" />,
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

export function RichTextEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="overflow-hidden rounded-md border border-slate-300 bg-white [&_.ql-container]:min-h-36 [&_.ql-editor]:min-h-36 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-container]:border-0">
        <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} />
      </div>
    </div>
  );
}
