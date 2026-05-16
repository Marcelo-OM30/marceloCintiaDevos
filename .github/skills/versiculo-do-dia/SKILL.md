---
name: versiculo-do-dia
description: >
  Gera o versículo do dia com devocional reformado/calvinista e stories para redes sociais.
  Use quando: implementar versículo do dia automático; gerar devocional diário com teologia reformada
  e calvinista; criar stories/cards para Instagram com versículo e reflexão; integrar geração
  automática de conteúdo espiritual diário; criar devotional vinculado ao verso do dia;
  exportar card story com versículo e devocional.
argument-hint: 'Ex: "Salmos 23:1" ou deixe vazio para usar o versículo de hoje'
---

# Skill: Versículo do Dia + Devocional Reformado + Story

## O que esta skill faz

1. Obtém o versículo do dia via `useVerseOfDay` (já implementado no projeto)
2. Gera um devocional breve (~150–200 palavras) com visão **reformada e calvinista**
3. Cria um **story** (card 9:16) com o versículo e trecho do devocional usando o `cardStore`
4. Salva o devocional no Supabase via `useCreateDevotional`
5. Oferece opções de exportar/compartilhar o story via `useCardExport`

---

## Quando usar

- Usuário quer "gerar o devocional do dia"
- Usuário quer "criar story do versículo de hoje"
- Implementar geração automática diária de conteúdo
- Qualquer pedido envolvendo versículo do dia + devocional + story/card

---

## Arquitetura do projeto relevante

| Hook/Store | Arquivo | Função |
|---|---|---|
| `useVerseOfDay(versionSlug?)` | `hooks/useVerseOfDay.ts` | Versículo determinístico por dia (mesmo para todos os usuários) |
| `useCreateDevotional()` | `hooks/useDevotionals.ts` | Salva devocional no Supabase |
| `cardStore` (Zustand) | `stores/cardStore.ts` | Estado do card: formato, background, blocos de texto |
| `useCardExport` | `hooks/useCardExport.ts` | Captura e compartilha o card como imagem |
| `CardPreview` | `components/cards/CardPreview.tsx` | Renderiza o card visualmente |
| `CardToolbar` | `components/cards/CardToolbar.tsx` | Toolbar de edição do card |

**Formato story**: `format: 'story'` no `cardStore` → proporção 9:16

---

## Procedimento de implementação

### Passo 1 – Obter versículo do dia

```tsx
const { data: verse, isLoading } = useVerseOfDay('arc');
// verse.text  → texto do versículo
// verse.bible_chapters.bible_books.name  → nome do livro
// verse.bible_chapters.chapter_number    → capítulo
// verse.verse_number                     → número do versículo
```

### Passo 2 – Gerar devocional (conteúdo)

Seguir as diretrizes em [./references/teologia-reformada.md](./references/teologia-reformada.md).

Estrutura do devocional gerado:
- **Título**: frase que capture a essência teológica do versículo (ex.: "A Soberania do Bom Pastor")
- **Abertura**: contextualização histórica ou literária do versículo (1–2 frases)
- **Reflexão reformada**: aplicação com ênfase em soberania de Deus, graça, glória divina (3–4 frases)
- **Aplicação prática**: como viver isso hoje (1–2 frases)
- **Oração**: oração breve em primeira pessoa (2–3 frases)

Usar o template em [./assets/devocional-template.md](./assets/devocional-template.md).

### Passo 3 – Salvar devocional

```tsx
const { mutateAsync: create } = useCreateDevotional();
await create({
  title: tituloGerado,
  content: conteudoGerado,
  is_public: false,
  tags: ['versiculo-do-dia', 'reformado', 'calvinista'],
  verse_ids: [verse.id],
});
```

### Passo 4 – Configurar story no cardStore

```tsx
const { setFormat, setBackground, addTextBlock, reset } = useCardStore();

reset();
setFormat('story'); // 9:16

// Background escuro com gradiente elegante
setBackground({
  type: 'gradient',
  color: '#1a1a2e',
  gradientColors: ['#1a1a2e', '#16213e'],
});

// Bloco 1: Referência do versículo (topo)
addTextBlock(`${livro} ${capitulo}:${versiculo}`);

// Bloco 2: Texto do versículo (centro)
addTextBlock(verse.text);

// Bloco 3: Trecho do devocional (inferior)
addTextBlock(primeiraFraseDevocional);
```

### Passo 5 – Exportar / Compartilhar

```tsx
const { viewShotRef, saveToGallery, shareCard } = useCardExport();
// Renderizar <CardPreview ref={viewShotRef} />
// Chamar shareCard() ou saveToGallery()
```

---

## Tela sugerida: `app/(tabs)/devotionals/versiculo-do-dia.tsx`

Criar uma nova tela que:
1. Mostra o versículo do dia ao abrir
2. Exibe botão "Gerar Devocional + Story"
3. Mostra o story gerado com preview usando `CardPreview`
4. Permite compartilhar diretamente

Adicionar no `app/(tabs)/devotionals/_layout.tsx` ou como tab separada.

---

## Checklist de implementação

- [ ] Tela `versiculo-do-dia.tsx` criada em `app/(tabs)/devotionals/`
- [ ] Devocional gerado segue teologia reformada (ver referência)
- [ ] Story no formato 9:16 com gradiente escuro e texto branco
- [ ] Devocional salvo no Supabase com tag `versiculo-do-dia`
- [ ] Opção de compartilhar story diretamente do app
- [ ] Verificar se já existe devocional gerado para hoje (evitar duplicatas)
