# 📝 RASCUNHO — FAQ do site (revisão Marco/pai antes de publicar)

> ⚠️ **RASCUNHO. NÃO PUBLICADO.** Conteúdo para revisão. **YMYL/saúde:** nenhuma
> pergunta abaixo faz claim médico, de absorção específica, ou estatística — são
> só **tamanho** e **logística** (seguras). Qualquer pergunta sobre indicação de
> uso, troca, pele, saúde do idoso etc. precisa de revisão de quem entende
> (Marco/pai) antes de entrar. Quando aprovado, vira `FAQPage` (JSON-LD) via o
> helper `faqPageSchema()` já pronto + a UI de acordeão.

## Estrutura proposta
- Página `/faq` (ou seção na home/produto) com acordeão (1 `<h1>`, perguntas em `<h2>`/`<summary>`).
- JSON-LD `FAQPage` (já existe `faqPageSchema()` em `structured-data`) — grande lever de GEO/AEO (aparece em IA e nos rich results do Google).
- Linkar do rodapé e do menu.

## Perguntas SEGURAS (rascunho — confirmar respostas)

**1. Como escolho o tamanho certo da fralda geriátrica?**
O tamanho costuma ser definido pela **medida da cintura/quadril** da pessoa — cada
marca traz a tabela de medidas (P, M, G, EG/XG) na embalagem. Na dúvida entre dois
tamanhos, fale com a gente no WhatsApp que ajudamos a escolher.
*(revisar: confirmar se querem citar faixa de cm por tamanho — depende da marca)*

**2. Qual a diferença entre fralda e roupa íntima descartável (pants)?**
A **fralda** abre nas laterais (fita adesiva) e é prática para quem está acamado ou
precisa de troca deitado. A **roupa íntima / pants** veste como uma cueca/calcinha
e é indicada para quem ainda tem mobilidade e prefere mais autonomia.
*(factual, sem claim de saúde — ok)*

**3. Vocês entregam para todo o Brasil? Qual o prazo?**
Sim, entregamos para **todo o Brasil**. Em parte da Grande São Paulo a entrega é
pela **nossa própria frota** (muitas vezes grátis), e para o restante usamos
transportadora com cálculo de frete e prazo por CEP no checkout.
*(confirmar prazos antes de publicar)*

**4. Quais as formas de pagamento e parcelamento?**
Aceitamos **PIX** (aprovação na hora) e **cartão de crédito** com **3x sem juros**.
À vista (PIX) há **5% de desconto**.
*(confirmar política atual — bate com o checkout)*

**5. Compro no atacado / para revenda?**
Sim — a Copamar é **distribuidora atacadista** desde 2006. Para pedidos em
quantidade (empresa/CNPJ), fale com a gente que passamos condições especiais.
*(confirmar — bate com o modelo B2B/CNPJ do checkout)*

---
### ❌ NÃO incluir sem revisão (YMYL/saúde):
- "Quantas horas a fralda X segura?" / capacidade de absorção específica.
- Qualquer indicação por condição médica (incontinência, pós-cirúrgico, etc.).
- "Qual a melhor fralda para…" com recomendação de saúde.
- Estatísticas ("90% dos clientes…") sem fonte real.
