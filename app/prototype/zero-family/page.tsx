import { Suspense } from "react";
import { ZeroFamilyPrototype } from "./ZeroFamilyPrototype";

export const metadata = {
  title: "PROTOTYPE — zero-Family home",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-zinc-500">
          Chargement…
        </div>
      }
    >
      <ZeroFamilyPrototype />
    </Suspense>
  );
}
