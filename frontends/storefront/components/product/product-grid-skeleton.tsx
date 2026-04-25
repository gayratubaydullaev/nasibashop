import { cn } from "@/lib/utils";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card",
            "animate-pulse",
          )}
        >
          <div className="aspect-square bg-zinc-200" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-[85%] rounded bg-zinc-200" />
            <div className="h-4 w-[55%] rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
