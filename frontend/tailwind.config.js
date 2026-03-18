/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				brand: {
					50: "#f3f7ff",
					100: "#e8f0ff",
					200: "#cbdcff",
					300: "#a4bfff",
					400: "#7698ff",
					500: "#456dff",
					600: "#2f4ef5",
					700: "#233cd9",
					800: "#2235ad",
					900: "#223588",
				},
				surface: {
					soft: "#f8fafc",
					base: "#ffffff",
					muted: "#f1f5f9",
				},
			},
			fontFamily: {
				display: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
				body: ["Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"],
			},
			boxShadow: {
				panel: "0 8px 24px rgba(15, 23, 42, 0.08)",
			},
			borderRadius: {
				xl2: "1rem",
			},
		},
	},
	plugins: [],
};

