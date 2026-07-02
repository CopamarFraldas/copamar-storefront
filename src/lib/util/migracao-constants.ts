/** Sentinelas do fluxo de migração/redefinição (fora do "use server" — arquivos
 *  use server só podem exportar funções async). */
export const LOGIN_MIGRADO = "__CONTA_MIGRADA__"
export const SENHA_REDEFINIDA = "__SENHA_OK__"
export const TOKEN_EXPIRADO = "__TOKEN_EXPIRADO__"
/** Sign-up com CPF/CNPJ que já tem cadastro (importado do site antigo) →
 *  bloqueia a criação de conta nova; a UI orienta a fazer login. */
export const CPF_JA_CADASTRADO = "__CPF_EXISTE__"
/** Sign-up com e-mail que já tem conta → a UI orienta a fazer login (em vez do
 *  erro técnico do Medusa "identity already exists"). */
export const EMAIL_JA_CADASTRADO = "__EMAIL_EXISTE__"
