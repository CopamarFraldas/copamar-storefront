import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[]; revalidate?: number } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  // Tag BASE global (#46 anti-oversell): a sync de estoque do Bling invalida
  // via /api/revalidate?tags=products — sem a tag base, as entradas só teriam
  // a tag por-visitante (products-<cacheId>) e o site mostraria estoque velho.
  // Também cobre visitante SEM cookie (bots/Google), que antes gerava cache
  // sem tag nenhuma (= nunca invalidável).
  // SÓ dados PÚBLICOS levam a tag base (review 06/06): colar tag global em
  // carts/customers/orders seria footgun de invalidação cruzada de dados
  // por-usuário.
  const PUBLICAS = ["products", "regions", "collections", "categories"]
  const base = PUBLICAS.includes(tag) ? [tag] : []
  // teto de idade (review 06/06): com a tag base, o revalidateTag global
  // derruba TUDO de uma vez; o revalidate por tempo vira SWR — serve stale e
  // renova 1 por vez, amortecendo o pico no backend (thundering herd).
  const revalidate = tag === "products" ? 300 : 3600

  if (!cacheTag) {
    return base.length ? { tags: base, revalidate } : {}
  }

  return { tags: [`${cacheTag}`, ...base], revalidate }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}
