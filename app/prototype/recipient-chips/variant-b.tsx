"use client";

import { OPERATORS, unreachableSelected, type Visibility } from "./mock-data";
import { Feed, Phone, Sheet } from "./host-ui";

export const variantBName = "Liste à cocher";

export function VariantB({
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
          <div className="rounded-2xl bg-stone-100 px-4 py-3">
            <p className="text-sm font-medium">Marie (toi)</p>
            <p className="mt-0.5 text-xs text-stone-500">
              Un rappel personnel n’envoie qu’à toi.
            </p>
          </div>
        ) : (
          <>
            <ul className="overflow-hidden rounded-2xl ring-1 ring-stone-200">
              {OPERATORS.map((o, i) => {
                const on = selected.includes(o.id);
                const warn = on && !o.reachable;
                return (
                  <li
                    key={o.id}
                    className={
                      i === 0 ? "" : "border-t border-stone-200"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(o.id)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left ${
                        warn ? "bg-amber-50" : on ? "bg-white" : "bg-stone-50"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] ${
                          on
                            ? "border-teal-800 bg-teal-800 text-white"
                            : "border-stone-300 bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {o.name}
                          {o.isMe ? " (toi)" : ""}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                          o.reachable
                            ? "bg-teal-100 text-teal-800"
                            : "bg-amber-200 text-amber-950"
                        }`}
                      >
                        {o.reachable ? "Joignable" : "Injoignable"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {bad.length > 0 && (
              <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-4 text-amber-950 ring-1 ring-amber-200">
                L’envoi attendra qu’ils autorisent les notifications. Tu
                peux les garder.
              </div>
            )}
            {selected.length === 0 && (
              <p className="mt-2 text-xs text-stone-500">
                Sans destinataire, le rappel reste dû.
              </p>
            )}
          </>
        )}
      </Sheet>}
    </Phone>
  );
}
