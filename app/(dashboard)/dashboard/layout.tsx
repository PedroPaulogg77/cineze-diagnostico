import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  )
}
