"use client";

import { OPERATORS, unreachableSelected, type Visibility } from "./mock-data";
import { Feed, Phone, Sheet } from "./host-ui";

export const variantCName = "Deux zones";

export function VariantC({
  open,
  heading,
  visibility,
  selected,
  title,
  onTitle,
  onVisibility,
  onToggle,
  onClose,
  onAdd,
  onEdit,
}: {
  open: boolean;
  heading: string;
  visibility: Visibility;
  selected: string[];
  title: string;
  onTitle: (v: string) => void;
  onVisibility: (v: Visibility) => void;
  onToggle: (id: string) => void;
  onClose: () => void;
  onAdd: () => void;
  onEdit: () => void;
}) {
  const locked = visibility === "personal";
  const chosen = OPERATORS.filter((o) => selected.includes(o.id));
  const rest = OPERATORS.filter((o) => !selected.includes(o.id));
  const restOk = rest.filter((o) => o.reachable);
  const restBad = rest.filter((o) => !o.reachable);
  const bad = unreachableSelected(selected);

  return (
    <Phone>
      <Feed onAdd={onAdd} onEdit={onEdit} />
      {open && <Sheet
        heading={heading}
        visibility={visibility}
        title={title}
        onTitle={onTitle}
        onVisibility={onVisibility}
        onClose={onClose}
      >
        {locked ? (
          <p className="text-sm text-stone-500">Personnel : Marie seulement.</p>
        ) : (
          <div className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200">
            <p className="mb-2 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
              Retenus
            </p>
            {chosen.length === 0 ? (
              <p className="mb-3 text-sm text-stone-500">
                Personne. Le rappel reste dû.
              </p>
            ) : (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {chosen.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onToggle(o.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-sm ring-1 ring-stone-300"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        o.reachable ? "bg-teal-600" : "bg-amber-500"
                      }`}
                    />
                    {o.name}
                    <span className="text-stone-400">×</span>
                  </button>
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <>
                {restOk.length > 0 && (
                  <Pool
                    title="Joignables"
                    people={restOk}
                    onAdd={onToggle}
                  />
                )}
                {restBad.length > 0 && (
                  <Pool
                    title="Injoignables — tu peux quand même"
                    people={restBad}
                    onAdd={onToggle}
                    muted
                  />
                )}
              </>
            )}
            {bad.length > 0 && (
              <p className="mt-3 border-t border-stone-200 pt-2 text-xs leading-4 text-amber-900">
                Point ambre = pas d’appareil vivant. L’envoi attendra.
              </p>
            )}
          </div>
        )}
      </Sheet>}
    </Phone>
  );
}

function Pool({
  title,
  people,
  onAdd,
  muted,
}: {
  title: string;
  people: { id: string; name: string; isMe: boolean }[];
  onAdd: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "mt-2 opacity-80" : "mt-1"}>
      <p className="mb-1 text-[10px] tracking-wide text-stone-500 uppercase">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {people.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onAdd(o.id)}
            className="rounded-full bg-white px-2.5 py-1 text-sm text-stone-700 ring-1 ring-dashed ring-stone-300"
          >
            + {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}
