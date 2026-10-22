import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce.js';

/** Search input that reports its value shortly after typing stops. Keeps in sync if `value` changes elsewhere (e.g. "clear filters"). */
export default function SearchBox({ value, onChange, placeholder = 'Search', label = 'Search' }) {
  const [text, setText] = useState(value || '');
  const debounced = useDebounce(text);

  useEffect(() => {
    setText(value || '');
  }, [value]);

  useEffect(() => {
    if (debounced !== (value || '')) onChange(debounced);
  }, [debounced]);

  return (
    <div className="relative">
      <label htmlFor="admin-search" className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input id="admin-search" type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} maxLength={100} className="field-input py-2 pl-10 text-sm" />
    </div>
  );
}
