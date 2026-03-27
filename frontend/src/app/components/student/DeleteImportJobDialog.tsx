import { useState } from "react";

import { api } from "../../../lib/api";
import type { ImportJob } from "../../../lib/types";
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

type DeleteImportJobDialogProps = {
  job: ImportJob;
  onDeleted: () => Promise<void> | void;
};

export function DeleteImportJobDialog({ job, onDeleted }: DeleteImportJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage("");
    try {
      await api.deleteImportJob(job.id);
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
        <Button variant="outline" size="sm" disabled={job.status === "processing"}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this import job?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes imported rows created by{" "}
            <span className="font-medium text-slate-900">{job.source_filename || job.source_type}</span>.
            Related certificate matches will be reset and rematched against the remaining imported data.
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
            {deleting ? "Deleting..." : "Delete import job"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
