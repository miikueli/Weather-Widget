# MiikuLive IRL Overlay

Kevyt selainpohjainen IRL-statuspalkki:
- paikkakunta
- päivämäärä ja aika
- sää ja lämpötila
- nopeus km/h
- akun varaus, jos selain tukee sitä
- maan lippu

## Testaus

Avaa ensin:

`index.html`

tai GitHub Pages -julkaisun jälkeen:

`https://SINUNNIMI.github.io/REPO-NIMI/?demo=true`

## Hyödylliset osoiteparametrit

Demo ilman GPS:ää:

`?demo=true`

Käsin valittu kaupunki:

`?city=Tampere`

Käsin valittu kaupunki ja maa:

`?city=Pello&country=FI`

Pienempi palkki:

`?size=small`

Vasen alanurkka:

`?position=left`

Yläreuna:

`?position=top`

Ilman akkua:

`?battery=false`

Ilman säätä:

`?weather=false`

GPS pois:

`?gps=false`

Esimerkki:

`https://SINUNNIMI.github.io/REPO-NIMI/?size=small&position=left`

## GitHub Pages

1. Luo uusi GitHub-repo.
2. Lataa nämä tiedostot repon juureen:
   - index.html
   - style.css
   - script.js
3. Mene repoasetuksiin:
   Settings → Pages
4. Source:
   Deploy from a branch
5. Branch:
   main
6. Folder:
   /root
7. Odota hetki.
8. GitHub antaa osoitteen tyyliin:
   `https://SINUNNIMI.github.io/REPO-NIMI/`

## IRL Pro

Lisää Browser Layeriksi GitHub Pages -osoite.

Muista antaa IRL Prolle Androidista sijaintilupa:
Asetukset → Sovellukset → IRL Pro → Käyttöoikeudet → Sijainti.

Jos GPS ei toimi IRL Pron browser layerissa, käytä käsikaupunkia:

`https://SINUNNIMI.github.io/REPO-NIMI/?city=Tampere`
