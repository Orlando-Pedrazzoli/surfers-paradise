export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min atr\u00e1s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atr\u00e1s`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atr\u00e1s`;
  return formatDate(date);
}
