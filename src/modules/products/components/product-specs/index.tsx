import { HttpTypes } from "@medusajs/types"
import { extrairSpecs } from "@lib/util/specs"

/**
 * Tabela "Especificações" da PDP (GEO/AEO #54, 06/06): specs FACTUAIS
 * derivadas do catálogo (tamanho, quantidade, marca, peso, EAN) em markup
 * de tabela — IAs e o Google extraem dados estruturados de tabela com muito
 * mais precisão que de prosa. Espelha o additionalProperty do Product JSON-LD.
 */
const ProductSpecs = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const specs = extrairSpecs(product)
  if (specs.length < 2) return null

  return (
    <div className="flex flex-col gap-y-2">
      <span className="text-sm font-medium text-ui-fg-base">Especificações</span>
      <table className="w-full text-sm">
        <tbody>
          {specs.map((s) => (
            <tr key={s.name} className="border-b border-ui-border-base last:border-b-0">
              <th
                scope="row"
                className="py-1.5 pr-3 text-left font-normal text-ui-fg-subtle whitespace-nowrap align-top"
              >
                {s.name}
              </th>
              <td className="py-1.5 text-ui-fg-base">{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductSpecs
