import { generateCertificatePDF } from './lib/certificate-generator';
import fs from 'fs';
import path from 'path';

async function main() {
    const data = {
        name: "NISCHAL SINGANA",
        college: "VNR VJIET",
        regNo: "22071A0512",
        branch: "Computer Science",
        eventName: "Voice of Raaga",
        eventDate: new Date("2026-03-04"),
        certificateId: "CERT-12345",
    };

    try {
        const pdfBuffer = await generateCertificatePDF(data);
        const outPath = path.join(process.cwd(), 'test-output.pdf');
        fs.writeFileSync(outPath, pdfBuffer);
        console.log("PDF saved to", outPath);
    } catch (e) {
        console.error(e);
    }
}

main();
