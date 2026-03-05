const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const oldString = 'https://project-agm.onrender.com';
const newString = 'https://project-agm.onrender.com';

function replaceInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldString)) {
        const result = content.split(oldString).join(newString);
        fs.writeFileSync(filePath, result, 'utf8');
        console.log(`Replaced in ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'android' || file === 'uploads') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
            replaceInFile(filePath);
        }
    }
}

processDirectory(directoryPath);
console.log('URL replacement complete.');
