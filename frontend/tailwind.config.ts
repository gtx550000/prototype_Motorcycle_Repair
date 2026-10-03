import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        accent: {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
        }
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-thai)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
