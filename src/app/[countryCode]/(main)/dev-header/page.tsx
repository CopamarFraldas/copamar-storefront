import { Metadata } from "next"
import HeaderPreviews from "@modules/layout/components/header-previews"

// página interna pra comparar protótipos de header — NOINDEX sempre.
export const metadata: Metadata = {
  title: "Protótipos de header",
  robots: { index: false, follow: false },
}

export default function DevHeaderPage() {
  return <HeaderPreviews />
}
