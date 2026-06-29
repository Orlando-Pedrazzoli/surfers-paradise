// src/lib/config/navigation.ts
//
// Os DEPARTAMENTOS principais da Navbar passaram a ser DINÂMICOS:
// vêm das categorias-raiz do MongoDB via /api/catalog. Assim, ao criar
// uma nova categoria-raiz no admin (/admin/categorias) ela aparece
// automaticamente na navbar e nos toggles do ShopByCategory — sem
// editar este ficheiro.
//
// Este ficheiro mantém apenas:
//   • itens ESPECIAIS de navegação que NÃO são categorias da BD (Promoção)
//   • uma lista de FALLBACK usada só se o /api/catalog falhar (resiliência)

export interface NavCategory {
  label: string;
  href: string;
  icon?: string;
  highlight?: boolean; // destaque visual (ex.: Promoção em laranja)
}

// Itens fixos sempre no FIM da navbar (não são categorias da base de dados).
export const specialNavItems: NavCategory[] = [
  { label: 'Promoção', href: '/promocao', highlight: true },
];

// Fallback: usado APENAS se o catálogo não carregar (API em baixo).
// Em funcionamento normal, os departamentos vêm da base de dados, ordenados
// pelo campo `order` de cada categoria-raiz (editável no admin).
export const fallbackCategories: NavCategory[] = [
  { label: 'Pranchas', href: '/categoria/pranchas' },
  { label: 'Quilhas', href: '/categoria/quilhas' },
  { label: 'Wetsuits', href: '/categoria/wetsuits' },
  { label: 'Decks', href: '/categoria/decks' },
  { label: 'Leashes', href: '/categoria/leashes' },
  { label: 'Capas', href: '/categoria/capas' },
];

// Backward-compat: mantido caso algum componente ainda importe mainCategories.
export const mainCategories: NavCategory[] = [
  ...fallbackCategories,
  ...specialNavItems,
];
