'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <h2 className='text-2xl font-bold mb-4'>Algo deu errado!</h2>
      <button
        onClick={() => reset()}
        className='px-4 py-2 bg-black text-white rounded hover:bg-gray-800'
      >
        Tentar novamente
      </button>
    </div>
  );
}
