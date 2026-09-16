import { NextRequest, NextResponse } from 'next/server';

// Extracts plain text from an uploaded PDF or DOCX so it can be scored the
// same way as a pasted transcript. Runs server-side because both libraries
// need real Node APIs (buffers, zlib for docx) that don't work in the
// browser. .txt/.md files never hit this route — the upload form reads
// those directly client-side, no round trip needed.
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (name.endsWith('.pdf')) {
      // pdf-parse v1 is a plain CJS `module.exports = fn` — depending on how
      // the bundler interops that, it lands as either the module itself or
      // `.default`. Handle both rather than assume one.
      const mod: any = await import('pdf-parse');
      const pdfParse = typeof mod === 'function' ? mod : (mod.default ?? mod);
      const data = await pdfParse(buffer);
      return NextResponse.json({ text: data.text });
    }
    if (name.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value });
    }
    return NextResponse.json({ error: `Unsupported file type: ${file.name}. Use .txt, .md, .pdf, or .docx.` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: `Could not extract text from ${file.name}: ${err.message}` }, { status: 500 });
  }
}
