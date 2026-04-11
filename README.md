# 🏄 Surfers Paradise — E-commerce de Surf

## Resumo do Projeto

E-commerce completo de equipamentos de surf inspirado na [OnlySurf](https://www.onlysurf.com.br/), construído como **monorepo Next.js** com TypeScript. O projeto é um clone visual + funcional da OnlySurf para o cliente **Surfers Paradise**.

- **Cliente:** Surfers Paradise (novo cliente — loja física com 20 anos de mercado)
- **Desenvolvedor:** Orlando Pedrazzoli — [Pedrazzoli Digital](https://pedrazzolidigital.com)
- **Base de referência:** Migração da arquitetura Elite Surfing Brasil (Vite+React+Express) para Next.js monorepo
- **Identidade Visual:** Laranja vivo (#FF6600), Preto (#1A1A1A), Branco — logo estrela laranja sobre fundo preto
- **Status:** Phase 2 em andamento — Admin CRUD completo + Homepage funcional + PDP básica

---

## O que já está CONCLUÍDO

### Phase 1 — Foundation ✅

- [x] Projeto Next.js 16.2.3 + TypeScript + Tailwind v4
- [x] Todas as dependências instaladas
- [x] Estrutura completa de pastas e ficheiros criada
- [x] MongoDB Atlas conectado (cluster0.njxz6k3.mongodb.net/surfers-paradise)
- [x] Cloudinary conectado (dy2cjyhp6)
- [x] DB connection singleton (`src/lib/db/connect.ts`)
- [x] 10 ficheiros de TypeScript types (`src/lib/types/`)
- [x] 13 Mongoose models (`src/lib/models/`)
- [x] NextAuth v5 beta com credentials + JWT (`src/lib/auth/`)
- [x] Proxy.ts na raiz para protecção de rotas
- [x] Seed admin funcional (`scripts/seed-admin.ts`)
- [x] Utilitários: cn.ts, company.ts, seo.ts, navigation.ts, formatCurrency.ts, installments.ts

### Admin Panel ✅

- [x] Admin login isolado em `/admin-login` (sem sidebar)
- [x] Admin layout com sidebar + header
- [x] Admin dashboard com contadores do DB
- [x] CRUD Categorias (hierárquico, 3 níveis)
- [x] CRUD Marcas (com upload logo Cloudinary + toggle Destaque)
- [x] CRUD Produtos completo (formulário com imagens múltiplas, variantes, especificações, SEO)
- [x] CRUD Banners (posições: hero, mid_promo, category, brand — com upload desktop/mobile)
- [x] Cloudinary service + upload API route
- [x] AppProvider com SessionProvider + Toaster

### Storefront (Phase 2 — parcialmente concluído) ✅

- [x] AnnouncementBar (barra laranja rotativa com 3 mensagens)
- [x] Navbar (logo, busca, login, carrinho, menu categorias desktop + mobile)
- [x] Footer (newsletter, 4 colunas de links, créditos Pedrazzoli Digital)
- [x] WhatsAppButton (botão flutuante verde)
- [x] HeroBanner carousel (puxa banners do DB, auto-play, setas, dots)
- [x] BrandCarousel (grid 6 colunas, logos das marcas em destaque, grayscale hover)
- [x] FeaturedProducts (secção reutilizável com carousel horizontal de ProductCards)
- [x] ProductCard (carousel de imagens, badges, preço PIX/parcelas, cores, tamanhos, favorito)
- [x] Homepage completa (`src/app/page.tsx`) com todos os componentes
- [x] PDP básica (`src/app/(shop)/produtos/[slug]/page.tsx`) — galeria, preço, PIX/Boleto, variantes, especificações, reviews, produtos relacionados
- [x] API route GET by slug (`src/app/api/products/slug/[slug]/route.ts`)

### Dados já cadastrados no DB ✅

- [x] Admin user criado
- [x] 2 hero banners (FCS Gabriel Medina + Rip Curl E-Bomb)
- [x] 12 marcas com logos (Rip Curl, Vissla, O'Neill, Hurley, Lost, Wet Works, Pyzel, Xanadu, Draft, Chilli, JS Industries)
- [x] 4 categorias (Pranchas, Wetsuit, Quilhas, Acessórios)
- [x] Produtos de teste

---

## O que PRECISA SER FEITO / CORRIGIDO

### 🔴 PRIORIDADE 1 — Sistema de Família de Produtos (Variantes)

O sistema actual de variantes (opções dentro do mesmo produto) NÃO serve para este e-commerce de surf. Precisamos implementar o sistema de **"Família de Produtos"** igual ao da Elite Surfing Brasil:

**Conceito:** Cada tamanho/cor é um PRODUTO INDEPENDENTE com seu próprio preço, estoque, SKU e imagens. Produtos são AGRUPADOS por um "nome de família" e na página do produto aparecem botões para alternar entre variantes.

**Exemplo:** Prancha Lost Puddle Jumper tem 3 produtos separados:

- Prancha Lost Puddle Jumper 5'10 — R$ 1.200 — SKU: LOST-PJ-510
- Prancha Lost Puddle Jumper 6'3 — R$ 1.350 — SKU: LOST-PJ-63
- Prancha Lost Puddle Jumper 6'6 — R$ 1.500 — SKU: LOST-PJ-66

Todos com `productFamily: "prancha-lost-puddle-jumper"` e `variantType: "size"`.

**Novos campos necessários no Product model:**

```typescript
productFamily?: string;        // slug que agrupa produtos (ex: "prancha-lost-puddle-jumper")
variantType?: "color" | "size"; // tipo de variante
color?: string;                // nome da cor (ex: "Preto", "Azul Marinho")
colorCode?: string;            // hex da cor (ex: "#000000")
colorCode2?: string;           // hex da 2ª cor para bicolor (ex: "#2563EB")
size?: string;                 // tamanho (ex: "6'0", "P", "M", "G")
isMainVariant: boolean;        // se true, aparece na listagem (apenas 1 por família)
```

**Ficheiros a actualizar:**

1. `src/lib/types/product.ts` — adicionar novos campos
2. `src/lib/models/Product.ts` — adicionar campos ao schema + index em productFamily
3. `src/app/admin/produtos/novo/page.tsx` — reformular formulário com secção Família
4. `src/app/admin/produtos/[id]/page.tsx` — mesma reformulação para edição
5. `src/app/(shop)/produtos/[slug]/page.tsx` — na PDP, buscar família e mostrar botões
6. `src/app/api/products/slug/[slug]/route.ts` — buscar produtos da mesma família
7. `src/components/product/ProductCard.tsx` — mostrar apenas isMainVariant nas listagens
8. `src/app/api/products/route.ts` — filtrar por isMainVariant na listagem pública

**Referência:** O ficheiro `AddProduct.jsx` da Elite Surfing foi fornecido como referência no chat anterior. Tem cores pré-definidas, cores duplas, tamanhos pré-definidos, e toggle cor/tamanho.

### 🟡 PRIORIDADE 2 — Páginas de Listagem

Após o sistema de família estar implementado:

- Página de listagem de produtos (`/produtos`) com filtros, sort, paginação
- Páginas de categoria (`/categoria/[...slug]`) — produtos filtrados por categoria
- Páginas de marca (`/marca/[slug]`) — produtos filtrados por marca
- Página de busca (`/busca?q=termo`)
- Filtros dinâmicos (gerados automaticamente a partir dos produtos existentes)

### 🟡 PRIORIDADE 3 — Completar Homepage

- Secções adicionais: Promo Banners (2 lado a lado), Category Banners (Deck/Leash/Capa), Reviews Carousel
- Mega-menu completo com subcategorias ao hover

### 🟢 PRIORIDADE 4 — Cart & Checkout

- CartProvider context + useCart hook
- Cart sidebar drawer
- Página de carrinho completa
- Checkout flow (endereço, frete, pagamento)
- Pagar.me V5 (cartão, boleto, PIX)
- Melhor Envio (cálculo de frete)

---

## Tech Stack

| Camada             | Tecnologia               | Versão              |
| ------------------ | ------------------------ | ------------------- |
| Framework          | Next.js (App Router)     | 16.2.3              |
| Language           | TypeScript               | ^5                  |
| UI Library         | React                    | 19.2.4              |
| Styling            | Tailwind CSS             | v4                  |
| Database           | MongoDB Atlas + Mongoose | ^9.4.1              |
| Auth               | NextAuth (beta)          | ^5.0.0-beta.30      |
| Payments           | Pagar.me V5              | (card, boleto, PIX) |
| Shipping           | Melhor Envio API         | —                   |
| Images             | Cloudinary               | ^2.9.0              |
| Email              | Nodemailer               | ^7.0.13             |
| Animations         | Framer Motion            | ^12.38.0            |
| Icons              | Lucide React             | ^1.7.0              |
| Carousel           | Swiper                   | ^12.1.3             |
| Validation         | Zod                      | ^4.3.6              |
| QR Code            | qrcode                   | ^1.5.4              |
| Image Optimization | Sharp                    | ^0.34.5             |
| Notifications      | React Hot Toast          | ^2.6.0              |
| CSS Utilities      | clsx + tailwind-merge    | ^2.1.1 / ^3.5.0     |
| HTTP Client        | Axios                    | ^1.15.0             |
| Deploy             | Vercel (monorepo)        | —                   |

---

## Ficheiros com conteúdo (não vazios)

```
src\app\error.tsx
src\app\globals.css
src\app\layout.tsx
src\app\loading.tsx
src\app\not-found.tsx
src\app\page.tsx                           # Homepage com AnnouncementBar, Navbar, HeroBanner, BrandCarousel, FeaturedProducts, Footer, WhatsApp
src\app\(auth)\layout.tsx
src\app\(auth)\admin-login\page.tsx        # Admin login isolado
src\app\(shop)\layout.tsx                  # Shop layout com Navbar + Footer
src\app\(shop)\produtos\[slug]\page.tsx    # PDP — página de detalhe do produto
src\app\admin\layout.tsx
src\app\admin\page.tsx                     # Dashboard
src\app\admin\categorias\page.tsx          # CRUD categorias
src\app\admin\login\page.tsx               # Redirect para /admin-login
src\app\admin\marcas\page.tsx              # CRUD marcas
src\app\admin\produtos\page.tsx            # Listagem de produtos
src\app\admin\produtos\novo\page.tsx       # Formulário novo produto
src\app\admin\produtos\[id]\page.tsx       # Formulário edição produto
src\app\admin\configuracoes\page.tsx       # Gestão de banners
src\app\api\auth\[...nextauth]\route.ts
src\app\api\banners\route.ts               # CRUD banners
src\app\api\banners\[id]\route.ts
src\app\api\brands\route.ts                # CRUD marcas
src\app\api\brands\[id]\route.ts
src\app\api\categories\route.ts            # CRUD categorias
src\app\api\categories\[id]\route.ts
src\app\api\products\route.ts              # GET all + POST (com import forçado Category/Brand)
src\app\api\products\[id]\route.ts         # GET/PUT/DELETE single
src\app\api\products\slug\[slug]\route.ts  # GET by slug + related
src\app\api\upload\route.ts                # Cloudinary upload
src\components\admin\AdminHeader.tsx
src\components\admin\AdminSidebar.tsx
src\components\home\BrandCarousel.tsx      # Grid 6 colunas, logos marcas destaque
src\components\home\FeaturedProducts.tsx   # Secção reutilizável com carousel
src\components\home\HeroBanner.tsx         # Banner carousel com aspect-[2.5/1]
src\components\layout\AnnouncementBar.tsx  # Barra laranja rotativa
src\components\layout\Footer.tsx           # Footer completo
src\components\layout\Navbar.tsx           # Header + menu categorias
src\components\layout\WhatsAppButton.tsx   # Botão flutuante
src\components\product\ProductCard.tsx     # Card com carousel, badges, cores, tamanhos, favorito
src\lib\auth\config.ts
src\lib\auth\middleware.ts
src\lib\auth\providers.ts
src\lib\config\company.ts
src\lib\config\navigation.ts
src\lib\config\seo.ts
src\lib\context\AppProvider.tsx
src\lib\db\connect.ts
src\lib\models\Address.ts
src\lib\models\Banner.ts
src\lib\models\BlogPost.ts
src\lib\models\Brand.ts
src\lib\models\Category.ts
src\lib\models\Coupon.ts
src\lib\models\Order.ts
src\lib\models\OtpVerification.ts
src\lib\models\Product.ts
src\lib\models\Review.ts
src\lib\models\Romaneio.ts
src\lib\models\StoreSettings.ts
src\lib\models\User.ts
src\lib\services\cloudinary.ts
src\lib\types\brand.ts
src\lib\types\cart.ts
src\lib\types\category.ts
src\lib\types\index.ts
src\lib\types\order.ts
src\lib\types\payment.ts
src\lib\types\product.ts
src\lib\types\review.ts
src\lib\types\shipping.ts
src\lib\types\user.ts
src\lib\utils\cn.ts
src\lib\utils\formatCurrency.ts
src\lib\utils\installments.ts
proxy.ts                                   # Protecção de rotas admin + account
scripts\seed-admin.ts
next.config.ts                             # Cloudinary remote patterns
```

---

## Notas Técnicas Importantes

### Mongoose populate — imports forçados

No Next.js com Turbopack, imports "não usados" são removidos por tree-shaking. Para o `populate()` funcionar, os models referenciados precisam ser importados E usados:

```typescript
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';
const _deps = [Category, Brand];
void _deps;
```

Isto já está aplicado nos 3 ficheiros de API de produtos.

### NextAuth v5 — console warning

O erro `ClientFetchError: Unexpected token '<'` no console é um warning do NextAuth ao verificar sessão. Não bloqueia nada. O NEXTAUTH_SECRET está configurado.

### Middleware — proxy.ts

No Next.js 16, `middleware.ts` foi renomeado para `proxy.ts`. O ficheiro está na raiz do projeto e protege rotas `/admin/*`, `/minha-conta/*`, `/meus-pedidos/*`, `/enderecos/*`.

### Identidade Visual

- Primária: `#FF6600` (laranja vivo)
- Secundária: `#1A1A1A` (preto)
- Texto: branco sobre fundos escuros
- Accent: `#e55b00` (hover do laranja)

---

## Environment Variables (.env.local)

```env
MONGODB_URI=mongodb+srv://pedrazzoliorlando:***@cluster0.njxz6k3.mongodb.net/surfers-paradise?appName=Cluster0
NEXTAUTH_SECRET=384238540c6f9044e5f51b4464603d3faa1d470e32586b0ea52e0c7317c1b181
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=dy2cjyhp6
CLOUDINARY_API_KEY=928534196969256
CLOUDINARY_API_SECRET=***
ADMIN_EMAIL=admin@surfersparadise.com.br
ADMIN_PASSWORD=***
```

---

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npx tsx scripts/seed-admin.ts  # Create admin user
```

---

## Design Reference

Clone visual da [OnlySurf](https://www.onlysurf.com.br/) adaptado para Surfers Paradise:

- Barra de anúncios rotativa no topo (laranja)
- Header com logo, busca central, login/carrinho
- Menu de categorias em barra preta (Pranchas, Quilhas, Deck, Leash, Wetsuit, Parafinas, Acessórios, SUP/Long/Fun, Capas, Promoção)
- Hero banner carousel full-width
- Grid de logos de marcas
- Secções de produtos com carousel horizontal (Destaque, Novidades)
- ProductCard: imagem com carousel, badges, nome centrado, preço PIX em laranja, parcelas
- Footer com newsletter, links, créditos
- Botão WhatsApp flutuante

---

_Built by [Pedrazzoli Digital](https://pedrazzolidigital.com) — Orlando Pedrazzoli_
