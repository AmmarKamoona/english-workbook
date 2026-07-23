// Copy the right app_yN + shared assets into www/ before Capacitor builds
// Usage: node prepare.js y3   OR   node prepare.js y5
const fs = require('fs');
const path = require('path');

const year = process.argv[2];
if (!['y3', 'y5'].includes(year)) {
    console.error('Usage: node prepare.js y3   OR   node prepare.js y5');
    process.exit(1);
}

const SRC = path.join(__dirname, 'workbook_app_build');  // Point to your PWA source
const WWW = path.join(__dirname, 'www');

// Clean and recreate www/
if (fs.existsSync(WWW)) fs.rmSync(WWW, { recursive: true });
fs.mkdirSync(WWW, { recursive: true });

function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

// Copy the app_yN folder contents to www/ root (so index.html is at www/index.html)
copyDir(path.join(SRC, `app_${year}`), WWW);

// Copy shared common/ folder
copyDir(path.join(SRC, 'common'), path.join(WWW, 'common'));

// Copy the year's content JSON
fs.copyFileSync(
    path.join(SRC, `content_${year}.json`),
    path.join(WWW, `content_${year}.json`)
);

// Rewrite index.html paths: ../common -> ./common, ../content_yN.json -> ./content_yN.json
const idx = path.join(WWW, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
html = html.replace(/\.\.\/common\//g, './common/');
html = html.replace(/\.\.\/content_/g, './content_');
fs.writeFileSync(idx, html);

// Rewrite sw.js paths the same way
const sw = path.join(WWW, 'sw.js');
if (fs.existsSync(sw)) {
    let jsSw = fs.readFileSync(sw, 'utf8');
    jsSw = jsSw.replace(/\.\.\/common\//g, './common/');
    jsSw = jsSw.replace(/\.\.\/content_/g, './content_');
    fs.writeFileSync(sw, jsSw);
}

// Rewrite app.js -> when running under Capacitor, register SW relative to root
// (already correct since sw.js is at ./sw.js from index.html)

// Update Capacitor config appId + appName per year
const cfgPath = path.join(__dirname, 'capacitor.config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
cfg.appId = `com.ammarkamoona.workbook.${year}`;
cfg.appName = year === 'y3' ? 'Year 3 English' : 'Year 5 English';
cfg.android.backgroundColor = year === 'y3' ? '#FFF9F0' : '#F5F8FA';
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

console.log(`Prepared www/ for ${year}. appId=${cfg.appId}`);
