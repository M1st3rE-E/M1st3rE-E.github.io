// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import { useRoute } from "vitepress";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import imageViewer from "vitepress-plugin-image-viewer";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import vImageViewer from "vitepress-plugin-image-viewer/lib/vImageViewer.vue";
// css
import "./style.css";
// components
import TryHackMeLayout from './layouts/TryHackMeLayout.vue'
import HackTheBoxLayout from './layouts/HackTheBoxLayout.vue'

export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'doc-before': () => {
                const route = useRoute();
                if (route.path.includes('/ctf/tryhackme/')) {
                    return h(TryHackMeLayout)
                } else if (route.path.includes('/ctf/hack-the-box/')) {
                    return h(HackTheBoxLayout)
                }
            }
        })
    },
    enhanceApp({ app, router, siteData }) {
        enhanceAppWithTabs(app);
        app.component("vImageViewer", vImageViewer);
    },
    setup() {
        const route = useRoute();
        imageViewer(route);
    }
} satisfies Theme;