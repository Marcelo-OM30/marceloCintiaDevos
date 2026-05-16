# Template: Devocional + Story do Versículo do Dia

Use este template ao gerar o conteúdo para `useCreateDevotional` e o `cardStore`.

---

## Template do Devocional (salvo no Supabase)

```
TÍTULO: {{titulo}}

{{abertura}}

{{reflexao_reformada}}

{{aplicacao_pratica}}

Oração: {{oracao}}
```

### Exemplo preenchido — Salmos 23:1

```
TÍTULO: A Soberania do Bom Pastor

O Salmo 23 é um dos textos mais amados da Escritura. Davi, ele próprio pastor, 
contempla Deus como seu Pastor soberano — aquele que governa, provê e guia.

"O Senhor é o meu pastor" não é uma afirmação sentimental, mas uma declaração 
teológica profunda: Deus, em sua soberania absoluta, escolheu pastorear o seu 
povo. Não por mérito de Davi, mas por pura graça. O Pastor que Davi conhecia 
apontava para Cristo — o Bom Pastor que dá a vida pelas ovelhas (Jo 10:11) e 
que busca ativamente aquelas que o Pai lhe deu. Nada nos falta porque nada 
escapa ao governo providencial de Deus.

Hoje, descanse na certeza de que você não está à deriva. Seu Pastor conhece 
cada detalhe da sua vida e governa soberanamente cada circunstância para o 
seu bem e para a sua glória.

Oração: Senhor soberano, obrigado por seres meu Pastor. Que eu confie na Tua 
providência mesmo quando o caminho é incerto. Toda a glória seja somente a Ti. 
Amém.
```

---

## Template do Story (configuração do cardStore)

### Layout Story 9:16 — 3 blocos de texto

```
┌─────────────────────────┐
│                         │
│   [BLOCO 1 — topo]      │  ← Referência bíblica
│   Salmos 23:1           │     fontSize: 16, positionY: 0.08
│                         │
│                         │
│   [BLOCO 2 — centro]    │  ← Texto do versículo
│   "O Senhor é o meu     │     fontSize: 22, bold: true
│    pastor; nada me      │     positionY: 0.35
│    faltará."            │
│                         │
│   [BLOCO 3 — inferior]  │  ← Primeira frase do devocional
│   "Deus, em sua         │     fontSize: 14, italic: true
│    soberania..."        │     positionY: 0.72
│                         │
│   [LOGO — rodapé]       │  ← showLogo: true
└─────────────────────────┘
```

### Configuração TypeScript equivalente

```tsx
import { useCardStore } from '@/stores/cardStore';

function configurarStoryVersiculoDia(verse: VerseOfDay, primeiraFraseDevocional: string) {
  const store = useCardStore.getState();
  
  store.reset();
  store.setFormat('story');
  
  // Gradiente escuro — elegante e legível
  store.setBackground({
    type: 'gradient',
    color: '#0f0f23',
    gradientColors: ['#0f0f23', '#1a1a3e'],
  });
  
  store.setOverlay(0.2);
  store.setShowLogo(true);

  const livro = verse.bible_chapters.bible_books.name;
  const cap   = verse.bible_chapters.chapter_number;
  const ver   = verse.verse_number;

  // Bloco 1: Referência
  store.addTextBlock(`${livro} ${cap}:${ver}`);
  // Ajustar após: updateTextBlock(id, { fontSize: 16, positionY: 0.08, color: '#a0a0c0' })

  // Bloco 2: Texto do versículo
  store.addTextBlock(`"${verse.text}"`);
  // Ajustar após: updateTextBlock(id, { fontSize: 22, bold: true, positionY: 0.35 })

  // Bloco 3: Trecho do devocional
  store.addTextBlock(primeiraFraseDevocional);
  // Ajustar após: updateTextBlock(id, { fontSize: 14, italic: true, positionY: 0.72, color: '#d0d0e8' })
}
```

---

## Paletas de cores sugeridas para stories

| Tema | gradientColors | Uso |
|------|---------------|-----|
| Noite profunda (padrão) | `['#0f0f23', '#1a1a3e']` | Versículos sobre soberania, misericórdia |
| Aurora | `['#1a0533', '#4a1060']` | Versículos sobre esperança, salvação |
| Floresta | `['#0d2818', '#1a4a2e']` | Versículos sobre provisão, natureza, Salmos |
| Âmbar | `['#2d1b00', '#5a3800']` | Versículos sobre sabedoria, Provérbios |
| Cinza pedra | `['#1a1a1a', '#2d2d2d']` | Versículos de lamento, arrependimento |

---

## Tags padrão do devocional gerado

```ts
tags: ['versiculo-do-dia', 'reformado', 'calvinista', 'devocional-diario']
```

---

## Verificação de duplicatas (evitar gerar 2x no mesmo dia)

```tsx
// Antes de gerar, verificar se já existe devocional do dia
const hoje = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

const { data: existente } = await supabase
  .from('devotionals')
  .select('id')
  .eq('user_id', userId)
  .contains('devotional_tags', [{ tag: 'versiculo-do-dia' }])
  .gte('created_at', `${hoje}T00:00:00`)
  .lte('created_at', `${hoje}T23:59:59`)
  .maybeSingle();

if (existente) {
  // Já gerado hoje — mostrar o existente em vez de criar novo
  router.push(`/(tabs)/devotionals/${existente.id}`);
  return;
}
```
