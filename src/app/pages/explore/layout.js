import ProtectedLayout from "@/app/components/ProtectedLayout";
import Image from "next/image";
export default function DashboardLayout({ children }) {
  return (
    <ProtectedLayout redirectTo="/">
      <div className="flex-1 flex flex-col min-h-screen  relative overflow-x-hidden">
              <div className="fixed inset-0 w-full h-screen -z-10">
                <Image
                  src="/images/nations.png"
                  alt="Nations background"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-white/40 md:bg-white/40"></div>
              </div>
        {children}
      </div>
    </ProtectedLayout>
  );
}
