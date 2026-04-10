# US Tax Visualizer

Interactive web app that estimates how US federal income flows through **deductions**, **progressive brackets**, **payroll taxes (Social Security and Medicare)**, and **take-home pay**. Results include a numeric summary, a **Sankey diagram** of the money flow, and listed assumptions.

Built with [SolidStart](https://start.solidjs.com) (Solid.js), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/) v4, and [d3-sankey](https://github.com/d3/d3-sankey).

## Requirements

- [Node.js](https://nodejs.org/) 22 or newer

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the URL shown in the terminal (use `npm run dev -- --open` to launch a browser tab automatically).

## Production

```bash
npm run build
npm start
```

Preview the production client build locally:

```bash
npm run preview
```

## Disclaimer

This project is for **entertainment and educational illustration only**. It is **not** tax, legal, or financial advice. Figures are illustrative estimates based on bundled tax-year data and simplified rules and may be wrong for your situation. **Consult a qualified tax professional** (for example, a CPA or enrolled agent) before making decisions.
