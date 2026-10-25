/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			gold: 'hsl(var(--brand-gold))',
  			'brand-navy': 'hsl(var(--brand-navy))',
  			'brand-emerald': 'hsl(var(--brand-emerald))',
  			'brand-softmint': 'hsl(var(--brand-softmint))',
  			'warm-white': 'hsl(var(--warm-white))',
  			'brand-amber': 'hsl(var(--brand-amber))',
  			li: {
  				cloud: 'hsl(var(--li-cloud))',
  				forest: 'hsl(var(--li-forest))',
  				infra: 'hsl(var(--li-infra))',
  				mint: 'hsl(var(--li-mint))',
  				graphite: 'hsl(var(--li-graphite))',
  				carbon: 'hsl(var(--li-carbon))',
  				slate: 'hsl(var(--li-slate))',
  				steel: 'hsl(var(--li-steel))',
  				pale: 'hsl(var(--li-pale))',
  				amber: 'hsl(var(--li-amber))',
  				red: 'hsl(var(--li-red))',
  				btn: 'hsl(var(--li-btn))',
  				'btn-hover': 'hsl(var(--li-btn-hover))'
  			},
  			'gold-dark': 'hsl(var(--brand-gold-dark))',
  			'brand-cyan': 'hsl(var(--brand-cyan))',
			mint: 'hsl(var(--brand-mint))',
			       market: { bg: 'hsl(var(--market-bg))', surface: 'hsl(var(--market-surface))', ink: 'hsl(var(--market-ink))', muted: 'hsl(var(--market-muted))', line: 'hsl(var(--market-line))', accent: 'hsl(var(--market-accent))' },
			obs: { bg: 'hsl(var(--obs-bg))', surface: 'hsl(var(--obs-surface))', land: 'hsl(var(--obs-land))', ink: 'hsl(var(--obs-ink))', muted: 'hsl(var(--obs-muted))', line: 'hsl(var(--obs-line))', mint: 'hsl(var(--obs-mint))', amber: 'hsl(var(--obs-amber))', cyan: 'hsl(var(--obs-cyan))' },
			si: { bg: 'hsl(var(--si-bg))', bg2: 'hsl(var(--si-bg2))', forest: 'hsl(var(--si-forest))', mint: 'hsl(var(--si-mint))', mint2: 'hsl(var(--si-mint2))', ink: 'hsl(var(--si-ink))', muted: 'hsl(var(--si-muted))', line: 'hsl(var(--si-line))', amber: 'hsl(var(--si-amber))', blue: 'hsl(var(--si-blue))' },
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)'],
  			plex: ['var(--font-plex)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
