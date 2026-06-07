import { XMLParser } from 'fast-xml-parser';

// ═══════════════════════════════════════════════════════════════
// Parser de NF-e (modelo 55) — converte o XML em dados estruturados.
// Puro: não toca no banco. Reutilizável tanto para upload de XML
// quanto para uma futura busca por chave de acesso via provider.
// ═══════════════════════════════════════════════════════════════

export interface ParsedNfeItem {
  cProd: string; // código do produto no fornecedor
  gtin: string; // EAN/GTIN normalizado ('' quando "SEM GTIN")
  xProd: string; // descrição do produto na nota
  ncm: string;
  cest: string;
  cfop: string;
  unit: string; // unidade comercial (uCom)
  quantity: number; // quantidade comercial (qCom)
  unitCost: number; // valor unitário (vUnCom) — custo real
  totalCost: number; // valor total do item (vProd)
}

export interface ParsedNfe {
  chave: string; // 44 dígitos
  modelo: string; // mod (esperado '55' para NF-e)
  number: string; // nNF
  series: string; // serie
  issuedAt: string; // dhEmi (ISO) ou ''
  emit: { cnpj: string; name: string; ie: string };
  dest: { cnpj: string; name: string };
  totalValue: number; // vNF
  items: ParsedNfeItem[];
}

type XNode = Record<string, unknown>;

function asNode(v: unknown): XNode {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as XNode) : {};
}

function txt(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') {
    const t = (v as XNode)['#text'];
    return t === undefined ? '' : String(t);
  }
  return String(v);
}

function onlyDigits(v: unknown): string {
  return txt(v).replace(/\D/g, '');
}

function toNumber(v: unknown): number {
  const n = parseFloat(txt(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function asArray(v: unknown): unknown[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeGtin(v: unknown): string {
  const s = txt(v).trim().toUpperCase();
  if (!s || s === 'SEM GTIN') return '';
  const digits = s.replace(/\D/g, '');
  // GTIN válido tem 8, 12, 13 ou 14 dígitos
  return [8, 12, 13, 14].includes(digits.length) ? digits : '';
}

export function parseNfeXml(xml: string): ParsedNfe {
  if (!xml || !xml.trim()) {
    throw new Error('XML vazio.');
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false, // mantém códigos como string (NCM, cProd, GTIN…)
    trimValues: true,
  });

  let doc: XNode;
  try {
    doc = asNode(parser.parse(xml));
  } catch {
    throw new Error('XML inválido — não foi possível interpretar o arquivo.');
  }

  // Aceita <nfeProc><NFe>… ou <NFe>… direto
  const nfeProc = asNode(doc.nfeProc);
  const nfe = asNode(nfeProc.NFe ?? doc.NFe);
  const infNFe = asNode(nfe.infNFe);

  if (!infNFe || Object.keys(infNFe).length === 0) {
    throw new Error('Arquivo não é uma NF-e válida (infNFe não encontrado).');
  }

  // Chave: atributo Id = "NFe" + 44 dígitos
  const rawId = txt(infNFe['@_Id']);
  const chave = onlyDigits(rawId.replace(/^NFe/i, ''));
  if (chave.length !== 44) {
    throw new Error('Chave de acesso inválida no XML.');
  }

  const ide = asNode(infNFe.ide);
  const emit = asNode(infNFe.emit);
  const dest = asNode(infNFe.dest);
  const total = asNode(asNode(infNFe.total).ICMSTot);

  const items: ParsedNfeItem[] = asArray(infNFe.det).map(rawDet => {
    const det = asNode(rawDet);
    const prod = asNode(det.prod);
    const gtin = normalizeGtin(prod.cEAN) || normalizeGtin(prod.cEANTrib);
    return {
      cProd: txt(prod.cProd).trim(),
      gtin,
      xProd: txt(prod.xProd).trim(),
      ncm: txt(prod.NCM).trim(),
      cest: txt(prod.CEST).trim(),
      cfop: txt(prod.CFOP).trim(),
      unit: txt(prod.uCom).trim(),
      quantity: toNumber(prod.qCom),
      unitCost: toNumber(prod.vUnCom),
      totalCost: toNumber(prod.vProd),
    };
  });

  if (items.length === 0) {
    throw new Error('NF-e sem itens.');
  }

  return {
    chave,
    modelo: txt(ide.mod).trim(),
    number: txt(ide.nNF).trim(),
    series: txt(ide.serie).trim(),
    issuedAt: txt(ide.dhEmi ?? ide.dEmi).trim(),
    emit: {
      cnpj: onlyDigits(emit.CNPJ ?? emit.CPF),
      name: txt(emit.xNome).trim(),
      ie: txt(emit.IE).trim(),
    },
    dest: {
      cnpj: onlyDigits(dest.CNPJ ?? dest.CPF),
      name: txt(dest.xNome).trim(),
    },
    totalValue: toNumber(total.vNF),
    items,
  };
}
