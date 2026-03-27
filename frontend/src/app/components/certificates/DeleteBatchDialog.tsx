import { useState } from "react";

import { api } from "../../../lib/api";
import type { SourcePdfBatch } from "../../../lib/types";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

type DeleteBatchDialogProps = {
  batch: SourcePdfBatch;
  onDeleted: () => Promise<void> | void;
};

export function DeleteBatchDialog({ batch, onDeleted }: DeleteBatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage("");
    try {
      await api.deleteBatch(batch.id);
      await onDeleted();
      setOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={batch.status === "processing"}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete uploaded batch?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the uploaded PDF, split certificate files, previews, and all page-level processing
            records for <span className="font-medium text-slate-900">{batch.original_filename}</span>. Imported
            student rows, Drive files, and Sheet updates are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {deleting ? "Deleting..." : "Delete batch"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
