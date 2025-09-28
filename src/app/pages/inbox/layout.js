import ProtectedLayout from "@/app/components/ProtectedLayout";
export default function DashboardLayout({ children }) {
  return (
    <ProtectedLayout redirectTo="/">
      <div className="flex-1 flex flex-col min-h-screen bg-gray-100 py-2 px-4 relative overflow-x-hidden">
        {/* Decorative background images */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="flex justify-end items-end h-full w-full">
            <img src="/images/globe.png" alt="Globe" className="w-[420px] opacity-10 mr-8 mb-8 select-none hidden md:block" />
          </div>
          <div className="flex justify-start items-end h-full w-full absolute top-0 left-0">
            <img src="/images/nations.png" alt="Nations" className="w-[1000px] h-[655px] opacity-10 select-none hidden md:block" />
          </div>
        </div>
        {children}
      </div>
    </ProtectedLayout>
  );
}
