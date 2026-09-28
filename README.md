# piensaenpixel — web de fotografía

Portfolio fotográfico estático (HTML, CSS y JavaScript sin dependencias ni build) pensado para publicarse en GitHub Pages.

**Web:** https://piensaenpixel.es/

## Qué tiene

- Estilo inspirado en la plantilla Gordian de Framer: blanco y negro, títulos en Geist negrita y mayúsculas, todo lo demás en Geist Mono en mayúsculas, tablas de datos etiqueta/valor, secciones numeradas (S01, S02…), fotos a todo el ancho con filetes finos y barra fija inferior con «MENU».
- Tema claro por defecto; el oscuro se activa desde el menú («Tema») y se recuerda la elección.
- Portada: foto a pantalla completa con texto en negrita, fila «Social / Localización» con reloj en directo, Sobre mí (S01), Series (S02), Selección de fotos grandes (S03) y Contacto (S04).
- Cuatro series: **Paisaje**, **Luna**, **Drone** y **Nocturnas**, con galería filtrable en vista grande (una debajo de otra) o rejilla.
- Página por fotografía con título grande, ficha etiqueta/valor (serie, lugar, fecha, cámara, objetivo, focal, apertura, velocidad, ISO), enlace «Copia: quiero esta foto» al formulario, imagen a todo el ancho, descripción, mapa y navegación anterior/siguiente.
- Animaciones: pantalla de carga (una vez por visita), fundido suave entre páginas, títulos que entran palabra a palabra, fotos que se descubren al hacer scroll, parallax en las listas y cursor personalizado con «Ver». Todo se desactiva con «reducir movimiento».
- Panel de administración en `/admin` (Sveltia CMS) y web de staging en `/staging/`.
- Toda la interfaz está en inglés. Navegación por hash (`#/gallery/moon`, `#/photo/id`...), así que funciona en GitHub Pages sin configuración extra.

## Estructura publicada

- `piensaenpixel.es/` (o `piensaenpixel.github.io/personal/` mientras no apunte el dominio): portada personal, generada de `content/landing.json` (editable en el panel: Settings → Home page).
- `/photos/`: el portfolio fotográfico.
- `/staging/` y `/staging/photos/`: lo mismo con los cambios pendientes de publicar.
- El dominio se activa poniendo `piensaenpixel.es` en Settings → Home page → Custom domain (genera el archivo CNAME al publicar). Antes hay que crear los registros DNS en el proveedor del dominio: cuatro registros A para `piensaenpixel.es` a 185.199.108.153, 185.199.109.153, 185.199.110.153 y 185.199.111.153, y un CNAME de `www` a `piensaenpixel.github.io`.

## Cómo se gestiona el contenido

Todo el contenido vive en la carpeta `content/`, en archivos JSON pequeños que edita el panel de administración:

| Qué | Dónde |
|---|---|
| Datos del sitio (nombre, email, textos de About, tamaños de copia…) | `content/site.json` |
| Series | `content/series/<id>.json` |
| Fotografías | `content/photos/<id>.json` (la imagen en `img/fotos/`) |
| Cursos | `content/courses/<id>.json` |
| Fotos de Unsplash descartadas | `content/excluded-unsplash.json` |

Al publicar, el script `scripts/build_data.py` junta esos archivos en `js/data.js` (calculando el tamaño de cada imagen) y `scripts/build_site.py` monta la web y reduce las imágenes grandes a 2000 px. En local: `python3 scripts/build_data.py` y luego `python3 -m http.server 8080`.

## Panel de administración (CMS)

El panel está en **https://piensaenpixel.es/photos/admin/** (con el dominio, `https://piensaenpixel.es/photos/admin/`) y usa [Sveltia CMS](https://github.com/sveltia/sveltia-cms). Entras con tu cuenta de GitHub y editas fotos, series, cursos y ajustes con formularios; al guardar, hace el commit en la rama `staging`.

**Flujo de trabajo**

1. Editas en el panel → se guarda en `staging` → en un par de minutos lo ves en **https://piensaenpixel.es/staging/photos/** (lleva la marca «Staging» en la barra y los buscadores no la indexan).
2. Cuando te guste, publicas: en GitHub, pestaña **Actions → «Publicar staging en la web» → Run workflow**. Eso pasa los cambios a `main` y regenera la web pública.

**Configuración inicial (una sola vez, unos 10 minutos)**

El panel necesita un pequeño servicio de login para GitHub. Es gratuito:

1. Crea una cuenta en [Cloudflare](https://dash.cloudflare.com/sign-up) si no la tienes.
2. Entra en https://github.com/sveltia/sveltia-cms-auth y pulsa el botón **Deploy to Cloudflare Workers**. Al terminar tendrás una URL del tipo `https://sveltia-cms-auth.TU-USUARIO.workers.dev`.
3. En GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**. Rellena:
   - Application name: `piensaenpixel admin`
   - Homepage URL: `https://piensaenpixel.es/`
   - Authorization callback URL: `https://sveltia-cms-auth.TU-USUARIO.workers.dev/callback`
   Guarda, copia el **Client ID** y genera un **Client secret** (cópialo también).
4. En Cloudflare, abre el worker → **Settings → Variables and Secrets** y añade:
   - `GITHUB_CLIENT_ID` = el Client ID
   - `GITHUB_CLIENT_SECRET` = el Client secret
   - `ALLOWED_DOMAINS` = `piensaenpixel.github.io`
5. La URL del worker (`https://sveltia-cms-auth.piensaenpixel.workers.dev`) ya está en `admin/config.yml`.

A partir de ahí, https://piensaenpixel.es/admin/ te pedirá entrar con GitHub y ya está.

## Importar fotos desde Unsplash

El workflow **Importar fotos de Unsplash** (Actions → Run workflow, eligiendo la rama `staging`) descarga con la API las fotos más populares del usuario, sus datos EXIF y su localización, guarda la imagen en `img/fotos/` y crea la ficha en `content/photos/`. Cómo se comporta:

- Las fotos que ya tienen ficha (por su `unsplashId`) no se tocan, así que puedes editarlas en el panel sin miedo.
- Las fotos listadas en `content/excluded-unsplash.json` se ignoran. Para descartar una, borra su ficha en el panel y añade su `unsplashId` a esa lista.
- Las nuevas llegan con título y descripción automáticos en inglés y serie estimada por palabras clave: revísalas en el panel.
- La clave se pasa como entrada del workflow o, mejor, como secret del repositorio llamado `UNSPLASH_ACCESS_KEY`. Las apps de Unsplash en modo demo permiten 50 peticiones por hora, unas 45 fotos por ejecución.

## Foto en la pared (carrusel)

Cada foto tiene un campo opcional **On the wall** en el panel: una segunda imagen con la copia enmarcada en una habitación. Si está, la página de la foto muestra un carrusel de dos imágenes: pasando el ratón por la mitad derecha aparece «Next» y al pulsar se ve el montaje; en el montaje, la mitad izquierda vuelve con «Previous». En móvil, tocar o deslizar. Los dos montajes que hay ahora son de ejemplo, generados automáticamente.

## Cursos y tamaños de copia

Los cursos se editan en el panel (colección Courses) y aparecen en la portada, en `#/courses` y como opción «Book a course» del formulario. Si no hay ninguno, la sección desaparece.

Los tamaños de copia por defecto están en Settings → Default print sizes (ancho × alto para fotos horizontales; en las verticales se invierten solos). Cada foto puede tener los suyos en su campo «Print sizes».

## Mapa

Usa [Leaflet](https://leafletjs.com) con el mapa gris claro de Esri (sin clave de API) y OpenStreetMap como reserva automática si el primero falla. Si una foto no tiene `location.lat` y `location.lng`, simplemente no se muestra el mapa.

## Publicación

- `main` es la web pública; `staging` es la web de pruebas. Ambas se publican en la rama `gh-pages` con el workflow `.github/workflows/deploy.yml` (main en la raíz, staging en `/staging/`).
- El workflow **Publicar staging en la web** fusiona `staging` en `main` y regenera la web pública.
- Si alguna vez Pages no aparece activado: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: gh-pages / (root)**.

## Probar en local

Desde la carpeta del proyecto:

```sh
python3 scripts/build_data.py
python3 -m http.server 8080
```

y abre http://localhost:8080 en el navegador.
