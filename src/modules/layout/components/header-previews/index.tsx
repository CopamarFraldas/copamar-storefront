"use client"

/**
 * Protótipos de header de DESKTOP pra escolher (página /dev-header, NOINDEX).
 * Mockups visuais — elementos estáticos, sem fetch/estado — só pra comparar
 * layouts. A escolha vira o Nav real depois.
 */
const CHIPS = [
  "Fraldas Geriátricas",
  "Roupa Íntima (Pants)",
  "Higiene",
  "Absorvente Geriátrico",
  "Absorvente Feminino",
  "Absorvente Masculino",
  "Fralda Infantil",
  "Protetores de Cama",
]

const Logo = ({ h = 40 }: { h?: number }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/logo.png" alt="Copamar" style={{ height: h, width: "auto" }} className="shrink-0" />
)
const IUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
)
const IBag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)
const IMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
)
const IGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

// busca mock (visual) — largura controlada pelo pai
const Busca = ({ className = "" }: { className?: string }) => (
  <div className={`relative flex items-center ${className}`}>
    <span className="pointer-events-none absolute left-3 text-ui-fg-subtle">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
    </span>
    <div className="h-10 w-full rounded-full border border-ui-border-base bg-ui-bg-subtle pl-10 pr-20 text-sm leading-10 text-ui-fg-subtle">
      Buscar fralda, marca ou tamanho…
    </div>
    <span className="absolute right-1.5 flex h-7 items-center rounded-full bg-copamar-primary px-3 text-xs font-semibold text-white">Buscar</span>
  </div>
)

const CatBtn = () => (
  <button className="inline-flex shrink-0 items-center gap-x-1.5 rounded-full bg-copamar-primary px-3.5 py-2 text-sm font-semibold text-white">
    <IGrid /> Categorias <span className="text-xs">▾</span>
  </button>
)
const Links = () => (
  <>
    <span className="hidden lg:inline text-ui-fg-subtle">Blog</span>
    <span className="hidden lg:inline text-ui-fg-subtle">Quem somos</span>
  </>
)
const Acoes = ({ links = true }: { links?: boolean }) => (
  <div className="flex shrink-0 items-center gap-x-4 text-ui-fg-subtle">
    {links && <Links />}
    <span className="flex items-center gap-x-1.5"><IUser /> Entrar</span>
    <span>🌙</span>
    <span className="flex items-center gap-x-1.5"><IBag /> <span className="hidden lg:inline">Carrinho</span> (0)</span>
  </div>
)
const ChipsBar = ({ wrap = false }: { wrap?: boolean }) => (
  <div className={`flex gap-2 ${wrap ? "flex-wrap" : "overflow-x-auto"}`}>
    <span className="whitespace-nowrap rounded-full border border-copamar-primary bg-copamar-primary/10 px-3 py-1 text-sm font-semibold text-copamar-primary">🏢 Atacado / CNPJ</span>
    {CHIPS.map((c) => (
      <span key={c} className="whitespace-nowrap rounded-full border border-ui-border-base bg-ui-bg-subtle px-3 py-1 text-sm text-ui-fg-base">{c}</span>
    ))}
  </div>
)

const Frame = ({ titulo, desc, children }: { titulo: string; desc: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <div className="mb-2">
      <h2 className="text-lg font-bold text-copamar-primary dark:text-ui-fg-base">{titulo}</h2>
      <p className="text-sm text-ui-fg-subtle">{desc}</p>
    </div>
    <div className="overflow-hidden rounded-xl border-2 border-ui-border-base shadow-sm">{children}</div>
  </div>
)

// ───────────── VARIAÇÕES ─────────────
// A — Amazon: logo canto, busca larga central, ações; barra de categorias EMBAIXO
const VarA = () => (
  <div className="bg-ui-bg-base">
    <div className="content-container flex items-center gap-x-5 py-3">
      <Logo />
      <Busca className="flex-1" />
      <Acoes />
    </div>
    <div className="border-t border-ui-border-base bg-ui-bg-subtle/60">
      <div className="content-container flex items-center gap-x-3 py-2 text-sm">
        <button className="inline-flex shrink-0 items-center gap-x-1.5 font-semibold text-copamar-primary"><IMenu /> Todas as categorias</button>
        <span className="text-ui-border-base">|</span>
        <ChipsBar />
      </div>
    </div>
  </div>
)
// B — Logo central: categorias esq, logo centro, ações dir; busca full 2ª linha; chips 3ª
const VarB = () => (
  <div className="bg-ui-bg-base">
    <div className="content-container flex items-center justify-between py-3">
      <CatBtn />
      <Logo h={44} />
      <Acoes links={false} />
    </div>
    <div className="content-container pb-3"><Busca /></div>
    <div className="border-t border-ui-border-base">
      <div className="content-container py-2"><ChipsBar wrap /></div>
    </div>
  </div>
)
// C — Mercado Livre: logo esq, busca MUITO larga dominando, ações; chips 2ª linha
const VarC = () => (
  <div className="bg-ui-bg-base">
    <div className="content-container flex items-center gap-x-6 py-3">
      <Logo h={36} />
      <Busca className="flex-1" />
      <Acoes links={false} />
    </div>
    <div className="border-t border-ui-border-base bg-ui-bg-subtle/60">
      <div className="content-container py-2"><ChipsBar /></div>
    </div>
  </div>
)
// D — Atual: categorias+logo+busca esq, ações dir; chips embaixo (wrap)
const VarD = () => (
  <div className="bg-ui-bg-base">
    <div className="content-container flex items-center justify-between gap-x-3 py-3">
      <div className="flex flex-1 items-center gap-x-4">
        <CatBtn />
        <Logo />
        <Busca className="max-w-xl flex-1" />
      </div>
      <Acoes />
    </div>
    <div className="border-t border-ui-border-base">
      <div className="content-container py-2"><ChipsBar wrap /></div>
    </div>
  </div>
)

// E — HÍBRIDA recomendada: logo central (de B) + busca full-width própria (de B,
// = espelho do mobile) + BARRA de categorias estilo Amazon (de A). Junta as duas
// direções que o dono citou. Navegação concentrada na barra (uma porta só).
const VarE = () => (
  <div className="bg-ui-bg-base">
    <div className="content-container flex items-center justify-between py-3">
      <div className="flex items-center gap-x-5 text-base text-ui-fg-subtle">
        <span>Blog</span>
        <span>Quem somos</span>
      </div>
      <Logo h={46} />
      <div className="flex items-center gap-x-5 text-base text-ui-fg-base">
        <span className="flex items-center gap-x-1.5"><IUser /> Entrar</span>
        <span>🌙</span>
        <span className="flex items-center gap-x-1.5"><IBag /> Carrinho (0)</span>
      </div>
    </div>
    <div className="content-container pb-3"><Busca /></div>
    <div className="border-t border-ui-border-base bg-ui-bg-subtle/60">
      <div className="content-container flex items-center gap-x-3 py-2.5">
        <button className="inline-flex shrink-0 items-center gap-x-2 rounded-full bg-copamar-primary px-4 py-2 text-sm font-semibold text-white">
          <IMenu /> Todas as categorias
        </button>
        <div className="flex gap-2 overflow-x-auto">
          {["🏢 Atacado / CNPJ", ...CHIPS].map((c, i) => (
            <span key={c} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm ${i === 0 ? "border-copamar-primary bg-copamar-primary/10 font-semibold text-copamar-primary" : "border-ui-border-base bg-ui-bg-base text-ui-fg-base"}`}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const HeaderPreviews = () => (
  <div className="content-container py-10">
    <h1 className="mb-1 text-2xl font-bold text-ui-fg-base">Protótipos de header (desktop)</h1>
    <p className="mb-8 text-sm text-ui-fg-subtle">Compare e me diga qual gostou (ou mistura de duas). É só mockup, NOINDEX.</p>
    <Frame titulo="★ E · RECOMENDADA — logo central + barra de categorias (Amazon)" desc="Junta as duas que você citou: linha 1 = links · LOGO central · conta/carrinho · linha 2 = BUSCA full-width (igual ao mobile) · linha 3 = barra com 'Todas as categorias' + chips. A busca ganha a linha inteira (resolve o aperto do atual).">
      <VarE />
    </Frame>
    <Frame titulo="A · Amazon" desc="Logo no canto esquerdo · busca larga no centro · ações à direita. Categorias numa BARRA EMBAIXO (com 'Todas as categorias').">
      <VarA />
    </Frame>
    <Frame titulo="B · Logo central" desc="Categorias à esquerda · LOGO no centro · ações à direita. Busca full-width na 2ª linha + chips na 3ª.">
      <VarB />
    </Frame>
    <Frame titulo="C · Mercado Livre" desc="Logo no canto · busca BEM larga dominando a linha · ações à direita. Chips numa faixa embaixo.">
      <VarC />
    </Frame>
    <Frame titulo="D · Atual (hoje no ar)" desc="Categorias + logo + busca à esquerda · ações à direita. Chips embaixo.">
      <VarD />
    </Frame>
  </div>
)

export default HeaderPreviews
