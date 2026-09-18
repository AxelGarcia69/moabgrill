# Moab Grill — sitio web

Sitio 100% estático (HTML + CSS + JS vanilla). No necesita build ni npm: se sube tal cual al hosting.

## Estructura

```
index.html            Home
menu.html             Hub de menús
Breakfast.html        Visor del PDF de desayunos
LunchDinner.html      Visor del PDF de lunch & dinner
Desserts.html         Visor del PDF de postres (Drinks & Desserts, pág. 2)
Beverages.html        Visor del PDF de bebidas (Drinks & Desserts, pág. 2)
css/styles.css        Todo el diseño
js/script.js          Todas las interacciones (GSAP por CDN)
js/pdf-viewer.js      Visor de PDF (pdf.js por CDN)
IMG/                  Fotos, logo, favicons (.ico y PNG), portada OG (solo lo que se usa)
documents/            PDFs de los menús (Menu_Breakfast, Menu_LunchDinner, Menu_DrinksDesserts)
robots.txt            Permite indexar y apunta al sitemap (debe ir en la raíz)
sitemap.xml           Las 6 páginas + los 3 PDF (debe ir en la raíz)
```

**Subir al hosting**: todo lo anterior. **NO subir**: `CLAUDE.md`, `README.md` ni la carpeta `../_archivo/`
(respaldo del sitio original, páginas retiradas e imágenes sin usar).

## Actualizar un PDF de menú

1. Copiar el PDF nuevo a `../_archivo/_original_backup/pdf/` con el nombre canónico (`Menu_Breakfast.pdf`, `Menu_LunchDinner.pdf` o `Menu_DrinksDesserts.pdf`).
2. Comprimirlo con el script `compress_pdfs4.py` (pypdf + Pillow), que lo deja en `documents/`; o copiarlo directo a `documents/` si pesa menos de ~3 MB.
3. En la página correspondiente, cambiar la fecha de `?v=AAAAMMDD` en los 3 enlaces al PDF para que el navegador no muestre el viejo.

## Dominio

Canonical, Open Graph y sitemap apuntan a `https://www.moabgrill.com`. Si el sitio se publica en otro dominio, buscar y reemplazar esa URL en las 6 páginas, `robots.txt` y `sitemap.xml`.
