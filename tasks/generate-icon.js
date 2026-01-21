#!/usr/bin/env node

/**
 * Generate icon.ico from icon.png with all required sizes
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const iconPngPath = path.join(__dirname, '../build/icon.png');
const iconIcoPath = path.join(__dirname, '../build/icon.ico');

async function generateIcon() {
  try {
    // Read the PNG file
    const input = sharp(iconPngPath);
    const metadata = await input.metadata();
    
    console.log(`Source icon dimensions: ${metadata.width}x${metadata.height}`);
    
    // Generate all required sizes for Windows ICO
    const sizes = [16, 24, 32, 48, 64, 128, 256];
    const buffers = await Promise.all(
      sizes.map(size => 
        input.clone()
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()
      )
    );
    
    // Generate ICO file with all sizes
    const icoBuffer = await toIco(buffers);
    
    // Write the ICO file
    fs.writeFileSync(iconIcoPath, icoBuffer);
    
    console.log(`Successfully generated ${iconIcoPath} with sizes: ${sizes.join(', ')}`);
  } catch (error) {
    console.error('Error generating icon:', error);
    process.exit(1);
  }
}

generateIcon();
