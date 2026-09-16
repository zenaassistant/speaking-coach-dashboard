// pdf-parse@1.x ships no types. Minimal ambient declaration for the one
// function we call — real return shape has more fields (numpages, info,
// metadata, version) but `.text` is all this app uses.
declare module 'pdf-parse' {
  function pdfParse(buffer: Buffer): Promise<{ text: string }>;
  export default pdfParse;
}
