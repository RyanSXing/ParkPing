"use client";

import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  confirmImportAction,
  previewImportAction,
  type ImportActionState,
} from "./actions";

const initialState: ImportActionState = {
  message: "",
  preview: null,
  confirmed: false,
};

export function ImportConsole() {
  const [previewState, previewAction, previewPending] = useActionState(
    previewImportAction,
    initialState,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmImportAction,
    initialState,
  );
  const activePreview = previewState.preview;
  const message = confirmState.message || previewState.message;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-lg border border-[#E4ECFC] bg-white px-4 py-3 text-sm font-semibold text-slate-800">
          {message}
        </div>
      ) : null}

      <form
        action={previewAction}
        className="grid gap-3 rounded-lg border border-[#E4ECFC] bg-white p-4 md:grid-cols-[1fr_auto]"
      >
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-800">CSV or Excel file</span>
          <input
            type="file"
            name="file"
            accept=".csv,.xlsx"
            required
            className="block w-full rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#F0F9FF] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#2563EB] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
          />
        </label>
        <Button type="submit" className="self-end" disabled={previewPending}>
          {previewPending ? "Previewing..." : "Preview import"}
        </Button>
      </form>

      {activePreview ? (
        <section className="space-y-4 rounded-lg border border-[#E4ECFC] bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Preview</h2>
              <p className="mt-1 text-sm text-slate-600">
                {activePreview.filename} is staged. Confirm to write valid rows.
              </p>
            </div>
            <form action={confirmAction}>
              <input type="hidden" name="preview" value={JSON.stringify(activePreview)} />
              <Button
                type="submit"
                disabled={confirmPending || !activePreview.validRows.length}
              >
                {confirmPending ? "Confirming..." : "Confirm import"}
              </Button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Rows" value={activePreview.totalRows} />
            <Metric label="Create" value={activePreview.rowsToCreate} />
            <Metric label="Update" value={activePreview.rowsToUpdate} />
            <Metric label="Invalid" value={activePreview.invalidRows} />
            <Metric label="Duplicates" value={activePreview.duplicateRows} />
          </div>

          {activePreview.errors.length ? (
            <div className="overflow-x-auto rounded-lg border border-[#E4ECFC]">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Row</TableHeaderCell>
                    <TableHeaderCell>Field</TableHeaderCell>
                    <TableHeaderCell>Error</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activePreview.errors.slice(0, 25).map((error, index) => (
                    <TableRow key={`${error.rowNumber}-${error.field}-${index}`}>
                      <TableCell>{error.rowNumber}</TableCell>
                      <TableCell>{error.field}</TableCell>
                      <TableCell className="whitespace-normal">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="No import errors"
              message="All uploaded rows are valid and ready to confirm."
            />
          )}
        </section>
      ) : null}

      {confirmState.confirmed ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Import confirmed. Vehicle records are updated.
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#E4ECFC] bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

export function ImportStatusBadge({ status }: { status: string }) {
  return <Badge tone={status === "confirmed" ? "resolved" : "pending"}>{status}</Badge>;
}
