import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SilkPay - Payout Platform",
  description: "Enterprise grade payout management platform",
  icons: {
    icon: "/icon.svg",
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased flex")}>
        <AppShell>
            {children}
        </AppShell>
        <Toaster 
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-[#1F212D] text-white border border-white/5 shadow-2xl",
              description: "!text-[#8F95B2]",
              actionButton: "!bg-[#6C5DD3] text-white hover:!bg-[#6C5DD3]/90",
              cancelButton: "!bg-[#2C303B] text-white",
              success: "!border-b-green-500/80",
              error: "!border-b-red-500/80",
              warning: "!border-b-yellow-500/80",
              info: "!border-b-blue-500/80",
            }
          }}
        />
      </body>
    </html>
  );
}
