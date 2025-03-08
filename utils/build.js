
// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  config = require('../webpack.config'),
  fs = require('fs-extra'),
  path = require('path');

// Czyszczenie katalogu build przed budowaniem
console.log('Czyszczenie katalogu build przed budowaniem...');
try {
  fs.removeSync(path.join(__dirname, '..', 'build'));
  console.log('Katalog build wyczyszczony pomyślnie');
} catch (err) {
  console.error('Błąd podczas czyszczenia katalogu build:', err);
}

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

console.log('Rozpoczęcie budowania projektu...');
webpack(config, function (err) {
  if (err) {
    console.error('Błąd podczas budowania:', err);
    throw err;
  }
  console.log('Projekt zbudowany pomyślnie! Gotowy do instalacji w przeglądarce.');
  console.log('Aby zainstalować rozszerzenie:');
  console.log('1. Otwórz Chrome i przejdź do chrome://extensions/');
  console.log('2. Włącz "Tryb dewelopera" w prawym górnym rogu');
  console.log('3. Kliknij "Załaduj rozpakowane" i wybierz katalog "build"');
});
