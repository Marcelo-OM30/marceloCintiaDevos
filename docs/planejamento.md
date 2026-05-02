# Planejamento — App de Devocionais (MarceloCintia Devos)

> Documento de planejamento técnico e de produto.  
> Data de início: Maio de 2026

---

## 1. Visão Geral do Produto

Aplicativo de devocionais cristãos com foco na tradição evangélica reformada.  
Permite que usuários leiam a Bíblia, escrevam devocionais pessoais, criem cards visuais e compartilhem nas redes sociais.

---

## 2. Funcionalidades Principais

### 2.1 Autenticação
- Cadastro com e-mail/senha
- Login
- Recuperação de senha
- Perfil do usuário (foto, nome, bio)

### 2.2 Bíblia Sagrada
- Versões disponíveis (todas da tradição evangélica reformada):
  | Sigla | Nome Completo |
  |-------|--------------|
  | ARC   | Almeida Revista e Corrigida |
  | ARA   | Almeida Revista e Atualizada |
  | NVI   | Nova Versão Internacional |
  | ACF   | Almeida Corrigida e Fiel |
- Navegação por livro → capítulo → versículo
- Pesquisa full-text (palavra, frase, referência)
- Destaque e anotação de versículos
- Bookmarks / versículos favoritos
- Copiar versículo com formatação

### 2.3 Devocionais
- Editor de texto rico (título, corpo, data)
- Vincular versículos da Bíblia ao devocional
- Tags / categorias
- Devocional público ou privado
- Histórico e calendário de devocionais

### 2.4 Stories & Cards para Redes Sociais
- Escolher versículo ou trecho de devocional como conteúdo
- Editor de imagem/card:
  - Fundos (cores sólidas, gradientes, imagens do acervo ou da galeria)
  - Texto com escolha de fonte, tamanho, cor, alinhamento
  - Sobreposição de texto sobre imagem
  - Elementos decorativos (bordas, ícones)
  - Formatos: 9×16 (Stories/Reels), 1×1 (Feed), 4×5 (Feed retrato)
- Exportar imagem (salvar na galeria)
- Compartilhar diretamente no Instagram, WhatsApp, etc.

### 2.5 Feed Social (MVP futuro)
- Seguir outros usuários
- Feed de devocionais públicos
- Curtidas e comentários
- Notificações

### 2.6 Extras Sugeridos
- Plano de leitura bíblica (ex.: Bíblia em 1 ano)
- Lembretes diários (push notification)
- Versículo do dia
- Modo escuro
- Compartilhamento de leitura (progresso semanal)

---

## 3. Stack Tecnológica

### 3.1 Frontend — Mobile (Prioritário)
| Tecnologia | Justificativa |
|-----------|--------------|
| **React Native + Expo** | Cross-platform (iOS + Android), ecossistema rico, fácil deploy |
| **Expo Router** | Navegação baseada em arquivos (similar ao Next.js) |
| **NativeWind** | Tailwind CSS para React Native — estilização rápida e consistente |
| **React Native Skia** | Renderização do editor de imagem/canvas com performance nativa |
| **Zustand** | Gerenciamento de estado leve e simples |
| **React Query (TanStack Query)** | Cache e sincronização de dados com o backend |

### 3.2 Backend (BaaS)
| Tecnologia | Justificativa |
|-----------|--------------|
| **Supabase** | PostgreSQL gerenciado, Auth embutido, Storage, Realtime, Edge Functions |
| **Supabase Auth** | Login social, e-mail/senha, JWT |
| **Supabase Storage** | Upload de imagens dos cards e fotos de perfil |
| **Supabase Edge Functions** | Lógica server-side quando necessário (Deno/TypeScript) |

> O Supabase elimina a necessidade de montar um backend do zero, reduz custo e acelera o desenvolvimento.

### 3.3 Banco de Dados
- **PostgreSQL** via Supabase
- Dados da Bíblia importados diretamente no banco (JSON → SQL)
- Full-text search nativo do PostgreSQL (`tsvector` / `tsquery`)

### 3.4 Web (Fase 2 — opcional)
- **Next.js 14+ (App Router)** — mesma lógica de negócio, UI adaptada para desktop/web
- Compartilha os mesmos tipos TypeScript e chamadas ao Supabase

---

## 4. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────┐
│              React Native (Expo)                │
│  Expo Router │ NativeWind │ Skia │ Zustand      │
└──────────────┬──────────────────────────────────┘
               │ HTTPS / WebSocket
┌──────────────▼──────────────────────────────────┐
│                  Supabase                        │
│  Auth │ PostgreSQL │ Storage │ Edge Functions    │
└─────────────────────────────────────────────────┘
```

---

## 5. Modelo de Dados (Esboço)

```sql
-- Usuários (gerenciado pelo Supabase Auth + profiles)
profiles (id, username, full_name, avatar_url, bio, created_at)

-- Bíblia
bible_versions (id, slug, name, language)
bible_books (id, version_id, number, name, abbrev, testament)
bible_chapters (id, book_id, number)
bible_verses (id, chapter_id, number, text, search_vector)

-- Devocionais
devotionals (id, user_id, title, content, is_public, created_at, updated_at)
devotional_verses (devotional_id, verse_id)  -- relação N:N
devotional_tags (devotional_id, tag)

-- Bookmarks & Destaques
bookmarks (id, user_id, verse_id, created_at)
highlights (id, user_id, verse_id, color, created_at)

-- Cards / Stories
cards (id, user_id, image_url, template_config jsonb, verse_id, created_at)

-- Social (Fase 2)
follows (follower_id, following_id)
likes (user_id, devotional_id)
comments (id, user_id, devotional_id, content, created_at)
```

---

## 6. Estrutura de Pastas do Projeto

```
marceloCintiaDevos/
├── docs/                        # Documentação do projeto
│   └── planejamento.md
├── app/                         # Expo Router (telas)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx            # Home / Versículo do dia
│   │   ├── bible/
│   │   │   ├── index.tsx        # Seleção de livro
│   │   │   ├── [book]/
│   │   │   │   └── [chapter].tsx
│   │   ├── devotionals/
│   │   │   ├── index.tsx        # Lista
│   │   │   ├── new.tsx          # Criar devocional
│   │   │   └── [id].tsx         # Detalhe
│   │   ├── creator/             # Editor de cards/stories
│   │   │   └── index.tsx
│   │   └── profile/
│   │       └── index.tsx
├── components/                  # Componentes reutilizáveis
├── lib/                         # Supabase client, helpers
├── stores/                      # Zustand stores
├── hooks/                       # Custom hooks
├── types/                       # TypeScript types
├── assets/                      # Fontes, imagens, ícones
├── supabase/
│   ├── migrations/              # SQL migrations
│   └── seed/                    # Dados da Bíblia
├── README.md
└── package.json
```

---

## 7. Dados Bíblicos

- Fontes de dados gratuitas e de domínio público para Almeida:
  - [bible-api.com](https://bible-api.com) (API pública, ARA/ARC)
  - Repositórios GitHub com JSON das versões (ex: `thiagobodruk/biblia`)
  - Importar via script para o PostgreSQL com suporte a full-text search
- As versões da tradição Almeida são de domínio público no Brasil
- NVI requer licença (verificar uso para app não comercial)

---

## 8. Fases de Desenvolvimento

### Fase 1 — MVP (Prioridade Alta)
- [ ] Setup do projeto (Expo + Supabase)
- [ ] Autenticação (cadastro, login, perfil)
- [ ] Importação dos dados bíblicos (ARC + ARA)
- [ ] Leitor da Bíblia com navegação e pesquisa
- [ ] CRUD de Devocionais
- [ ] Editor básico de cards (texto + fundo + imagem)
- [ ] Exportar/compartilhar card

### Fase 2 — Engajamento
- [ ] Feed social (público)
- [ ] Seguir usuários, curtir, comentar
- [ ] Plano de leitura bíblica
- [ ] Push notifications (versículo do dia, lembretes)
- [ ] Modo escuro

### Fase 3 — Expansão
- [ ] Versão Web (Next.js)
- [ ] Mais versões bíblicas
- [ ] Templates premium de cards
- [ ] Integração direta com Instagram API (publicação)

---

## 9. Estimativas Iniciais de Tecnologias / Dependências

```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "react-native": "0.76.x",
  "@supabase/supabase-js": "^2.x",
  "nativewind": "^4.x",
  "@shopify/react-native-skia": "latest",
  "zustand": "^5.x",
  "@tanstack/react-query": "^5.x",
  "expo-image-picker": "latest",
  "expo-media-library": "latest",
  "expo-sharing": "latest",
  "expo-notifications": "latest"
}
```

---

## 10. Decisões Técnicas & Raciocínio

| Decisão | Alternativa Considerada | Por quê escolhemos |
|---------|------------------------|-------------------|
| Expo | React Native CLI | DX superior, EAS Build, OTA updates |
| Supabase | Firebase | Open-source, SQL real, sem vendor lock-in Google |
| Skia | react-native-canvas | Performance nativa, suporte a efeitos avançados |
| NativeWind | StyleSheet puro | Consistência com Tailwind, produtividade |
| Zustand | Redux | Mais simples, menos boilerplate |

---

*Documento vivo — atualizar conforme o projeto evolui.*
