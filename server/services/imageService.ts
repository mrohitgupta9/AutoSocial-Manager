import sharp from "sharp";
import path from "path";
import fs from "fs";

export class ImageService {
  static async createSocialImage(text: string, outputPath: string) {
    const fullOutputPath = path.join(process.cwd(), outputPath);
    const dir = path.dirname(fullOutputPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Creating a beautiful background image with text overlay using sharp
    // We'll create an SVG and render it to PNG
    const width = 1080;
    const height = 1080;
    
    // Split text for better layout
    const words = text.split(" ");
    let lines: string[] = [];
    let currentLine = "";
    words.forEach(word => {
      if ((currentLine + word).length > 25) {
        lines.push(currentLine);
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    });
    lines.push(currentLine);
    lines = lines.slice(0, 5); // Max 5 lines

    const textSvg = lines.map((line, i) => `
      <text x="50%" y="${450 + (i * 80)}" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="bold" fill="white">
        ${this.escapeXml(line)}
      </text>
    `).join("");

    const svgImage = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FF6321;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FF4E00;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <rect x="50" y="50" width="980" height="980" fill="none" stroke="white" stroke-width="2" stroke-opacity="0.2" />
        <text x="50%" y="200" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="600" fill="white" opacity="0.8" style="text-transform: uppercase; letter-spacing: 4px;">
          TRENDING NOW
        </text>
        ${textSvg}
        <text x="50%" y="950" text-anchor="middle" font-family="sans-serif" font-size="20" fill="white" opacity="0.6">
          Powered by AutoSocial Manager
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svgImage))
      .png()
      .toFile(fullOutputPath);
    
    return outputPath;
  }

  private static escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
      return c;
    });
  }
}
