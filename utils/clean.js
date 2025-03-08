
// Skrypt do czyszczenia niepotrzebnych plików i uporządkowania katalogów
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const fs = require('fs-extra');
const path = require('path');

// Czyszczenie katalogu build
console.log('Czyszczenie katalogu build...');
try {
  fs.removeSync(path.join(__dirname, '..', 'build'));
  console.log('Katalog build wyczyszczony pomyślnie');
} catch (err) {
  console.error('Błąd podczas czyszczenia katalogu build:', err);
}

// Usuwanie plików tymczasowych
console.log('Usuwanie plików tymczasowych...');
[
  '.DS_Store',
  'npm-debug.log',
  'yarn-error.log',
  'yarn-debug.log',
].forEach(tempFile => {
  try {
    const filePath = path.join(__dirname, '..', tempFile);
    if (fs.existsSync(filePath)) {
      fs.removeSync(filePath);
      console.log(`Usunięto plik: ${tempFile}`);
    }
  } catch (err) {
    console.error(`Błąd podczas usuwania pliku ${tempFile}:`, err);
  }
});

// Organizacja katalogu src
console.log('Porządkowanie katalogu src...');
try {
  // Upewnienie się, że mamy odpowiednie podkatalogi
  const directories = [
    'src/common',
    'src/helpers',
    'src/pages',
    'src/state',
    'src/assets/img',
    'src/assets/css',
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Utworzono katalog: ${dir}`);
    }
  });
  
  console.log('Porządkowanie zakończone pomyślnie');
} catch (err) {
  console.error('Błąd podczas porządkowania katalogu src:', err);
}

console.log('Wszystkie operacje zakończone. Możesz teraz zbudować projekt używając "npm run build"');
