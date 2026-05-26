import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminSidebar />
      <div className="md:ml-56 p-4 md:p-8">{children}</div>
    </div>
  );
}
