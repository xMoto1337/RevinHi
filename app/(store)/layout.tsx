import { SiteNav } from "@/components/SiteNav";

// Route group layout for the storefront pages (/, /performance, /desktop, future apps). Keeps the
// shared tab bar off unrelated routes like /binscout and /admin, without changing any URLs.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
