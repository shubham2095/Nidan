import { EmptyState, ErrorState, LoadingState } from '../public/States.jsx';

/**
 * Responsive table with loading, error and empty states.
 * columns: [{ key, header, render?(row), className? }]. Rows are keyboard-clickable when `onRowClick` is set.
 */
export default function DataTable({ columns, rows, rowKey = 'id', onRowClick, loading, error, onRetry, emptyTitle = 'Nothing here yet', emptyMessage, caption, minWidth = '40rem' }) {
  if (error) return <ErrorState message={error} onRetry={onRetry} className="py-12" />;
  if (loading && !rows?.length) return <LoadingState className="py-12" />;
  if (!rows?.length) return <EmptyState title={emptyTitle} message={emptyMessage} className="my-6 py-10" />;

  return (
    // `relative` keeps absolutely-positioned content (sr-only headers) inside the scroll area instead of widening the page
    <div className={`relative overflow-x-auto rounded-2xl border border-slate-200 bg-white transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`px-4 py-3 ${column.className || ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (event) => (event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget && (event.preventDefault(), onRowClick(row)) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-brand-50/50 focus-visible:bg-brand-50/60' : ''}
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-top ${column.className || ''}`}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
