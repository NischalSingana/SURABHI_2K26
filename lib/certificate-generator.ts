import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

export interface CertificateData {
    name: string;
    college: string | null;
    regNo: string | null;
    branch: string | null;
    eventName: string;
    eventDate: Date;
    certificateId: string;
}

// Template cache (safe to cache — binary file never changes at runtime)
let templateBuffer: Uint8Array | null = null;

const TEMPLATE_URL = "https://pub-2172d3960f064d32b43c4d6ba9a3135d.r2.dev/Participation%20Certificate.pdf";


async function loadTemplate(): Promise<Uint8Array> {
    if (templateBuffer) return templateBuffer;

    // Try local cache first
    const localPath = path.join(process.cwd(), "public", "templates", "participation_certificate.pdf");
    if (fs.existsSync(localPath)) {
        templateBuffer = new Uint8Array(fs.readFileSync(localPath));
        return templateBuffer;
    }

    // Download from R2 and cache locally
    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) throw new Error(`Failed to fetch certificate template: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    templateBuffer = new Uint8Array(arrayBuffer);

    // Save locally for future use
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, Buffer.from(templateBuffer));

    return templateBuffer;
}

function loadFontBytes(filename: string): Uint8Array {
    const fontPath = path.join(process.cwd(), "public", "fonts", filename);
    return new Uint8Array(fs.readFileSync(fontPath));
}

function loadFonts(): { greatVibesFont: Uint8Array; lexendBoldFont: Uint8Array } {
    return {
        greatVibesFont: loadFontBytes("GreatVibes-Regular.ttf"),
        lexendBoldFont: loadFontBytes("Lexend-Bold.ttf"),
    };
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/**
 * Generates a personalised participation certificate PDF by overlaying
 * participant details onto the official Surabhi 2026 certificate template.
 *
 * Coordinates measured precisely from the rendered browser PDF viewer:
 *   - Rendered page: 1240×761 px → maps to PDF 842×595 pt
 *   - Certificate area starts at browser viewport (220, 64)
 *   - x_pt  = (px_x - 220) / 1240 * 842
 *   - y_pt  = 595 - (px_y - 64) / 761 * 595   [pdf-lib origin = bottom-left]
 *
 * Page: LANDSCAPE  842 × 595 pt
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
    const pdfBytes = await loadTemplate();
    const { lexendBoldFont } = loadFonts();

    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pdfDoc.registerFontkit(fontkit);

    const lexend = await pdfDoc.embedFont(lexendBoldFont);   // Lexend Bold — used for ALL fields

    const page = pdfDoc.getPages()[0];
    page.setFont(lexend);
    page.getSize();

    // Ink colour: deep navy matching the template body text
    const inkColor = rgb(0.08, 0.08, 0.30);

    /**
     * Draw text centered within a blank area. Auto-shrinks from preferredSize
     * until the text fits within blankWidth pixels.
     */
    const fitCentered = (
        text: string,
        blankStartX: number,
        blankWidth: number,
        y: number,
        preferredSize: number,
    ) => {
        let size = preferredSize;
        while (size > 8 && lexend.widthOfTextAtSize(text, size) > blankWidth - 10) size--;
        const textW = lexend.widthOfTextAtSize(text, size);
        page.drawText(text, { x: blankStartX + (blankWidth - textW) / 2, y, size, font: lexend, color: inkColor });
    };

    /**
     * Draw left-aligned text; auto-shrinks if it would run past maxRight.
     */
    const fitLeft = (text: string, x: number, maxRight: number, y: number, preferredSize: number) => {
        let size = preferredSize;
        while (size > 7 && lexend.widthOfTextAtSize(text, size) > maxRight - x - 4) size--;
        page.drawText(text, { x, y, size, font: lexend, color: inkColor });
    };

    // ── Coordinates Extremely Calibrated for Perfection ──────────────────
    //
    //  Updates:
    //  - Shifted all fields +3pt higher to clear the physical ink lines.
    //  - Moved Event Date significantly right (X=580) to avoid overlap.
    //
    //  Field              x_start  maxRight   y       Baseline
    //  ─────────────────────────────────────────────────────────────────────
    //  [1] NAME (ctr)     295       785      345      Centered
    //  [2] College        115       320      311      
    //  [3] Reg. No.       525       675      311      
    //  [4] Dept           130       275      277      
    //  [5] Event Name     450       755      277      
    //  [6] Date           580       715      243      
    //  [7] Cert ID        400       580      193      

    const FS = 12;

    // [1] NAME BLANK - UPPERCASE, bigger font, pushed left
    fitCentered(data.name.toUpperCase(), 220, 560, 345, 15);

    // [2] College / University
    fitLeft(data.college || "—", 115, 320, 311, FS);

    // [3] Registration Number
    fitLeft(data.regNo || "—", 525, 675, 311, FS);

    // [4] Department / Branch
    fitLeft(data.branch || "—", 130, 275, 277, FS);

    // [5] Event Name
    fitLeft(data.eventName, 450, 755, 277, FS);

    // [6] Date of event - User requested push leftward a bit (was 570)
    fitLeft(formatDate(data.eventDate), 550, 705, 243, FS);

    // [7] Certificate ID - pushed down + right
    fitLeft(data.certificateId, 425, 605, 163, FS);
    return Buffer.from(await pdfDoc.save());
}
