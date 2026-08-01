"use client";

import { useState } from "react";

function getInitials(title: string) {
  return title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function BookCover({
  title,
  coverUrl,
  size = 40,
}: {
  title: string;
  coverUrl?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = coverUrl && !failed;

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-xs font-semibold text-slate-500"
      style={{ width: size, height: size * 1.35 }}
    >
      {showImage ? (
        // Admin tool, internal use — plain <img> avoids configuring
        // next/image remotePatterns for an as-yet-unknown backend host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{getInitials(title)}</span>
      )}
    </div>
  );
}
