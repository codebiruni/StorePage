import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest configuration for the StorePage Next.js app.
 *
 * - `vite-tsconfig-paths` resolves the `@/*` alias from tsconfig.json so
 *   tests import modules exactly the way app code does.
 * - jsdom is the default environment because most units under test are
 *   React components / browser helpers. Server-only suites opt into the
 *   `node` environment with a `// @vitest-environment node` docblock.
 */
export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        alias: {
            // `server-only` is provided by Next.js at build time and is not a
            // real installed package, so it must be stubbed for Vitest.
            "server-only": fileURLToPath(
                new URL("./vitest.stubs/server-only.ts", import.meta.url),
            ),
        },
    },
    esbuild: {
        // Next.js compiles JSX through the automatic runtime; mirror that here
        // so .tsx test/render files don't need an explicit React import.
        jsx: "automatic",
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        exclude: [
            "**/node_modules/**",
            "**/.next/**",
            "**/dist/**",
            "**/e2e/**",
        ],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/lib/**", "src/hooks/**", "src/app/step/_lib/**"],
            exclude: ["**/*.d.ts", "**/*.test.*", "**/*.spec.*"],
        },
    },
});
