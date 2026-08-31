"use client";

import { OPERATORS, unreachableSelected, type Visibility } from "./mock-data";
import { Feed, Phone, Sheet } from "./host-ui";

export const variantAName = "Puces compactes";

export function VariantA({
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
          <p className="text-sm text-stone-500">Personnel : toi seulement.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {OPERATORS.map((o) => {
                const on = selected.includes(o.id);
                const warn = on && !o.reachable;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onToggle(o.id)}
                    className={
                      warn
                        ? "rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-950 ring-1 ring-amber-400"
                        : on
                          ? "rounded-full bg-teal-800 px-3 py-1.5 text-sm font-medium text-white"
                          : "rounded-full bg-white px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-300"
                    }
                  >
                    {o.name}
                    {warn ? " · ⏳" : ""}
                    {o.isMe && on ? " (toi)" : ""}
                  </button>
                );
              })}
            </div>
            {bad.length > 0 && (
              <p className="mt-2 text-xs leading-4 text-amber-800">
                {bad.length === 1
                  ? `${bad[0].name} est injoignable — l’envoi attendra.`
                  : `${bad.map((o) => o.name).join(", ")} sont injoignables — l’envoi attendra.`}
              </p>
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
