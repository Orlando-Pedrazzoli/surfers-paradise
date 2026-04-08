# 🏄 Surfers Paradise — E-commerce de Surf

## Resumo do Projeto

E-commerce completo de equipamentos de surf inspirado na [OnlySurf](https://www.onlysurf.com.br/), construído como **monorepo Next.js 15** com TypeScript. O projeto é um clone visual + funcional da OnlySurf para o cliente **Surfers Paradise**.

- **Cliente:** Surfers Paradise (novo cliente)
- **Desenvolvedor:** Orlando Pedrazzoli — [Pedrazzoli Digital](https://pedrazzolidigital.com)
- **Base de referência:** Migração da arquitetura Elite Surfing Brasil (Vite+React+Express) para Next.js monorepo
- **Status:** Phase 1 — Foundation (setup completo, estrutura criada, ficheiros vazios prontos para desenvolvimento)

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

### Dev Dependencies

| Package              | Versão  |
| -------------------- | ------- |
| @types/bcryptjs      | ^2.4.6  |
| @types/nodemailer    | ^8.0.0  |
| @types/qrcode        | ^1.5.6  |
| @types/node          | ^20     |
| @types/react         | ^19     |
| @types/react-dom     | ^19     |
| tsx                  | ^4.21.0 |
| eslint               | ^9      |
| eslint-config-next   | 16.2.3  |
| @tailwindcss/postcss | ^4      |
| typescript           | ^5      |

---

## Estrutura do Projeto

```
surfers-paradise/
├── public/
│   ├── images/
│   │   ├── banners/              # Banner images (hero, promo, category)
│   │   ├── categories/           # Category images for menu/pages
│   │   ├── icons/                # UI icons
│   │   ├── logo.svg              # Main logo
│   │   └── logo-white.svg        # White version for dark backgrounds
│   ├── favicon.ico
│   ├── robots.txt
│   └── site.webmanifest
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (Navbar, Footer, Providers)
│   │   ├── page.tsx              # Home page
│   │   ├── loading.tsx           # Global loading state
│   │   ├── not-found.tsx         # 404 page
│   │   ├── error.tsx             # Error boundary
│   │   ├── globals.css           # Tailwind + global styles
│   │   ├── sitemap.ts            # Dynamic sitemap generation from DB
│   │   │
│   │   ├── (shop)/               # Store pages (shared layout with Navbar+Footer)
│   │   │   ├── layout.tsx
│   │   │   ├── produtos/
│   │   │   │   ├── page.tsx              # PLP — All products listing
│   │   │   │   └── [slug]/page.tsx       # PDP — Product detail page
│   │   │   ├── categoria/
│   │   │   │   └── [...slug]/page.tsx    # Category pages (supports 3 levels)
│   │   │   ├── marca/
│   │   │   │   └── [slug]/page.tsx       # Brand page
│   │   │   ├── colecao/
│   │   │   │   └── [slug]/page.tsx       # Curated collections
│   │   │   ├── busca/page.tsx            # Search results
│   │   │   └── promocao/page.tsx         # Sale/promo page
│   │   │
│   │   ├── (checkout)/           # Checkout flow (minimal layout, no navbar)
│   │   │   ├── layout.tsx
│   │   │   ├── carrinho/page.tsx         # Cart page
│   │   │   ├── checkout/page.tsx         # Checkout (address + payment)
│   │   │   ├── pagamento/
│   │   │   │   ├── pix/page.tsx          # PIX payment page
│   │   │   │   └── boleto/page.tsx       # Boleto payment page
│   │   │   └── pedido-confirmado/page.tsx # Order success
│   │   │
│   │   ├── (auth)/               # Authentication pages (centered layout)
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── cadastro/page.tsx         # Register
│   │   │   └── verificar-email/page.tsx  # OTP email verification
│   │   │
│   │   ├── (account)/            # User account (protected, sidebar layout)
│   │   │   ├── layout.tsx
│   │   │   ├── minha-conta/page.tsx      # Account dashboard
│   │   │   ├── meus-pedidos/
│   │   │   │   ├── page.tsx              # Order list
│   │   │   │   └── [id]/page.tsx         # Order detail
│   │   │   ├── enderecos/page.tsx        # Address management
│   │   │   └── avaliacoes/page.tsx       # My reviews
│   │   │
│   │   ├── (institutional)/      # Static/institutional pages
│   │   │   ├── layout.tsx
│   │   │   ├── a-empresa/page.tsx
│   │   │   ├── contato/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── politica-privacidade/page.tsx
│   │   │   ├── termos/page.tsx
│   │   │   ├── trocas-devolucoes/page.tsx
│   │   │   ├── formas-pagamento/page.tsx
│   │   │   └── prazos-entrega/page.tsx
│   │   │
│   │   ├── blog/                 # Blog
│   │   │   ├── page.tsx                  # Blog listing
│   │   │   └── [slug]/page.tsx           # Blog post detail
│   │   │
│   │   ├── admin/                # Admin/Seller panel
│   │   │   ├── layout.tsx                # Admin sidebar layout
│   │   │   ├── page.tsx                  # Dashboard
│   │   │   ├── login/page.tsx
│   │   │   ├── produtos/
│   │   │   │   ├── page.tsx              # Product list
│   │   │   │   ├── novo/page.tsx         # Add product
│   │   │   │   └── [id]/page.tsx         # Edit product
│   │   │   ├── categorias/page.tsx       # Category management (hierarchical)
│   │   │   ├── marcas/page.tsx           # Brand management
│   │   │   ├── pedidos/
│   │   │   │   ├── page.tsx              # Order list
│   │   │   │   └── [id]/page.tsx         # Order detail
│   │   │   ├── clientes/page.tsx
│   │   │   ├── blog/page.tsx             # Blog manager
│   │   │   ├── avaliacoes/page.tsx       # Review moderation
│   │   │   ├── cupons/page.tsx           # Coupon management
│   │   │   ├── romaneios/
│   │   │   │   ├── page.tsx              # Shipping labels
│   │   │   │   └── [id]/page.tsx         # Print romaneio
│   │   │   └── configuracoes/page.tsx    # Store settings (banners, etc)
│   │   │
│   │   └── api/                  # API Routes (replaces Express backend)
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── products/
│   │       │   ├── route.ts              # GET all / POST new
│   │       │   ├── [id]/route.ts         # GET/PUT/DELETE single
│   │       │   ├── slug/[slug]/route.ts  # GET by slug
│   │       │   └── search/route.ts       # GET search
│   │       ├── categories/
│   │       │   ├── route.ts              # CRUD categories
│   │       │   └── [id]/route.ts
│   │       ├── brands/
│   │       │   ├── route.ts              # CRUD brands
│   │       │   └── [id]/route.ts
│   │       ├── cart/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── addresses/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── reviews/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── payments/
│   │       │   ├── pagarme/route.ts      # Pagar.me charge creation
│   │       │   ├── pix/route.ts          # PIX manual flow
│   │       │   └── webhook/route.ts      # Pagar.me webhooks
│   │       ├── shipping/
│   │       │   ├── calculate/route.ts    # Melhor Envio quote
│   │       │   └── label/route.ts        # Generate shipping label
│   │       ├── otp/route.ts
│   │       ├── upload/route.ts           # Cloudinary upload
│   │       ├── blog/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── catalog/route.ts          # Public catalog/feed
│   │       ├── clients/route.ts
│   │       ├── romaneios/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── coupons/
│   │       │   ├── route.ts
│   │       │   ├── validate/route.ts
│   │       │   └── [id]/route.ts
│   │       └── seller/route.ts
│   │
│   ├── components/
│   │   ├── ui/                   # Base UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Rating.tsx
│   │   │   ├── PriceDisplay.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── Navbar.tsx            # Main nav with mega-menu
│   │   │   ├── MegaMenu.tsx          # Category mega-menu (3 levels)
│   │   │   ├── MobileMenu.tsx        # Mobile hamburger menu
│   │   │   ├── Footer.tsx
│   │   │   ├── AnnouncementBar.tsx   # Top bar (frete gratis, descontos)
│   │   │   ├── CartSidebar.tsx       # Slide-in cart drawer
│   │   │   ├── SearchBar.tsx         # Search with autocomplete
│   │   │   └── WhatsAppButton.tsx    # Floating WhatsApp button
│   │   │
│   │   ├── home/                 # Home page sections
│   │   │   ├── HeroBanner.tsx        # Main carousel banner
│   │   │   ├── BrandCarousel.tsx     # Brand logos slider
│   │   │   ├── FeaturedProducts.tsx  # "Encontre sua prancha" section
│   │   │   ├── NewArrivals.tsx       # "Novidades" section
│   │   │   ├── PromoBanners.tsx      # Mid-page promo banners
│   │   │   ├── CategoryBanners.tsx   # Deck, Leash, Capas banners
│   │   │   ├── ReviewsCarousel.tsx   # Store reviews carousel
│   │   │   └── Newsletter.tsx        # Newsletter signup
│   │   │
│   │   ├── product/              # Product components
│   │   │   ├── ProductCard.tsx       # Card for listings
│   │   │   ├── ProductGrid.tsx       # Grid layout for PLP
│   │   │   ├── ProductFilters.tsx    # Sidebar filters (brand, price, etc)
│   │   │   ├── ProductSort.tsx       # Sort dropdown
│   │   │   ├── ProductGallery.tsx    # Image gallery with zoom
│   │   │   ├── ProductInfo.tsx       # Name, price, variants
│   │   │   ├── ProductTabs.tsx       # Description, specs, reviews tabs
│   │   │   ├── ProductReviews.tsx    # Reviews section on PDP
│   │   │   ├── RelatedProducts.tsx   # Related/similar products
│   │   │   ├── ShippingCalculator.tsx # CEP-based shipping calc
│   │   │   ├── ShareProduct.tsx      # Share on social media
│   │   │   └── ProductPriceDisplay.tsx # Price with installments + PIX discount
│   │   │
│   │   ├── checkout/             # Checkout components
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   ├── AddressForm.tsx
│   │   │   ├── AddressSelector.tsx
│   │   │   ├── ShippingOptions.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── CreditCardForm.tsx
│   │   │   ├── CouponInput.tsx
│   │   │   ├── OrderSummary.tsx
│   │   │   └── OtpVerification.tsx
│   │   │
│   │   ├── blog/                 # Blog components
│   │   │   ├── BlogCard.tsx
│   │   │   ├── BlogHero.tsx
│   │   │   └── BlogContent.tsx
│   │   │
│   │   ├── admin/                # Admin panel components
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── ProductForm.tsx       # Add/Edit product form
│   │   │   ├── CategoryForm.tsx      # Add/Edit category (hierarchical)
│   │   │   ├── BrandForm.tsx         # Add/Edit brand with logo upload
│   │   │   ├── OrderTable.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   ├── ClientTable.tsx
│   │   │   ├── ReviewTable.tsx
│   │   │   ├── CouponForm.tsx
│   │   │   ├── BannerManager.tsx     # Manage all banners
│   │   │   ├── ImageUpload.tsx       # Cloudinary upload widget
│   │   │   ├── RichTextEditor.tsx
│   │   │   ├── DataTable.tsx         # Reusable sortable data table
│   │   │   └── ShippingLabel.tsx
│   │   │
│   │   ├── seo/
│   │   │   └── JsonLd.tsx            # Structured data (Product, Breadcrumb, Org)
│   │   │
│   │   └── shared/
│   │       ├── CookieConsent.tsx
│   │       ├── ScrollToTop.tsx
│   │       └── HealthCheck.tsx
│   │
│   ├── lib/                      # Core library code
│   │   ├── db/
│   │   │   └── connect.ts            # MongoDB connection singleton
│   │   │
│   │   ├── models/               # Mongoose models (MongoDB)
│   │   │   ├── Product.ts            # Products with variants, specs, SEO
│   │   │   ├── Category.ts           # Hierarchical (3 levels deep)
│   │   │   ├── Brand.ts              # Brands with logo, featured toggle
│   │   │   ├── Order.ts              # Orders with payment + shipping info
│   │   │   ├── User.ts               # Customers + admin roles
│   │   │   ├── Address.ts            # Shipping addresses
│   │   │   ├── Review.ts             # Product + store reviews
│   │   │   ├── BlogPost.ts           # Blog posts
│   │   │   ├── OtpVerification.ts    # Email OTP codes
│   │   │   ├── Coupon.ts             # Discount coupons
│   │   │   ├── Banner.ts             # Admin-managed banners
│   │   │   ├── Romaneio.ts           # Packing slips
│   │   │   └── StoreSettings.ts      # Announcement bar, store config
│   │   │
│   │   ├── services/             # Business logic / external APIs
│   │   │   ├── pagarme.ts            # Pagar.me V5 (card, boleto, PIX)
│   │   │   ├── melhorEnvio.ts        # Melhor Envio shipping API
│   │   │   ├── cloudinary.ts         # Image upload service
│   │   │   ├── email.ts              # Nodemailer transactional emails
│   │   │   ├── otp.ts                # OTP generation/verification
│   │   │   ├── fraudProtection.ts    # 7-layer fraud system
│   │   │   └── whatsapp.ts           # WhatsApp notifications
│   │   │
│   │   ├── auth/                 # NextAuth v5 config
│   │   │   ├── config.ts             # NextAuth options
│   │   │   ├── providers.ts          # Credentials provider
│   │   │   └── middleware.ts          # Auth helper functions
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── formatCurrency.ts     # BRL currency formatting
│   │   │   ├── formatDate.ts         # Date formatting pt-BR
│   │   │   ├── installments.ts       # Installment calculator (10x sem juros)
│   │   │   ├── pixUtils.ts           # PIX QR code generation
│   │   │   ├── slugify.ts            # URL slug generation
│   │   │   ├── validators.ts         # CPF, email, CEP validation
│   │   │   ├── disposableEmails.ts   # Disposable email blacklist
│   │   │   └── cn.ts                 # clsx + tailwind-merge utility
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useCart.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── useMetaPixel.ts
│   │   │
│   │   ├── context/              # React context providers
│   │   │   ├── CartProvider.tsx       # Cart state management
│   │   │   └── AppProvider.tsx        # Global app state
│   │   │
│   │   ├── config/               # Configuration files
│   │   │   ├── company.ts            # Store info (name, CNPJ, address, etc)
│   │   │   ├── seo.ts                # Default SEO metadata
│   │   │   └── navigation.ts         # Menu structure configuration
│   │   │
│   │   └── types/                # TypeScript type definitions
│   │       ├── product.ts
│   │       ├── category.ts
│   │       ├── brand.ts
│   │       ├── order.ts
│   │       ├── user.ts
│   │       ├── cart.ts
│   │       ├── review.ts
│   │       ├── shipping.ts
│   │       ├── payment.ts
│   │       └── index.ts              # Re-exports all types
│   │
│   └── emails/                   # Email templates
│       ├── OrderConfirmation.tsx
│       ├── OrderStatusUpdate.tsx
│       ├── OtpVerification.tsx
│       └── WelcomeEmail.tsx
│
├── scripts/
│   ├── seed.ts                   # Seed database with sample data
│   └── seed-admin.ts             # Create admin user
│
├── middleware.ts                  # Next.js middleware (auth, redirects)
├── .env.local                    # Environment variables (not in git)
├── .env.example                  # Env template
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── package.json
└── README.md
```

---

## Database Models

### Product

- name, slug (unique), description, richDescription (HTML)
- sku, price, compareAtPrice, costPrice
- category (ref → Category), brand (ref → Brand)
- images[] (Cloudinary URLs), thumbnail
- variants[] (name, options with label/value/stock/sku)
- stock, weight (grams), dimensions (L×W×H cm)
- specifications[] (key/value pairs)
- tags[], isActive, isFeatured, isNewArrival, isOnSale, salePercentage
- seoTitle, seoDescription
- averageRating, reviewCount, soldCount

### Category (hierarchical — 3 levels)

- name, slug, description, image, icon
- parent (ref → Category, null = root)
- level (0=root, 1=sub, 2=sub-sub), order
- isActive, seoTitle, seoDescription, productCount

### Brand

- name, slug, logo (Cloudinary), description, website
- isFeatured (show in carousel), order, isActive, productCount

### Order

- orderNumber (SP-2026-XXXXX)
- user (ref → User, optional for guests), guestEmail
- items[] (product ref, name, slug, image, variant, quantity, price)
- subtotal, shippingCost, discount, coupon, total
- shippingAddress (name, street, number, complement, neighborhood, city, state, cep, phone, cpf)
- payment (method, status, pagarmeOrderId, pagarmeChargeId, installments, boletoUrl, pixQrCode, etc)
- shipping (method, carrier, estimatedDays, trackingCode, melhorEnvioId, dates)
- status: pending → confirmed → processing → shipped → delivered / cancelled

### User

- name, email, password (bcrypt), cpf, phone
- role: customer | admin
- isEmailVerified, addresses[], defaultAddress
- orderCount, totalSpent, lastOrderAt

### Review

- product (ref), user (ref optional), name, email, city, state
- rating (1-5), title, comment
- isApproved, isStoreReview (general vs product)

### Coupon

- code (unique, uppercase), type (percentage | fixed), value
- minOrderValue, maxDiscount, usageLimit, usedCount
- validFrom, validUntil, isActive
- applicableCategories[], applicableBrands[]

### Banner

- title, image, mobileImage, link
- position: hero | mid_promo | category | brand
- order, isActive, startDate, endDate

### StoreSettings

- Announcement bar text, WhatsApp number, business hours
- Social media links, store policies

### Other models

- Address, BlogPost, OtpVerification, Romaneio (same as Elite Surfing, typed)

---

## Key Features

### Storefront

- **Mega-menu** with 3-level category navigation + brand images
- **Product filters** by brand, category, price range, tags (URL-based with searchParams)
- **Product variants** (size, color) with per-variant stock
- **Price display**: original price, sale price, 10% PIX/Boleto discount, 10x sem juros
- **Shipping calculator** on PDP (Melhor Envio API by CEP)
- **Search** with autocomplete
- **Banner carousel** (admin-managed)
- **Brand carousel** (auto-populated from DB)
- **Store reviews** carousel
- **Newsletter** signup
- **Blog** with CRUD
- **Institutional pages** (FAQ, Terms, Privacy, etc)

### Checkout & Payments

- **Cart** (sidebar drawer + full page)
- **Guest checkout** with OTP email verification
- **Pagar.me V5**: Credit card (up to 10x sem juros), Boleto, PIX
- **PIX manual flow** with QR code
- **Melhor Envio**: shipping quotes + label generation
- **Coupon system** (percentage/fixed, date range, category/brand restrictions)
- **7-layer fraud protection** (honeypot, disposable email blocking, IP rate limiting, CPF validation, DDD-state geo checks, OTP verification)
- **Order confirmation emails** via Nodemailer
- **Webhook handling** for payment status updates

### Admin Panel

- **Dashboard** with sales stats
- **Product CRUD** with Cloudinary image upload, variants, specifications
- **Category management** (hierarchical, 3 levels, drag-to-reorder)
- **Brand management** (logo upload, featured toggle)
- **Order management** with status updates + email notifications
- **Banner manager** (hero, promo, category banners)
- **Coupon management** (create, edit, deactivate)
- **Client list** with order history
- **Review moderation** (approve/reject before publishing)
- **Blog manager** (CRUD posts)
- **Romaneios** (packing slips / shipping labels)
- **Store settings** (announcement bar, WhatsApp, etc)

### SEO

- **Server-side rendering** (SSR) for all store pages
- **Dynamic metadata** via `generateMetadata()` on every page
- **JSON-LD** structured data (Product, BreadcrumbList, Organization)
- **Dynamic sitemap** generated from database
- **ISR** (Incremental Static Regeneration) for product/category pages
- **SEO-friendly URLs** (`/produtos/quilha-fcs-ii-carver-pc-tri-medium`)

### Security

- **NextAuth v5** with credentials provider (customer + admin)
- **Middleware** route protection for admin and account pages
- **Fraud protection** system (7 layers, migrated from Elite Surfing)
- **OTP email verification** for guest checkout
- **bcrypt** password hashing

---

## Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Pagar.me
PAGARME_SECRET_KEY=sk_...
PAGARME_PUBLIC_KEY=pk_...

# Melhor Envio
MELHOR_ENVIO_TOKEN=
MELHOR_ENVIO_SANDBOX=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=contato@surfersparadise.com.br

# WhatsApp
WHATSAPP_NUMBER=55...

# Admin
ADMIN_EMAIL=admin@surfersparadise.com.br
ADMIN_PASSWORD=

# Meta Pixel (optional)
NEXT_PUBLIC_META_PIXEL_ID=

# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=
```

---

## Development Phases

### Phase 1 — Foundation ✅

- [x] Project setup (Next.js 16 + TypeScript + Tailwind v4)
- [x] All dependencies installed
- [x] Complete folder/file structure created
- [ ] MongoDB models (Product, Category, Brand, User, Order, etc)
- [ ] DB connection singleton
- [ ] NextAuth v5 (customer + admin auth)
- [ ] TypeScript types for all models
- [ ] Admin panel: login, dashboard
- [ ] Admin: CRUD products/categories/brands
- [ ] Cloudinary image upload
- [ ] Seed scripts (sample data + admin user)

### Phase 2 — Storefront

- [ ] Home page (banner carousel, brand carousel, featured, novidades, reviews)
- [ ] Navbar with mega-menu (3-level categories)
- [ ] PLP: product listing with filters, sort, pagination
- [ ] PDP: gallery, price, variants, shipping calc, reviews, related
- [ ] Category pages (dynamic [...slug] routing)
- [ ] Brand pages
- [ ] Search with autocomplete
- [ ] Cart (sidebar + full page)

### Phase 3 — Checkout & Payments

- [ ] Checkout flow (address, shipping, payment selection)
- [ ] Pagar.me V5: credit card (10x sem juros)
- [ ] Pagar.me: Boleto
- [ ] PIX manual flow
- [ ] OTP email verification
- [ ] Fraud protection (7-layer system)
- [ ] Order confirmation email
- [ ] Webhook handling

### Phase 4 — Admin & Operations

- [ ] Admin: order management + status updates
- [ ] Admin: banner manager
- [ ] Admin: coupon management
- [ ] Admin: client list
- [ ] Admin: review moderation
- [ ] Melhor Envio: shipping label generation
- [ ] Romaneios (packing slips)
- [ ] Order status update emails

### Phase 5 — SEO & Polish

- [ ] Dynamic sitemap generation
- [ ] JSON-LD structured data
- [ ] Meta tags via generateMetadata()
- [ ] Blog (CRUD + public pages)
- [ ] Institutional pages content
- [ ] Cookie consent
- [ ] Performance optimization (Image, lazy loading, ISR)
- [ ] Mobile responsive final pass
- [ ] Meta Pixel / GA4 integration

### Phase 6 — Launch

- [ ] DNS + domain setup
- [ ] SSL verification
- [ ] Product data import from client
- [ ] UAT with client
- [ ] Go live 🚀

---

## Migration Reference: Elite Surfing → Surfers Paradise

| Elite Surfing (Vite+React+Express) | Surfers Paradise (Next.js Monorepo)                |
| ---------------------------------- | -------------------------------------------------- |
| `client/` + `server/` repos        | Single monorepo                                    |
| Vite + React Router                | Next.js App Router                                 |
| Express API                        | Next.js API Routes (`app/api/`)                    |
| `context/AppContext.jsx`           | `lib/context/CartProvider.tsx` + `AppProvider.tsx` |
| `components/Navbar.jsx`            | `components/layout/Navbar.tsx` (RSC + client)      |
| `pages/Home.jsx`                   | `app/page.tsx`                                     |
| `pages/ProductDetails.jsx`         | `app/(shop)/produtos/[slug]/page.tsx`              |
| `pages/seller/Dashboard.jsx`       | `app/admin/page.tsx`                               |
| `controllers/*.js`                 | `app/api/*/route.ts`                               |
| `models/*.js`                      | `lib/models/*.ts`                                  |
| `services/*.js`                    | `lib/services/*.ts`                                |
| `react-helmet-async`               | Next.js `generateMetadata()`                       |
| Manual sitemap script              | `app/sitemap.ts` (auto)                            |

---

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npx tsx scripts/seed.ts        # Seed database
npx tsx scripts/seed-admin.ts  # Create admin user
```

---

## Design Reference

Visual clone of [OnlySurf](https://www.onlysurf.com.br/) adapted for Surfers Paradise branding. Key visual elements:

- Top announcement bar with rotating promos
- Mega-menu with category tree + brand images
- Hero banner carousel (full-width)
- Brand logo carousel
- Product grid with cards (image, badge, name, price, installments)
- Store reviews carousel
- Newsletter signup section
- Footer with multiple columns + payment icons + trust badges

---

_Built by [Pedrazzoli Digital](https://pedrazzolidigital.com) — Orlando Pedrazzoli_
