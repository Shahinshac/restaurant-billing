const fs = require('fs');
const path = require('path');

function replaceIdInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Specifically look for item._id or mapped _id variables typical in Mongo->Frontend flows
  const updatedContent = content.replace(/\._id/g, '.id');
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceIdInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'frontend/src/app'));
