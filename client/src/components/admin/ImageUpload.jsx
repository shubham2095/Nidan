import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../public/Button.jsx';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Picture picker with preview. `upload(file)` must resolve to the new image URL (or an object with `photoUrl` style
 * handled by the caller); `onChange(url | null)` receives the result. Pass `round` for avatar-style previews.
 */
export default function ImageUpload({ value, onChange, upload, label = 'Image', hint = 'JPEG, PNG or WebP, up to 5 MB', round = false }) {
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('That image is larger than 5 MB.');
      return;
    }
    setBusy(true);
    try {
      onChange(await upload(file));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className={`grid h-24 w-24 shrink-0 place-items-center overflow-hidden bg-slate-100 ring-1 ring-slate-200 ${round ? 'rounded-full' : 'rounded-2xl'}`}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-7 w-7 text-slate-400" aria-hidden="true" />}
        </div>
        <div className="space-y-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="sr-only" aria-label={`Choose ${label.toLowerCase()}`} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value && (
              <Button variant="outline" className="!border-red-300 !text-red-700 hover:!bg-red-50" onClick={() => onChange(null)} disabled={busy}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}
