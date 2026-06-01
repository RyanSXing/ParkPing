import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { getAdminImports, requireAdminUser } from "@/lib/admin/queries";
import { ImportConsole, ImportStatusBadge } from "./import-console";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminImportPage() {
  await requireAdminUser();
  const imports = await getAdminImports();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Import Vehicles</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload CSV or Excel files, preview changes, then confirm valid rows.
        </p>
      </div>

      <ImportConsole />

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Import history</h2>
          <p className="mt-1 text-sm text-slate-600">
            Recent previews and confirmed uploads.
          </p>
        </div>

        {imports.length ? (
          <div className="overflow-x-auto rounded-lg border border-[#E4ECFC] bg-white">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>File</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Rows</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>Updated</TableHeaderCell>
                  <TableHeaderCell>Failed</TableHeaderCell>
                  <TableHeaderCell>Uploaded</TableHeaderCell>
                  <TableHeaderCell>Confirmed</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {imports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-950">
                      {item.filename}
                    </TableCell>
                    <TableCell>
                      <ImportStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>{item.totalRows}</TableCell>
                    <TableCell>{item.rowsCreated}</TableCell>
                    <TableCell>{item.rowsUpdated}</TableCell>
                    <TableCell>{item.rowsFailed}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>{formatDate(item.confirmedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No imports yet"
            message="Upload a CSV or Excel file to create the first import preview."
          />
        )}
      </section>
    </div>
  );
}
