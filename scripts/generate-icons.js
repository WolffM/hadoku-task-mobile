const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_ICON = 'www/favicon.svg'; // or .png
const OUTPUT_DIR = 'android/app/src/main/res';

const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function generateIcons() {
  console.log('🦊 Generating Android icons from favicon...\n');

  for (const [folder, size] of Object.entries(ICON_SIZES)) {
    const outputPath = path.join(OUTPUT_DIR, folder, 'ic_launcher.png');
    
    try {
      await sharp(INPUT_ICON)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${folder}/ic_launcher.png (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${folder}:`, error.message);
    }
  }

  console.log('\n🎉 Done! Run `npx cap sync` to apply changes.');
}

generateIcons().catch(console.error);
