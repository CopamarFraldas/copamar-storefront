"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

/**
 * Barra de busca — a maior lacuna do mobile (Amazon/ML abrem com busca dominante
 * no topo). O cuidador geralmente JÁ SABE o que quer ("Tena Slip G") e prefere
 * digitar a navegar 8 categorias. Submete pra /<cc>/search?q=… (a store API do
 * Medusa suporta ?q nativamente).
 */
const SearchBar = ({ className = "" }: { className?: string }) => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const cc = (params?.countryCode as string) || "br"
  const [q, setQ] = useState(searchParams?.get("q") ?? "")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const termo = q.trim()
    if (!termo) return
    router.push(`/${cc}/search?q=${encodeURIComponent(termo)}`)
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={`relative flex w-full items-center ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 text-ui-fg-subtle"
      >
        {/* lupa */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <label htmlFor="site-search" className="sr-only">
        Buscar produtos
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar fralda, marca ou tamanho…"
        autoComplete="off"
        className="h-10 w-full rounded-full border border-ui-border-base bg-ui-bg-subtle pl-10 pr-20 text-sm text-ui-fg-base outline-none transition focus:border-copamar-primary focus:bg-ui-bg-base focus:ring-1 focus:ring-copamar-primary"
      />
      <button
        type="submit"
        className="absolute right-1.5 h-7 rounded-full bg-copamar-primary px-3 text-xs font-semibold text-white transition hover:bg-copamar-primary-dark"
      >
        Buscar
      </button>
    </form>
  )
}

export default SearchBar
