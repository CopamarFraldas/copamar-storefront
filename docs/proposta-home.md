# 🏠 PROPOSTA — Estrutura de Home moderna (pra Marco aprovar)

> ⚠️ **PROPOSTA, não implementada.** O design da home é **decisão de gosto sua** —
> deixei pronto pra você aprovar/ajustar. Nada aqui foi aplicado (além dos ajustes
> de copy/SEO/confiança que já entraram no hero atual: keyword no H1, "Direto da
> Fábrica", avaliações 4,6/143). Quando aprovar, eu construo.

## Princípio
Loja de fralda geriátrica converte com **confiança + clareza de preço + facilidade
de achar o produto certo**. 74% é mobile → **acima da dobra tem que vender em 1
tela**: quem somos, por que confiar, e um caminho rápido pro produto.

## Estrutura sugerida (de cima pra baixo)

**0. Barra de aviso (topo, fina, dispensável)** — onde entram PROMOÇÕES sem poluir:
   ex.: "🚚 Frete grátis na Grande SP · 5% no PIX" ou "🔥 Ofertas da semana →".
   Fundo da cor de destaque, 1 linha, fechável. É o lugar certo de promo (não o hero).

**1. Hero focado (já ajustado)** — H1 "Fraldas geriátricas direto da fábrica" +
   slogan + **selo "Direto da Fábrica · Atacado"** + **★ 4,6 · 143 no Google** + CTA.
   Manter enxuto (1 imagem, 1 CTA). *Já está assim hoje.*

**2. Faixa de confiança (3-4 selos)** — sóbrio, ícone + texto curto:
   🏭 Direto da fábrica · 📦 Entrega Brasil todo · 💳 3x sem juros / 5% PIX · 🛡️ 20 anos.

**3. "Mais vendidos"** — carrossel/grade dos campeões (usa o campo `destaque` do
   catálogo que já existe). É o atalho que mais converte.

**4. "Direto da Fábrica" / por marca** — seção curada das marcas próprias/principais
   (reforça o diferencial nº1 de busca). Cards com selo "Fábrica".

**5. Navegar por categoria** — grade visual (Geriátrica, Infantil, Absorventes,
   Higiene…) com foto. Já existe um `CategoriesSection` — dá pra evoluir.

**6. Prova social** — bloco "Por que confiam na Copamar": ★ 4,6/143, 20 anos,
   atacado pra profissionais. (Sem inventar depoimento — só o real.)

**7. Atacado / B2B** — faixa "É revenda ou profissional? Condições especiais" → CTA
   WhatsApp. Captura o público atacadista (que é o forte da Copamar).

**8. FAQ** (quando aprovar o rascunho de FAQ) — tira objeção (tamanho, frete) + GEO.

## Onde entram PROMOÇÕES (3 níveis, sem redesenhar tudo)
- **Barra de aviso no topo** (item 0) — campanha ativa.
- **Selo no card do produto** — ex.: "−10%" / "Oferta" (badge no `product-preview`).
- **Página `/ofertas`** — coleção curada "Ofertas" (Medusa collection) + link no menu/barra.
   Reaproveita o template de listagem que já existe; é só uma coleção + a rota.

## Por que assim (justificativa)
- **Mobile-first:** hero curto + faixa de confiança cabem em 1 tela.
- **Confiança real primeiro:** avaliação do Google + "20 anos" + "direto da fábrica"
  são os gatilhos de um produto de cuidado/saúde (sem claim médico).
- **Atalhos de conversão:** "Mais vendidos" e "por categoria" tiram o atrito de achar.
- **Promo desacoplada:** barra + selo + /ofertas dão flexibilidade sem refazer a home
  a cada campanha.
- **Reaproveita o que existe:** `destaque`, `CategoriesSection`, template de coleção,
  badge no card — pouco código novo.

## O que eu NÃO fiz (de propósito)
Não refiz o layout/design (cores, espaçamento, imagens, ordem final) — isso é sua
escolha. Me diz quais seções topa e em que ordem, e eu construo seção por seção.
