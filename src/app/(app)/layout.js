import AppHeader from "@/components/layout/AppHeader";
import HelpFab from "@/components/layout/HelpFab";
import RequireAuth from "@/components/layout/RequireAuth";

// Everything behind the login screen shares the header, the floating help
// button and the role guard. The (app) group keeps URLs clean — /kb, not /app/kb.
export default function AuthenticatedLayout({ children }) {
  return (
    <RequireAuth>
      <AppHeader />
      {children}
      <HelpFab />
    </RequireAuth>
  );
}
