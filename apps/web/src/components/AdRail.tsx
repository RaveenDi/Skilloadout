import AdSlot from "./AdSlot";
import { adProps } from "@/lib/site";

// The site's only ad placement by default: a right-hand rail with two units.
// The top unit sticks while you scroll; the second sits below it. Hidden on small screens
// (a phone has no room for a rail — the layout simply drops it rather than shrinking content).
export default function AdRail({ className = "" }: { className?: string }) {
  const top = adProps("rail-top");
  const bottom = adProps("rail-bottom");
  if (top.provider === "none") return null;
  return (
    <aside className={`hidden w-[300px] shrink-0 xl:block ${className}`} aria-label="Sponsored">
      <div className="sticky top-20 space-y-4">
        <AdSlot {...top} />
        <AdSlot {...bottom} />
      </div>
    </aside>
  );
}
