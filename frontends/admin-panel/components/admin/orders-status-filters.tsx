import Link from "next/link";
import { ORDER_FLOW_STATUSES } from "@/types/order";
import { cn } from "@/lib/utils";

type Props = {
  basePath: "/admin/orders" | "/store/orders";
  storeId?: string;
  activeStatus?: string;
};

function href(basePath: Props["basePath"], storeId: string | undefined, status: string | undefined) {
  const q = new URLSearchParams();
  if (storeId) q.set("storeId", storeId);
  if (status) q.set("status", status);
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function OrdersStatusFilters({ basePath, storeId, activeStatus }: Props) {
  const cur = activeStatus?.trim() || "";

  const chips: { label: string; status?: string }[] = [{ label: "Barchasi" }, ...ORDER_FLOW_STATUSES.map((s) => ({ label: s, status: s }))];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ label, status }) => {
        const active = (status ?? "") === cur;
        return (
          <Link
            key={label}
            href={href(basePath, storeId, status)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              active ? "border-brand bg-brand/10 text-brand" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
