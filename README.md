# Ganamos el Kini

Verificador **no oficial** del Quini 6. Cargás tus 6 números y el sitio te dice
si ganaste en los últimos 10 sorteos. Todo el cálculo ocurre en tu navegador y
los números quedan guardados en `localStorage`: no hay backend, ni cuentas, ni
datos que salgan de tu dispositivo.

## Estructura

- `index.html` — página única (Preact + htm + canvas-confetti por CDN, sin build).
- `src/quini.js` — lógica de aciertos, modalidades y tiers (funciones puras).
- `src/app.js` — interfaz, validación, persistencia y festejos.
- `data/sorteos.json` — últimos sorteos. Lo actualiza el repo privado del scraper.
- `.github/workflows/deploy.yml` — publica el sitio en GitHub Pages.

## Tiers de festejo

| Tier | Qué significa | Festejo |
| --- | --- | --- |
| 3 | 6 aciertos o Pozo Extra | Confeti a full |
| 2 | 5 aciertos | Ráfaga media |
| 1 | 4 aciertos | Confeti suave |
| 0 | Sin premio | — |

Reglas por modalidad: Tradicional y La Segunda pagan 4, 5 y 6; Revancha solo 6;
Siempre Sale paga desde 4; el Pozo Extra se calcula con los números únicos de los
tres primeros sorteos.

## Deploy

Dominio: `ganamoselquini.aboni.dev`. GitHub Pages con `CNAME` apuntando a
`ajboni.github.io`. Los resultados se actualizan desde un repo privado que
empuja `data/sorteos.json` a `main`, lo que dispara el deploy.

## Descargo

Sitio no oficial y sin relación con la Lotería de Santa Fe. Información solo
informativa; verificá siempre con los canales oficiales. +18. Juego responsable.
