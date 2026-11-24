// src/lib/utils/adminProductsReturn.ts
// Memoriza onde o admin estava na lista de produtos (filtros, busca e
// página) para voltar ao mesmo ponto depois de editar/criar um produto.
// Usa sessionStorage: vale só para a aba atual e some ao fechar.

const LIST_URL_KEY = 'sp-admin-products-list-url';
const LAST_EDITED_KEY = 'sp-admin-products-last-edited';
const LIST_PATH = '/admin/produtos';

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage indisponível (modo privado, etc.) — ignora
  }
}

/** Chamado pela lista sempre que os filtros/página mudam. */
export function rememberProductsListUrl(search: string) {
  write(LIST_URL_KEY, search ? `${LIST_PATH}?${search}` : LIST_PATH);
}

/** URL da lista como o admin a deixou (ou a lista sem filtros). */
export function getProductsListUrl(): string {
  const saved = read(LIST_URL_KEY);
  // Só aceita caminhos da própria lista
  if (saved && (saved === LIST_PATH || saved.startsWith(`${LIST_PATH}?`))) {
    return saved;
  }
  return LIST_PATH;
}

/** Marca o produto recém-gravado para a lista rolar até ele. */
export function rememberLastEditedProduct(id: string) {
  write(LAST_EDITED_KEY, id);
}

/** Lê e limpa o produto recém-gravado (uso único). */
export function consumeLastEditedProduct(): string | null {
  const id = read(LAST_EDITED_KEY);
  if (id) write(LAST_EDITED_KEY, null);
  return id;
}
