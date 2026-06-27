/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  compilerOptions: {
    customElement: true,
    warningFilter({ code, filename }) {
      // Silence warnings about `$state` runes in tests
      if (code === "state_referenced_locally" && filename.includes(".test.")) {
        return false;
      }

      return true;
    },
  },
};
