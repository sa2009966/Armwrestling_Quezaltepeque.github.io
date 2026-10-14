# Armwrestling Quezaltepeque — Sitio web

Sitio del club de lucha de brazos de Quezaltepeque, La Libertad, El Salvador.
Migrado de HTML estático manual a **Astro** con datos estructurados.

## Estructura

```
src/
  data/                  ← TODOS los datos editables
    tops.json            ← Ranking: 10 luchadores (perfil, stats, combates)
    evento.json          ← Vendettas: fecha, lugar, enfrentamientos
    pilares.json         ← 4 pilares de entrenamiento
    site.json            ← Contactos, ubicación, horarios, footer, form
  layouts/BaseLayout.astro   ← head SEO, fonts, menú, scripts globales
  components/            ← Header, Footer (2 variantes), TopCard
  pages/                 ← 5 páginas + [slug].astro (genera las 10 fichas)
public/                  ← fotos, style.css, robots.txt, sitemap.xml
```

## Cómo actualizar el contenido

**Ranking / fichas de luchadores** → edita `src/data/tops.json`:
cambia peso, récord, stats o agrega combates a la lista `combates`.
Las 10 fichas y las tarjetas del ranking se regeneran solas.

**Nuevo evento** → edita `src/data/evento.json`.

**Contactos / horarios** → edita `src/data/site.json`.

Después:
```bash
npm run build   # regenera el sitio en dist/
```
Con el repo conectado a Vercel, un `git push` regenera el deploy automáticamente.

## Comandos

| Comando         | Acción                                    |
| --------------- | ----------------------------------------- |
| `npm run dev`   | servidor de desarrollo en localhost:4321  |
| `npm run build` | build de producción a `dist/`             |
| `npm run preview` | sirve `dist/` localmente                |

## Formulario de contacto

Usa [Web3Forms](https://web3forms.com) (gratis). Para activarlo:
1. Crea una cuenta en web3forms.com con tu correo
2. Copia la access key que te envían
3. Pégala en `src/data/site.json` → `form.accessKey`
(Sustituye el valor `TU_ACCESS_KEY_DE_WEB3FORMS`.)

## Deploy

- **Vercel**: conecta el repo y detecta Astro automáticamente (build: `npm run build`, output: `dist/`)
- **Pendiente por decidir**: dominio canónico (hoy `armwrestling-quezaltepeque.pages.dev`).
  Al definirlo, actualizar `site` en `astro.config.mjs` y las URLs de `public/sitemap.xml`.

## Datos pendientes de confirmar con el club

- Peso de Duvan: la tarjeta antigua decía 110kg, la ficha 100kg (se usó la ficha)
- Edad/estilo de algunos luchadores fueron tomados textual de las fichas originales
