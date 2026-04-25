import { StoreShell } from "@/components/admin/store-shell";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
