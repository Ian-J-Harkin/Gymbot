const pdf = require('pdf-parse');
const fs = require('fs');

// We need a PDF file to test with. I'll just assume there's one or download one.
// But I can't easily download. I'll tell the user to check if the PDF is readable.

async function testPdfDetail() {
    try {
        const dataBuffer = fs.readFileSync('Iron_Oasis_Handbook.pdf');
        const data = await pdf(dataBuffer);
        console.log('--- PDF Parse Result ---');
        console.log('Text Length:', data.text.length);
        console.log('Text:', JSON.stringify(data.text));
        console.log('Metadata:', data.metadata);
        console.log('Version:', data.version);
    } catch (err) {
        console.error('Error:', err);
    }
}

// testPdfDetail();
// Not running yet because I need the file.
