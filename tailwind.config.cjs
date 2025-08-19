const { skeleton } = require('@skeletonlabs/tw-plugin');
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Brand color system - Teal palette
        brand: {
          50: "#f0fffe",
          100: "#ccfefc", 
          200: "#99fdfa",
          300: "#5df9f5",
          400: "#2ee9e3",
          500: "#15d0ca",
          600: "#346864", // active/focus, outline links
          700: "#2A4D4B", // hover state
          800: "#294E4C", // nav bar, booking card header
          900: "#1a3534",
        },
        // Surface colors
        surface: {
          cream: "#FFFDF6", // page background
          card: "#FFFFFF",   // card background
          tint: "#EEF2ED",   // section tint (policies blocks)
        },
        // Border colors
        border: {
          soft: "#E6EBE7",   // primary divider/border
          neutral: "#E2E8F0", // alternative neutral border
        },
        // Text colors
        text: {
          primary: "#1E1F1E",   // heading/high-contrast
          secondary: "#5E6B66", // body/secondary
          tertiary: "#8A948F",  // captions/meta
        },
        // Accent colors
        accent: {
          whatsapp: "#25D366",
          muted: "#6B8583", // disabled CTA
        }
      },
      // Typography scale
      fontSize: {
        'display': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['22px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'button': ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        'label': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['14px', { lineHeight: '1.3', fontWeight: '400' }],
      },
      // Spacing system
      spacing: {
        'card': '24px',      // card padding
        'card-lg': '32px',   // large card padding
        'section': '24px',   // section gaps (small)
        'section-lg': '32px', // section gaps (large)
        'gallery': '12px',   // gallery gap (small)
        'gallery-lg': '16px', // gallery gap (large)
      },
      // Border radius system
      borderRadius: { 
        'card': '22px',      // card radius
        'control': '12px',   // small control radius
        'control-sm': '10px', // smallest control radius
        xl: "1rem", 
        "2xl": "1.25rem" 
      },
      // Enhanced shadow system
      boxShadow: {
        'card': '0 2px 6px rgba(16,24,40,0.04), 0 10px 20px rgba(16,24,40,0.06)',
        'card-hover': '0 4px 12px rgba(16,24,40,0.08), 0 20px 40px rgba(16,24,40,0.12)',
        'soft': '0 4px 12px rgba(0,0,0,0.08)',
        'elevated': '0 8px 30px rgba(0,0,0,0.12)',
      },
      // Container system
      maxWidth: {
        'container': '1240px',
        'container-sm': '1200px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [
    skeleton(),
    require("@tailwindcss/forms"), 
    require("@tailwindcss/typography")
  ]
};
