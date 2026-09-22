import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminRoute() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <AdminDashboard />
      </main>
    </div>
  );
}
