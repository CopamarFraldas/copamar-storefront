import { getNavCategories } from "@lib/data/nav-categories"
import MegaMenuClient from "./mega-menu-client"

/**
 * Server Component: busca categorias + contagens em runtime e delega
 * a renderização interativa ao client. Se a query falhar, o client recebe
 * [] e mostra um link simples "Categorias" pra /store (fallback sem quebrar).
 */
export default async function MegaMenu() {
  const cats = await getNavCategories()
  return <MegaMenuClient categories={cats} />
}
