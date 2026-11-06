import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    // Relative base './' ensures that generated script/style tags work when hosted under
    // any subpath (e.g. /dashboard/ on PythonAnywhere) or at domain root (e.g. Vercel)
    var base = env.VITE_BASE_PATH || (mode === 'production' ? './' : '/');
    return {
        base: base,
        plugins: [react()],
        server: {
            port: 3000,
            open: false,
        },
    };
});
