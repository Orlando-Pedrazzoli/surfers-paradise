'use client';

interface ShareProductProps {
  url: string;
  title: string;
}

export default function ShareProduct({ url, title }: ShareProductProps) {
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copiado!');
    }
  };

  return (
    <button onClick={share} className="text-sm text-gray-500 hover:text-[#FF6600] transition-colors">
      Compartilhar
    </button>
  );
}
