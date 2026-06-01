"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Busca com AUTOCOMPLETE (sugestões enquanto digita) — padrão Amazon/ML. O
 * cuidador que já sabe o que quer ("Tena Slip G") vê os produtos na hora, com
 * foto e preço, e chega ao item em 1 toque. Acessível (combobox/listbox +
 * teclado), debounce pra não martelar a API, fecha ao clicar fora.
 *
 * Fonte das sugestões: /api/search-suggest (route handler no próprio storefront
 * → store API ?q nativo, sem endpoint novo no backend). Submeter (Enter sem item
 * selecionado / botão) leva à página de resultados /search?q=.
 */
type Sugestao = {
  handle: string
  title: string
  thumbnail: string | null
  preco: { amount: number; currency: string } | null
}

const brl = (amount: number, currency: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: (currency || "brl").toUpperCase(),
  }).format(amount)

const SearchBar = ({ className = "" }: { className?: string }) => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const cc = (params?.countryCode as string) || "br"
  const inputId = useId()
  const listId = useId()

  const [q, setQ] = useState(searchParams?.get("q") ?? "")
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1) // item destacado pelo teclado

  const boxRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqRef = useRef(0) // descarta respostas fora de ordem (race)

  const irParaBusca = (termo: string) => {
    const t = termo.trim()
    if (!t) return
    setOpen(false)
    router.push(`/${cc}/search?q=${encodeURIComponent(t)}`)
  }

  // busca sugestões com debounce; ignora respostas obsoletas
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const termo = q.trim()
    if (termo.length < 2) {
      setSugestoes([])
      setTotal(0)
      setLoading(false)
      return
    }
    setLoading(true)
    const id = ++reqRef.current
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/search-suggest?q=${encodeURIComponent(termo)}&cc=${cc}`
        )
        const d = await r.json()
        if (id !== reqRef.current) return // chegou velha → descarta
        setSugestoes(d.produtos || [])
        setTotal(d.count || 0)
        setActive(-1)
      } catch {
        if (id === reqRef.current) {
          setSugestoes([])
          setTotal(0)
        }
      } finally {
        if (id === reqRef.current) setLoading(false)
      }
    }, 220)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q, cc])

  // fecha ao clicar fora
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false)
      return
    }
    if (!open || sugestoes.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (i + 1) % sugestoes.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (i <= 0 ? sugestoes.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      if (active >= 0 && active < sugestoes.length) {
        e.preventDefault()
        setOpen(false)
        router.push(`/${cc}/products/${sugestoes[active].handle}`)
      }
    }
  }

  const mostrarDropdown = open && q.trim().length >= 2

  return (
    <div ref={boxRef} className={`relative w-full ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          irParaBusca(q)
        }}
        className="relative flex w-full items-center"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 text-ui-fg-subtle"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <label htmlFor={inputId} className="sr-only">
          Buscar produtos
        </label>
        <input
          id={inputId}
          name="q"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={mostrarDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `${listId}-opt-${active}` : undefined
          }
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar fralda, marca ou tamanho…"
          className="h-10 w-full rounded-full border border-ui-border-base bg-ui-bg-subtle pl-10 pr-20 text-sm text-ui-fg-base outline-none transition focus:border-copamar-primary focus:bg-ui-bg-base focus:ring-1 focus:ring-copamar-primary"
        />
        <button
          type="submit"
          className="absolute right-1.5 h-7 rounded-full bg-copamar-primary px-3 text-xs font-semibold text-white transition hover:bg-copamar-primary-dark"
        >
          Buscar
        </button>
      </form>

      {mostrarDropdown && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-base shadow-xl"
        >
          {loading && sugestoes.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ui-fg-subtle">Buscando…</p>
          ) : sugestoes.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ui-fg-subtle">
              Nada encontrado pra “{q.trim()}”. Toque em Buscar pra ver o catálogo.
            </p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto py-1">
              {sugestoes.map((s, i) => (
                <li key={s.handle} id={`${listId}-opt-${i}`} role="option" aria-selected={i === active}>
                  <LocalizedClientLink
                    href={`/products/${s.handle}`}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 px-3 py-2 ${
                      i === active ? "bg-copamar-primary/10" : "hover:bg-ui-bg-subtle"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                      {s.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.thumbnail}
                          alt=""
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-lg" aria-hidden>🧷</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ui-fg-base">
                        {s.title}
                      </span>
                      {s.preco && (
                        <span className="block text-xs font-semibold text-copamar-primary">
                          {brl(s.preco.amount, s.preco.currency)}
                        </span>
                      )}
                    </span>
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          )}

          {sugestoes.length > 0 && (
            <button
              type="button"
              onClick={() => irParaBusca(q)}
              className="block w-full border-t border-ui-border-base bg-ui-bg-subtle px-4 py-2.5 text-left text-sm font-semibold text-copamar-primary hover:bg-copamar-primary/10"
            >
              Ver todos os resultados de “{q.trim()}”
              {total > sugestoes.length ? ` (${total})` : ""} →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
