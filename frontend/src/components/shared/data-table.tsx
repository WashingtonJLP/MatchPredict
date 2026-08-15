type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (item: T) => string;
  rowClassName?: (item: T) => string;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid gap-3 p-3 md:hidden">
        {data.map((item) => (
          <article
            key={getRowKey(item)}
            className={`rounded-xl border border-border bg-background p-4 ${rowClassName?.(item) ?? ""}`}
          >
            <dl className="grid gap-3">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="grid gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    {column.header}
                  </dt>
                  <dd className="min-w-0 text-sm text-foreground">
                    {column.render(item)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr
                key={getRowKey(item)}
                className={rowClassName?.(item) ?? "hover:bg-muted"}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-5 py-4 align-middle ${column.className ?? ""}`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
