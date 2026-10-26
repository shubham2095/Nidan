import { useId, useState } from 'react';
import { MapPin, Navigation, Phone, Stethoscope } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref } from '../../utils/format.js';
import Button from './Button.jsx';
import MapEmbed from './MapEmbed.jsx';
import ScheduleTabs from './ScheduleTabs.jsx';

/**
 * Our clinics, one at a time: a tab for each clinic (hidden when there is only one), then its address,
 * directions, doctor timings and map.
 * `doctors` (with their schedules) fills in the doctor timings; each clinic lists the doctors who sit there.
 */
export default function ClinicLocator({ doctors }) {
  const { clinic, ownClinics } = useSite();
  const [active, setActive] = useState(0);
  const baseId = useId();
  if (ownClinics.length === 0) return null;

  const index = Math.min(active, ownClinics.length - 1);
  const location = ownClinics[index];
  const many = ownClinics.length > 1;
  const timings = (doctors || [])
    .map((doctor) => ({ doctor, entry: doctor.schedules.find((schedule) => schedule.location.id === location.id) }))
    .filter(({ entry }) => entry && entry.slots.length > 0);

  return (
    <div>
      {many && (
        <div role="tablist" aria-label="Choose a clinic" className="mb-8 flex flex-wrap justify-center gap-3">
          {ownClinics.map((item, tabIndex) => {
            const selected = tabIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${baseId}-tab-${tabIndex}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tabIndex)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') setActive((tabIndex + 1) % ownClinics.length);
                  if (event.key === 'ArrowLeft') setActive((tabIndex - 1 + ownClinics.length) % ownClinics.length);
                }}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold sm:py-2.5 transition duration-200 ${
                  selected
                    ? 'bg-brand-700 text-white shadow-md shadow-brand-700/25'
                    : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-800'
                }`}
              >
                <MapPin className={`h-4 w-4 ${selected ? 'text-blush-200' : 'text-blush-500'}`} aria-hidden="true" />
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      <div
        key={location.id}
        role={many ? 'tabpanel' : undefined}
        id={many ? `${baseId}-panel` : undefined}
        aria-labelledby={many ? `${baseId}-tab-${index}` : undefined}
        className="pop-in grid items-stretch gap-6 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-brand-900/5 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blush-500 to-blush-300 text-white shadow-md shadow-blush-500/30">
                <MapPin className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold">{location.name}</h3>
                <p className="mt-1 leading-relaxed text-slate-600">
                  {location.address}, {location.city}, {location.state}
                  {location.postalCode && ` ${location.postalCode}`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {location.mapUrl && (
                <Button href={location.mapUrl} target="_blank" rel="noopener noreferrer" variant="gradient">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Get directions
                </Button>
              )}
              <Button href={telHref(clinic.phonePrimary)} variant="outline">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call the clinic
              </Button>
            </div>

            {doctors && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                  <Stethoscope className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  Doctor timings
                </h4>
                {timings.length > 0 ? (
                  <ul className="space-y-5">
                    {timings.map(({ doctor, entry }) => (
                      <li key={doctor.id}>
                        <p className="mb-2 font-semibold text-slate-900">{doctor.name}</p>
                        <ScheduleTabs schedules={[entry]} showAddress={false} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl bg-brand-50/70 p-4 text-sm leading-relaxed text-slate-600">
                    Doctor timings for this clinic will be updated soon. Please call us to confirm before you visit.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <MapEmbed key={location.id} location={location} instant className="h-80 sm:h-[26rem] lg:h-full lg:min-h-[26rem]" />
        </div>
      </div>
    </div>
  );
}
