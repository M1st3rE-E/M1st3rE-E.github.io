// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import { useRoute } from "vitepress";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import imageViewer from "vitepress-plugin-image-viewer";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import vImageViewer from "vitepress-plugin-image-viewer/lib/vImageViewer.vue";
import "./style.css";

export default {
    extends: DefaultTheme,
    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            // https://vitepress.dev/guide/extending-default-theme#layout-slots
        });
    },
    enhanceApp({ app, router, siteData }) {
        enhanceAppWithTabs(app);
        app.component("vImageViewer", vImageViewer);
    },
    setup() {
        // Get route
        const route = useRoute();
        // Using
        imageViewer(route);
    }
} satisfies Theme;