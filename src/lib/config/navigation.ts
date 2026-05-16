// src/lib/config/navigation.ts
//
// Categorias principais que aparecem na Navbar.
// As subcategorias são puxadas dinamicamente do MongoDB via /api/catalog.
//
// IMPORTANTE: o slug no href DEVE coincidir com o slug da categoria raiz no banco.
// Ex: a categoria "Pranchas" tem slug "pranchas" → href "/categoria/pranchas"

export interface NavCategory {
  label: string;
  href: string;
  icon?: string;
}

export const mainCategories: NavCategory[] = [
  { label: 'Pranchas', href: '/categoria/pranchas' },
  { label: 'Quilhas', href: '/categoria/quilhas' },
  { label: 'Wetsuits', href: '/categoria/wetsuits' },
  { label: 'Decks', href: '/categoria/decks' },
  { label: 'Leashes', href: '/categoria/leashes' },
  { label: 'Capas', href: '/categoria/capas' },
  { label: 'Promoção', href: '/promocao' },
];
