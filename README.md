# SEW Mailmanager – Outlook-knop (fase 1: lezen + opslaan)

Versie 0.5.1 · 25 november 2026 · gebouwd op contract v1.2 (claude/sew-dms-contract.md) · eigenaar SEW Energy, beheer ICT

Een Outlook-invoegtoepassing (web add-in). Werkt in nieuwe Outlook, Outlook op het web en klassieke Outlook (recente versie). In een geopende mail staat de knop **Opslaan in DMS**; die opent het paneel "SEW DMS".

## Wat de knop doet
1. Kijkt of de mail al in het DMS staat (op Bericht-ID, in alle bibliotheken Correspondentie <jaar> en, als de gebruiker er toegang toe heeft, Vertrouwelijk). Zo ja: "Opgeslagen bij 230459 (knop, datum, naam)" met een link, en de optie om hem ook bij een ander project of andere order te zetten (regel in de lijst Koppelingen, geen kopie).
2. Zo nee: maximaal drie voorstellen met de reden erbij (nummer in onderwerp, klantreferentie, klant-PO, maildomein van de klant uit het register Projecten, nummer in bijlagenaam of tekst, laatst gekozen), plus vrije invoer van project, order en offerte. Staan de registers Projecten en Offertes en orders op de site, dan toont de knop alleen nummers die bestaan, vult hij bij een order het project in en weigert hij een order die bij een ander project hoort. Zonder registers: alleen op formaat. Vinkjes "Dit gesprek volgen" en "Vertrouwelijk".
3. Opslaan haalt de complete mail (.eml, met bijlagen) op met de rechten van de gebruiker, zet hem in Correspondentie <jaar van het project> (of in Vertrouwelijk als dat is aangevinkt) en vult de velden uit contract v1: o.a. Omschrijving = onderwerp, Binnengekomen via = Mail, Opgeslagen via = Knop, Labelstatus = Bevestigd. Bij "Dit gesprek volgen" komt het gesprek in de lijst Gesprekken (wordt pas in fase 3 gebruikt).
4. Ontdubbelen: vlak voor het opslaan wordt nog een keer gekeken; weigert de unieke kolom alsnog (collega was net eerder), dan probeert de knop de upload weg te halen. Gewone gebruikers mogen niet verwijderen; dan krijgt het lege bestand de titel "DUBBEL – wordt opgeruimd" en Labelstatus Te labelen, en ruimt de controleflow het op.

Werkt ook voor mail in een gedeelde mailbox (sales@), mits de gebruiker daar toegang toe heeft.

## Bestanden
| Bestand | Wat |
|---|---|
| `src/config.js` | Alle instellingen en de veldnamen van het contract. Alleen hier aanpassen. |
| `src/graph.js` | Inloggen (Nested App Authentication) en Microsoft Graph |
| `src/rules.js` | Herkenning (voorstellen), bestandsnaam, richting, velden |
| `src/taskpane.js` | Het paneel |
| `public/` | HTML, CSS, iconen |
| `manifest.template.xml` | Manifest; `{{HOST}}` wordt bij het bouwen ingevuld |

## Waar het staat
Tot de verhuizing draait de knop nog op GitHub Pages (https://sewenergy.github.io/sew-mailmanager/, gebouwd door .github/workflows/pages.yml). Daarna:
- Bron: SharePoint-bibliotheek op SEW Start (alleen beheer). Niet meer op GitHub.
- Knop: static website in een Azure Storage-account van SEW (container `$web`). Adres zonder eigen domein, zodat het manifest bij een volgende wijziging niet hoeft te veranderen.
- Map e-mail-onderdeel/: sew-mail.js voor het scherm E-mail in de DMS-schil (staat op de site in SiteAssets/mailmanager).

## Bouwen en publiceren
1. `npm ci`
2. `ADDIN_HOST=<adres van de static website, zonder https://> node build.mjs` → map `dist/`. De build zet `?v=<versie>` achter de eigen scripts en css; verhoog daarom `version` in `src/config.js` bij elke wijziging.
3. Inhoud van `dist/` (zonder manifest.xml) uploaden naar de container `$web` (Azure-portal, gewoon SEW-account met de rol Storage Blob Data Contributor; niet het admin-account).
4. Alleen als het manifest verandert: `dist/manifest.xml` uploaden via M365-beheercentrum → Instellingen → Geïntegreerde apps. Doorvoeren duurt uren. De vraag bij versturen werkt alleen bij uitrol via Geïntegreerde apps, niet bij handmatig installeren.
5. Dezelfde dag een kopie van de bron in de bronbibliotheek zetten.

## Voorwaarden (beheer)
- App-registratie "SEW DMS Mail", type single-page application. Redirect-URI's: `brk-multihub://<adres>` en `https://<adres>/taskpane.html` (adres van de static website). Gedelegeerd: User.Read, Mail.Read, Mail.Read.Shared, Sites.Selected. Admin consent.
- Sites.Selected: de app krijgt `write` op alleen de DMS-testsite (Graph: `POST /sites/{site-id}/permissions`). Gebruikers hebben daarnaast zelf rechten op de site nodig.
- Op de testsite (DMS-chat): bibliotheken `Correspondentie <jaar>` en `Vertrouwelijk` met inhoudstype SEW E-mail uit contract v1; `Mail_InternetMessageId` geïndexeerd en uniek (in beide). Lijst `Gesprekken` met Title (gesprek-ID), SEW_Project, SEW_Order, Conv_StartedBy (tekst), Conv_LastMail (datum/tijd), Conv_Follow (ja/nee). Lijst `Koppelingen` met Title (sleutel), Link_ListId, Link_ItemId (tekst), SEW_Project (geïndexeerd), SEW_Order. Registers `Projecten` (sleutel SEW_Project) en `Offertes en orders` (SEW_Number, SEW_Kind, SEW_Project), zoals contract v1.1. Namen in Gesprekken en Koppelingen zijn een voorstel aan de DMS-chat.
- Wie Vertrouwelijk wil aanvinken, moet in DMS-Vertrouwelijk zitten.

## Testpunten pilot
1. Mail met projectnummer in het onderwerp → voorstel bovenaan, opslaan, staat in Correspondentie 20xx met juiste velden.
2. Dezelfde mail nog een keer openen → "Opgeslagen bij …".
3. Zelfde mail bij een collega (die hem ook ontving) → ook "Opgeslagen bij …" (ontdubbelen op Bericht-ID).
4. Ook bij een tweede project zetten → één bestand, regel in Koppelingen.
4b. Vertrouwelijk aanvinken → mail in bibliotheek Vertrouwelijk; een collega buiten DMS-Vertrouwelijk ziet "Nog niet opgeslagen" (bekend open punt, zie contract-afwijkingen).
4c. Order invullen die bij een ander project hoort → knop weigert.
5. Mail met grote bijlage (> 4 MB, bijv. tekeningpakket) → opslaan lukt (upload in delen).
6. Mail uit sales@ → opslaan lukt.
7. Interne mail → Richting = Intern. Uitgaande mail (uit Verzonden items) → Richting = Uit.
8. De .eml openen vanuit SharePoint → opent in Outlook met bijlagen.
9. Zoeken in SharePoint op een woord uit de mailtekst → gevonden? (bepaalt of er een tekstkolom bij moet)
10. Klassieke Outlook, nieuwe Outlook en Outlook op het web; een pilotgebruiker op zijn eigen pc.

## Bewust nog niet in fase 1
Soort (termenset, zie afwijkingen contract), Opgeslagen door (persoonsveld, idem), Outlook-categorie "In DMS" (vraagt extra rechten), afzenderdomein → klant, BCC bij versturen (fase 2), gesprek volgt zichzelf (fase 3), meerdere mails tegelijk.

## Getest op de testsite (19-11, via de browser, zonder Outlook)
Twee echte mails (één intern, één uitgaand naar een klant) als nagebouwde .eml (zonder bijlagen) in Correspondentie 2023, met de veldlogica van de knop: velden, inhoudstype SEW E-mail, Richting, Domeinen en Verzonden kloppen; een tweede kopie wordt geweigerd (SPDuplicateValuesFoundException).
