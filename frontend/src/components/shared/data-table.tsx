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
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
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
                className={rowClassName?.(item) ?? "hover:bg-slate-50"}
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
