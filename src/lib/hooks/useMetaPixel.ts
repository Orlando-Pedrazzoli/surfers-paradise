'use client';

export function useMetaPixel() {
  const track = (event: string, params?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', event, params);
    }
  };

  return {
    trackPageView: () => track('PageView'),
    trackViewContent: (params: { content_name: string; content_ids: string[]; value: number }) => track('ViewContent', params),
    trackAddToCart: (params: { content_ids: string[]; value: number; currency?: string }) => track('AddToCart', { currency: 'BRL', ...params }),
    trackPurchase: (params: { value: number; content_ids: string[] }) => track('Purchase', { currency: 'BRL', ...params }),
    trackSearch: (query: string) => track('Search', { search_string: query }),
  };
}
