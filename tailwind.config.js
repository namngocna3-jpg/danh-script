/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bảng màu Danh Script — nền mực tối, nhấn hổ phách (không generic)
        ink: {
          950: '#0a0b0f',
          900: '#0f1117',
          850: '#141721',
          800: '#1a1e2b',
          700: '#252a3a',
          600: '#343a4f'
        },
        amber: {
          glow: '#f5b544',
          soft: '#f0c674'
        },
        accent: {
          DEFAULT: '#6ea8fe',
          dim: '#3d5a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
}
