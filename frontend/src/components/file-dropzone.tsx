"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  File as FileIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const MAX_FILES = 5;
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "video/mp4",
  "audio/mpeg",
];

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return Film;
  if (mime.includes("pdf") || mime.includes("word") || mime.includes("text"))
    return FileText;
  return FileIcon;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function FileDropzone({ files, onChange }: FileDropzoneProps) {
  const t = useTranslations("components");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const arr = Array.from(incoming);
      const valid: File[] = [];

      for (const f of arr) {
        if (!ACCEPTED_TYPES.includes(f.type)) {
          setError(t("dropzone.notAccepted", { name: f.name }));
          continue;
        }
        if (f.size > MAX_SIZE) {
          setError(t("dropzone.tooLarge", { name: f.name }));
          continue;
        }
        valid.push(f);
      }

      const merged = [...files, ...valid].slice(0, MAX_FILES);
      if (files.length + valid.length > MAX_FILES) {
        setError(t("dropzone.maxFiles", { maxFiles: MAX_FILES }));
      }
      onChange(merged);
    },
    [files, onChange, t],
  );

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={
          dragOver
            ? { scale: 1.005 }
            : { scale: 1 }
        }
        transition={{ duration: 0.2 }}
        className={`relative flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed min-h-[248px] p-10 cursor-pointer transition-all ${
          dragOver
            ? "bg-primary/[0.06] border-primary/50 shadow-[0_0_32px_oklch(0.72_0.19_160_/_0.1)]"
            : "bg-muted/30 border-border hover:border-primary/30"
        }`}
      >
        {/* Upload icon — 64px */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className={`transition-colors ${dragOver ? "text-primary" : "text-[#1C274C] dark:text-muted-foreground"}`}
        >
          <path
            d="M32 42V22M32 22L24 30M32 22L40 30"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 42C12 48.627 17.373 54 24 54H40C46.627 54 52 48.627 52 42"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div className="text-center">
          <p className="text-lg md:text-2xl font-semibold text-foreground/80">
            {t("dropzone.dragOrBrowse")}{" "}
            <span className="text-primary underline underline-offset-4 decoration-primary/40 cursor-pointer">
              {t("dropzone.browse")}
            </span>
          </p>
          <p className="text-sm md:text-lg text-muted-foreground mt-2">
            {t("dropzone.fileTypes", { maxFiles: MAX_FILES })}
          </p>
        </div>
        {/* File count indicator */}
        {files.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-primary/80 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {t("dropzone.filesAdded", { count: files.length, maxFiles: MAX_FILES })}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {files.map((f, i) => {
              const Icon = fileIcon(f.type);
              return (
                <motion.li
                  key={`${f.name}-${f.size}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center gap-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm px-4 py-3 hover:border-primary/20 hover:bg-card/60 transition-all"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(f.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Remove file"
                    className="h-7 w-7 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
