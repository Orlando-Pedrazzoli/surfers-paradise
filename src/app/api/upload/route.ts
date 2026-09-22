import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/services/cloudinary';
import { requireAdminGuard } from '@/lib/auth/guards';

// Fallback quando o browser (sobretudo Windows) envia file.type vazio
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
};

function resolveMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  // Apenas admin — todos os chamadores estão em /admin/*
  const guard = await requireAdminGuard();
  if (guard.response) return guard.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'surfers-paradise';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum ficheiro enviado' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileUri = `data:${resolveMime(file)};base64,${buffer.toString('base64')}`;

    const result = await uploadImage(fileUri, folder);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Upload error:', error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Erro ao fazer upload';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
