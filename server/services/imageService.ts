import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface BrandingInfo {
  logoPath?: string;
  theme?: string;
}

export class ImageService {
  static async createSocialImage(text: string, outputPath: string, branding: BrandingInfo = {}) {
    const fullOutputPath = path.join(process.cwd(), outputPath);
    const dir = path.dirname(fullOutputPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const { theme = 'modern', logoPath } = branding;
    
    const width = 1080;
    const height = 1080;
    
    // Theme colors
    let bgColor = 'url(#grad)';
    let textColor = 'white';
    let gradientStops = `
      <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FF3F00;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#D00000;stop-opacity:1" />
    `;

    if (theme === 'minimal') {
      bgColor = '#F8F9FA';
      textColor = '#1C1E21';
      gradientStops = ''; // Not used
    } else if (theme === 'brutalist') {
      bgColor = '#FFE000';
      textColor = '#000000';
    } else if (theme === 'bold') {
      gradientStops = `
        <stop offset="0%" style="stop-color:#6228d7;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ee2a7b;stop-opacity:1" />
      `;
    }
    
    // Dynamic Font size calculation based on text length
    const charCount = text.length;
    let fontSize = 72;
    let lineGap = 90;
    let maxCharsPerLine = 20;

    if (charCount > 150) {
      fontSize = 36;
      lineGap = 45;
      maxCharsPerLine = 40;
    } else if (charCount > 100) {
      fontSize = 48;
      lineGap = 60;
      maxCharsPerLine = 32;
    } else if (charCount > 60) {
      fontSize = 60;
      lineGap = 75;
      maxCharsPerLine = 24;
    }
    
    // Split text for better layout
    const words = text.split(" ");
    let lines: string[] = [];
    let currentLine = "";
    words.forEach(word => {
      if ((currentLine + word).length > maxCharsPerLine) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    });
    if (currentLine) lines.push(currentLine.trim());
    lines = lines.slice(0, 8); // Allow more lines for smaller text

    // Center vertical position
    const totalHeight = lines.length * lineGap;
    const startY = (height / 2) - (totalHeight / 2) + (fontSize / 2);

    const textSvg = lines.map((line, i) => `
      <text x="50%" y="${startY + (i * lineGap)}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="900" fill="${textColor}">
        ${this.escapeXml(line)}
      </text>
    `).join("");

    const svgImage = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            ${gradientStops}
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
            <feOffset in="blur" dx="0" dy="10" result="offsetBlur" />
            <feComponentTransfer in="offsetBlur" result="shadowOpacity">
               <feFuncA type="linear" slope="0.4"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadowOpacity" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="${bgColor}" />
        
        ${theme !== 'minimal' ? `
        <!-- Border Decor -->
        <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="${textColor}" stroke-width="1" stroke-opacity="0.15" />
        <rect x="60" y="60" width="960" height="960" fill="none" stroke="${textColor}" stroke-width="3" stroke-opacity="0.3" />
        ` : ''}
        
        <!-- Top Branded Label -->
        <g opacity="0.9">
          <text x="50%" y="176" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="900" fill="${textColor}" style="text-transform: uppercase; letter-spacing: 5px;">
            TRENDING
          </text>
        </g>
        
        <!-- News Title -->
        <g filter="${theme === 'brutalist' ? '' : 'url(#shadow)'}">
          ${textSvg}
        </g>
        
        <!-- Bottom Branding -->
        <text x="50%" y="950" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="900" fill="${textColor}" style="letter-spacing: 2px;">
          AUTOSOCIAL <tspan fill-opacity="0.6" font-weight="400">|</tspan> PRO
        </text>
      </svg>
    `;

    let image = sharp(Buffer.from(svgImage));
    
    // Add logo overlay if exists
    if (logoPath) {
      const actualLogoPath = path.join(process.cwd(), "data", logoPath.replace(/^\//, ''));
      if (fs.existsSync(actualLogoPath)) {
        const logoBuffer = await sharp(actualLogoPath).resize(150, 150, { fit: 'inside' }).toBuffer();
        image = image.composite([{ input: logoBuffer, top: 100, left: 465 }]);
      }
    }

    await image.png().toFile(fullOutputPath);
    
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
