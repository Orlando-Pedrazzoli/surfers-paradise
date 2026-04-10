export interface NavCategory {
  label: string;
  href: string;
  icon?: string;
}

export const mainCategories: NavCategory[] = [
  { label: 'Pranchas', href: '/categoria/pranchas' },
  { label: 'Quilhas', href: '/categoria/quilhas' },
  { label: 'Deck', href: '/categoria/deck' },
  { label: 'Leash', href: '/categoria/leash' },
  { label: 'Wetsuit', href: '/categoria/wetsuit' },
  { label: 'Parafinas', href: '/categoria/parafinas' },
  { label: 'Acessórios', href: '/categoria/acessorios' },
  { label: 'SUP/Long/Fun', href: '/categoria/sup-longboard-funboard' },
  { label: 'Capas', href: '/categoria/capas' },
  { label: 'Promoção', href: '/promocao' },
];
