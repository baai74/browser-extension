
#!/bin/bash

# Najpierw zbuduj rozszerzenie
echo "Budowanie rozszerzenia..."
npm run build

# Następnie uruchom testy integracyjne
echo "Uruchamianie testów integracyjnych..."
npm run test:integration

