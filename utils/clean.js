
const fs = require('fs-extra');
const path = require('path');

// Ścieżki do katalogów
const buildDir = path.join(__dirname, '../build');
const srcDir = path.join(__dirname, '../src');
const assetsDir = path.join(srcDir, 'assets');

// Funkcja do czyszczenia katalogu build
const cleanBuildDirectory = async () => {
  console.log('Czyszczenie katalogu build...');
  try {
    await fs.emptyDir(buildDir);
    console.log('Katalog build wyczyszczony pomyślnie');
  } catch (error) {
    console.error('Błąd podczas czyszczenia katalogu build:', error);
  }
};

// Funkcja do usuwania plików tymczasowych
const cleanTempFiles = async () => {
  console.log('Usuwanie plików tymczasowych...');
  const tempPatterns = [
    '**/.DS_Store',
    '**/*.log',
    '**/*.tmp'
  ];

  try {
    for (const pattern of tempPatterns) {
      // Implementacja usuwania plików - można użyć biblioteki glob i fs
    }
  } catch (error) {
    console.error('Błąd podczas usuwania plików tymczasowych:', error);
  }
};

// Funkcja do porządkowania struktury katalogów
const organizeDirectories = async () => {
  console.log('Porządkowanie katalogu src...');
  
  // Upewnij się, że wszystkie potrzebne katalogi istnieją
  const directories = [
    path.join(assetsDir, 'css'),
    path.join(assetsDir, 'img'),
    path.join(assetsDir, 'js'),
    path.join(srcDir, 'components'),
    path.join(srcDir, 'pages/Content'),
    path.join(srcDir, 'pages/Background'),
    path.join(srcDir, 'pages/Popup'),
    path.join(srcDir, 'pages/Devtools'),
    path.join(srcDir, 'pages/Panel'),
    path.join(srcDir, 'pages/Options'),
    path.join(srcDir, 'pages/Newtab'),
    path.join(srcDir, 'services'),
    path.join(srcDir, 'utils')
  ];

  try {
    for (const dir of directories) {
      await fs.ensureDir(dir);
      console.log(`Utworzono katalog: ${dir}`);
    }
    console.log('Porządkowanie zakończone pomyślnie');
  } catch (error) {
    console.error('Błąd podczas porządkowania katalogów:', error);
  }
};

// Główna funkcja
const main = async () => {
  await cleanBuildDirectory();
  console.log('Usuwanie plików tymczasowych...');
  await cleanTempFiles();
  await organizeDirectories();
  console.log('Wszystkie operacje zakończone. Możesz teraz zbudować projekt używając "npm run build"');
};

main();
