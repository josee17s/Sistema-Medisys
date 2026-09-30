/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: [
          "Gotham",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        sans: [
          "Source Sans Pro",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Black 6C — color de texto principal
        ink: "#2D2926",
        clinic: {
          bg: "#FFFFFF",
          surface: "#FFFFFF",
          // antes era #FFFFFF (bordes invisibles); gris neutro sutil para separar tarjetas/tablas
          border: "#E2E6E7",
          // Pantone 306 C — color primario institucional
          primary: "#00AEEF",
          primaryDark: "#0090C4",
          // Pantone 302 C — color secundario institucional (panel lateral, acentos oscuros)
          secondary: "#003B5C",
          secondaryDark: "#00293F",
        },
        specialty: {
          medicina: "#2563A6",
          odontologia: "#0E9488",
          psicologia: "#7C5CBF",
          fisioterapia: "#B9701E",
          nutricion: "#3F8F42",
        },
      },
    },
  },
  plugins: [],
};