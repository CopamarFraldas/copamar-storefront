/**
 * Erros conhecidos do backend → mensagem amigável em PT-BR (#46): o texto cru
 * do Medusa ("Some variant does not have the required inventory") chegava em
 * inglês direto pro cliente no carrinho/checkout.
 */
function traduzir(message: string): string | null {
  const m = message.toLowerCase()
  if (m.includes("required inventory") || m.includes("insufficient_inventory") || m.includes("insufficient inventory")) {
    return "Quantidade indisponível no estoque — outro cliente pode ter comprado agora há pouco. Diminua a quantidade ou atualize a página."
  }
  return null
}

export default function medusaError(error: any): never {
  // erros do fetch SDK (sem .response) também carregam a message do backend
  const direta = typeof error?.message === "string" ? traduzir(error.message) : null
  if (direta) {
    throw new Error(direta)
  }

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    // Extracting the error message from the response data
    const message = error.response.data.message || error.response.data

    const amigavel = typeof message === "string" ? traduzir(message) : null
    if (amigavel) {
      throw new Error(amigavel)
    }

    throw new Error(message.charAt(0).toUpperCase() + message.slice(1) + ".")
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error("No response received: " + error.request)
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error("Error setting up the request: " + error.message)
  }
}
