import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

async function main() {
    const pdfBytes = fs.readFileSync(path.join(process.cwd(), "public/templates/participation_certificate.pdf"));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    
    // Draw 10pt grid
    for (let x = 0; x <= width; x += 20) {
        const isMajor = x % 100 === 0;
        page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: rgb(1,0,0), thickness: isMajor ? 1 : 0.2 });
        if (isMajor) page.drawText(x.toString(), { x, y: height - 20, size: 8, color: rgb(1,0,0) });
    }
    for (let y = 0; y <= height; y += 20) {
        const isMajor = y % 100 === 0;
        page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: rgb(0,0,1), thickness: isMajor ? 1 : 0.2 });
        if (isMajor) page.drawText(y.toString(), { x: 20, y, size: 8, color: rgb(0,0,1) });
    }
    
    // Test text inputs at estimated positions
    const testText = (text: string, x: number, y: number) => {
        page.drawText(text, { x, y, size: 12, color: rgb(0,0,0) });
    };

    // rough guess based on standard spacing
    testText("NISCHAL SINGANA", 370, 310); // name
    testText("VNR VJIET", 220, 275); // college
    testText("22071A0512", 580, 275); // reg no
    testText("Computer Science", 250, 240); // branch
    testText("Voice of Raaga", 550, 240); // event
    testText("4 March 2026", 530, 205); // date
    testText("CERT-12345", 480, 140); // cert id

    fs.writeFileSync("grid.pdf", await pdfDoc.save());
    console.log("Created grid.pdf");
}
main();
