import { Types } from 'mongoose';

// Status geral da nota de entrada importada
export type InboundInvoiceStatus = 'pending' | 'completed';

// Situação de cada item da nota em relação ao catálogo
//  - matched: GTIN bateu com produto existente → estoque/custo atualizados
//  - created: produto novo criado a partir do item (cadastro parcial)
//  - pending: aguardando o operador classificar e criar
export type InboundItemMatch = 'matched' | 'created' | 'pending';

export interface IInboundInvoiceItem {
  cProd: string;
  gtin: string;
  xProd: string;
  ncm: string;
  cest: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  matchStatus: InboundItemMatch;
  product?: Types.ObjectId | null; // produto casado ou criado
}

export interface IInboundInvoice {
  _id: Types.ObjectId;
  chave: string; // 44 dígitos — único (idempotência)
  modelo: string;
  number: string;
  series: string;
  issuedAt?: Date;
  issuer: { cnpj: string; name: string; ie: string }; // emitente da nota
  dest: { cnpj: string; name: string };
  supplier?: Types.ObjectId | null; // mapeado pelo CNPJ do emitente
  totalValue: number;
  status: InboundInvoiceStatus;
  items: IInboundInvoiceItem[];
  rawXml: string; // XML original guardado (rastreabilidade / reprocesso)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
