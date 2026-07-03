import { isEqual, pick } from "lodash"
import { telefoneDigits } from "@lib/util/telefone"

const CAMPOS = [
  "first_name",
  "last_name",
  "address_1",
  "company",
  "postal_code",
  "city",
  "country_code",
  "province",
  "phone",
]

// Compara o telefone pelos DÍGITOS (jul/26, redesign QDB): o form agora guarda
// o telefone MASCARADO "(11) 99859-0034" enquanto endereços salvos antigos têm
// só dígitos — sem normalizar, o AddressSelect deixava de marcar o endereço
// salvo como selecionado (e o mesmo endereço parecia "diferente" de si mesmo).
function normaliza(address: any) {
  const p: any = pick(address, CAMPOS)
  p.phone = telefoneDigits(String(p.phone ?? ""))
  return p
}

export default function compareAddresses(address1: any, address2: any) {
  return isEqual(normaliza(address1), normaliza(address2))
}
