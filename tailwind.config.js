/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  // Mantiene CSS existente estable (evita resets globales de Tailwind).
  corePlugins: {
    preflight: false,
  },
};


