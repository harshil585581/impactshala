/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "be-vietnam": ['"Be Vietnam Pro"', "sans-serif"],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
      },
      colors: {
        primary: "#f77f00",
        "primary-light": "#ffeacc",
        navy: "#003049",
        "text-dark": "#18191c",
        "text-medium": "#374151",
        "text-muted": "#9ca3af",
        "border-default": "#e5e7eb",
        "border-light": "#f3f4f6",
        "bg-page": "#f5f5f5",
        "card-dark": "#1f2937",
      },
    },
  },
  plugins: [],
};
