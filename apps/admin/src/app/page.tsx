import { redirect } from "next/navigation";

// The `proxy.ts` file normally handles this redirect before we even get
// here; this is just a safety net (e.g. if a request slips past it).
export default function RootPage() {
  redirect("/login");
}
