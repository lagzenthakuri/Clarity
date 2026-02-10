/**
 * Clarity Theme Configuration
 * 
 * Change these values to update the global theme of the application.
 * After changing these, ensure they match the variables in src/styles.css
 */

export const theme = {
    colors: {
        // Brand Colors
        primary: {
            light: "#bbf7d0", // soft green
            main: "#22c55e",  // income / positive actions
            dark: "#16a34a",
        },
        secondary: {
            light: "#bfdbfe", // soft blue
            main: "#2563eb",  // trust / navigation
            dark: "#1e40af",
        },
        accent: {
            teal: "#22c55e",
            blue: "#2563eb",
            rose: "#ef4444",
            amber: "#f59e0b",
            emerald: "#16a34a",
        },

        // Neutral / Light Palette
        background: {
            deep: "#f8fafc",   // app background
            card: "#ffffff",   // card background
            surface: "#eef2f7",// subtle surface
        },

        text: {
            primary: "#1e293b", // main text
            secondary: "#475569", // secondary text
            dim: "#94a3b8", // muted labels
        },

        // Status
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#2563eb",
    },

    // UI Scaling (Refined for "less bulky" look)
    spacing: {
        cardPadding: "1.25rem",
        inputPadding: "0.5rem 1rem",
        buttonPadding: "0.5rem 1.25rem",
        borderRadius: "0.75rem",
    }
};

export default theme;
