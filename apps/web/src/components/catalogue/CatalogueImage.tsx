"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

interface CatalogueImageProps {
  path: string | null;
  alt: string;
  className?: string;
  fallbackLabel: string;
}

export function CatalogueImage({
  path,
  alt,
  className = "h-full w-full object-cover",
  fallbackLabel,
}: CatalogueImageProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!path) {
      setUrl("");
      return;
    }
    let objectUrl = "";
    void api.blob(path).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200 px-3 text-center text-sm font-semibold text-primary">
        {fallbackLabel}
      </div>
    );
  }

  // Authenticated object URLs avoid exposing private storage keys.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}
