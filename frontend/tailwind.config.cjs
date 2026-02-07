module.exports = {
  content: ["./index.html", "./src/**/*.{vue,ts}"] ,
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#A1B500",
          700: "#A1B500",
          500: "#A1B500"
        },
        // A typical soft matcha green
        matcha: {
          DEFAULT: '#91B500', // A soft, light green
          light: '#C1E9CD', // A lighter, more pastel version
          dark: '#8DA371',
        }
      }
    }
  },
  plugins: []
};
