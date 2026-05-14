export const company = {
  name: 'Surfers Paradise',
  legalName: 'OMBAK BARU COMERCIO DE ARTIGOS ESPORTIVOS LTDA',
  slogan: '20 anos no mercado de acessórios e equipamentos para o Surf',
  cnpj: '58.212.091/0001-09',
  ie: '151.695.586.118',
  email: 'lojasurfersparadiseoficial@gmail.com',
  phone: '(11) 94716-9003',
  whatsapp: '5511947169003',
  address: {
    street: 'Alameda dos Maracatins',
    number: '1317',
    complement: '',
    neighborhood: 'Indianópolis',
    city: 'São Paulo',
    state: 'SP',
    cep: '04089-014',
  },
  social: {
    instagram: 'https://www.instagram.com/lojasurfersparadiseoficial/',
    facebook: 'https://web.facebook.com/lojasurfersparadise/',
    youtube: '',
  },
  businessHours: 'Seg a Sex: 10h às 20h | Sáb: 10h às 19h | Dom: Fechado',
  url: 'https://surfersparadise.com.br',
  orderPrefix: 'SP',
  payment: {
    maxInstallments: 10,
    minInstallmentValue: 30,
    pixDiscountPercent: 10,
    boletoDiscountPercent: 10,
  },
  shipping: {
    freeShippingMinValue: 299.9,
    originCep: '04089-014',
  },
} as const;

/**
 * Endereço formatado em linha única
 * Ex: "Alameda dos Maracatins, 1317 · Indianópolis · São Paulo - SP · CEP 04089-014"
 */
export function getFormattedAddress(): string {
  const a = company.address;
  const parts: string[] = [];

  if (a.street && a.number) {
    parts.push(
      `${a.street}, ${a.number}${a.complement ? ` · ${a.complement}` : ''}`,
    );
  }
  if (a.neighborhood) parts.push(a.neighborhood);
  if (a.city && a.state) parts.push(`${a.city} - ${a.state}`);
  if (a.cep) parts.push(`CEP ${a.cep}`);

  return parts.join(' · ');
}

/**
 * Endereço curto (para cupom térmica 80mm)
 * Ex: "Indianópolis · São Paulo - SP"
 */
export function getShortAddress(): string {
  const a = company.address;
  const parts: string[] = [];
  if (a.neighborhood) parts.push(a.neighborhood);
  if (a.city && a.state) parts.push(`${a.city} - ${a.state}`);
  return parts.join(' · ');
}
