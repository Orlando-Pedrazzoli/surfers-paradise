import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/services/cloudinary';

export async function POST(request: NextRequest) {
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
    const fileUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await uploadImage(fileUri, folder);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload' },
      { status: 500 },
    );
  }
}
