const pdf = require('pdf-parse');
async function test() {
    try {
        console.log('Testing PDFParse class...');
        // Create a dummy PDF buffer or just a small valid PDF if possible.
        // For now let's just see if we can instantiate it.
        const instance = new pdf.PDFParse(Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'));
        console.log('Instance created. Instance keys:', Object.keys(instance));
        // Check for any parser method
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
