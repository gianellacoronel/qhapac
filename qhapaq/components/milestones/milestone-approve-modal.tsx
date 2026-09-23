"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_EVIDENCE_MIME_TYPES,
  EVIDENCE_MAX_BYTES,
  formatFileSize,
  resolveEvidenceMimeType,
} from "@/lib/milestones/evidence";
import { cn } from "@/lib/utils";

export type ApprovalModalPhase =
  | "idle"
  | "preparing"
  | "uploading"
  | "recording"
  | "confirming"
  | "success"
  | "error";

export type ApproveMilestonePayload = {
  description: string;
  file: File;
};

type MilestoneApproveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneTitle: string;
  phase: ApprovalModalPhase;
  error: string | null;
  onConfirm: (payload: ApproveMilestonePayload) => void | Promise<void>;
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export function MilestoneApproveModal({
  open,
  onOpenChange,
  milestoneTitle,
  phase,
  error,
  onConfirm,
}: MilestoneApproveModalProps) {
  const t = useTranslations("milestones");
  const locale = useLocale();
  const descriptionId = useId();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const busy =
    phase === "preparing" ||
    phase === "uploading" ||
    phase === "recording" ||
    phase === "confirming";

  useEffect(() => {
    if (!open) {
      setDescription("");
      setFile(null);
      setLocalError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case "preparing":
        return t("phasePreparing");
      case "uploading":
        return t("phaseUploading");
      case "recording":
        return t("phaseRecording");
      case "confirming":
        return t("phaseConfirming");
      case "success":
        return t("phaseSuccess");
      default:
        return null;
    }
  }, [phase, t]);

  const displayError = localError ?? error;

  const handleFileChange = (next: File | null) => {
    setLocalError(null);
    if (!next) {
      setFile(null);
      return;
    }

    if (next.size > EVIDENCE_MAX_BYTES) {
      setFile(null);
      setLocalError(t("validationFileTooLarge"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!resolveEvidenceMimeType(next.name, next.type)) {
      setFile(null);
      setLocalError(t("validationFileType"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(next);
  };

  const handleClearFile = () => {
    setFile(null);
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    setLocalError(null);
    const trimmed = description.trim();
    if (!trimmed) {
      setLocalError(t("validationDescriptionRequired"));
      return;
    }
    if (!file) {
      setLocalError(t("validationFileRequired"));
      return;
    }
    if (busy || phase === "success") return;
    void onConfirm({ description: trimmed, file });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{t("approveModalTitle")}</DialogTitle>
          <DialogDescription>
            {t("approveModalDescription", { title: milestoneTitle })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={descriptionId}>{t("evidenceDescriptionLabel")}</Label>
            <textarea
              id={descriptionId}
              value={description}
              disabled={busy || phase === "success"}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("evidenceDescriptionPlaceholder")}
              rows={4}
              className={cn(
                "w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={fileInputId}>{t("evidenceFileLabel")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("evidenceFileHelp")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("evidenceFileFormats")}
            </p>

            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept={ACCEPT}
              disabled={busy || phase === "success"}
              className={cn(
                "h-9 w-full min-w-0 cursor-pointer rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none file:mr-3 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              )}
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                handleFileChange(next);
              }}
            />

            {file ? (
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex min-w-0 items-start gap-2">
                  <FileText
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size, locale)}
                      {resolveEvidenceMimeType(file.name, file.type)
                        ? ` · ${resolveEvidenceMimeType(file.name, file.type)}`
                        : null}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={busy || phase === "success"}
                  onClick={handleClearFile}
                  aria-label={t("removeFile")}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : null}

            <p className="sr-only">
              {ALLOWED_EVIDENCE_MIME_TYPES.join(", ")}
            </p>
          </div>

          {phaseLabel ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {phaseLabel}
            </p>
          ) : null}

          {displayError ? (
            <p className="text-sm text-destructive" role="alert">
              {displayError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={busy || phase === "success"}
            onClick={handleSubmit}
          >
            {phase === "success" ? t("phaseSuccess") : t("approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
