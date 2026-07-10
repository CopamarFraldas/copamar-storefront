"use client"

/**
 * Comparador de produtos — estado CLIENT-SIDE compartilhado entre os checkboxes
 * dos cards (⚖ Comparar) e a barra fixa de baixo. Fonte da verdade =
 * localStorage (sobrevive a navegação/reload); a sincronia entre componentes é
 * por CustomEvent na window (mesma aba) + evento "storage" (outras abas).
 * Sem Context de propósito: os cards são server components e o grid re-renderiza
 * por página — um provider obrigaria a clientizar a árvore toda.
 */

export type CompararItem = {
  handle: string
  title: string
  /** miniatura pra barra fixa; null = sem foto (placeholder) */
  thumbnail: string | null
}

export const MAX_COMPARAR = 3

const KEY = "copamar:comparar"
const EVT = "copamar:comparar-changed"

export function lerComparar(): CompararItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    if (!Array.isArray(arr)) return []
    return arr
      .filter(
        (i): i is CompararItem =>
          !!i && typeof i.handle === "string" && typeof i.title === "string"
      )
      .slice(0, MAX_COMPARAR)
  } catch {
    return []
  }
}

function salvar(itens: CompararItem[]) {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(itens.slice(0, MAX_COMPARAR))
    )
  } catch {
    // storage cheio/bloqueado (Safari privado antigo) — segue sem persistir
  }
  window.dispatchEvent(new Event(EVT))
}

/** Marca/desmarca um produto. Devolve false quando NÃO coube (já tem 3). */
export function toggleComparar(item: CompararItem): boolean {
  const atual = lerComparar()
  if (atual.some((i) => i.handle === item.handle)) {
    salvar(atual.filter((i) => i.handle !== item.handle))
    return true
  }
  if (atual.length >= MAX_COMPARAR) return false
  salvar([...atual, item])
  return true
}

export function removerComparar(handle: string) {
  salvar(lerComparar().filter((i) => i.handle !== handle))
}

export function limparComparar() {
  salvar([])
}

/** Assina mudanças (mesma aba + outras abas). Devolve o unsubscribe. */
export function subscribeComparar(cb: () => void): () => void {
  window.addEventListener(EVT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVT, cb)
    window.removeEventListener("storage", cb)
  }
}
