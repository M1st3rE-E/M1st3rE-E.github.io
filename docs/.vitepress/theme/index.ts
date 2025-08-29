// https://vitepress.dev/guide/custom-theme
import mediumZoom from "medium-zoom";
import { useRoute } from "vitepress";
import type { Theme } from "vitepress";
import { h, onMounted, watch, nextTick } from "vue";
import DefaultTheme from "vitepress/theme-without-fonts";
// css
import "./style.css";
// component
import TryHackMeLayout from "./layouts/TryHackMeLayout.vue";
import HackTheBoxLayout from "./layouts/HackTheBoxLayout.vue";

export default {
	extends: DefaultTheme,
	Layout() {
		return h(DefaultTheme.Layout, null, {
			"doc-before": () => {
				const route = useRoute();
				if (route.path.includes("/ctf/tryhackme/")) {
					return h(TryHackMeLayout);
				} else if (route.path.includes("/ctf/hack-the-box/")) {
					return h(HackTheBoxLayout);
				}
			},
		});
	},
	setup() {
		const route = useRoute();
        let zoom: ReturnType<typeof mediumZoom> | null = null

        const applyZoom = () => {
            if (zoom) {
                zoom.detach()
                zoom = null
            }

            const selector = [
                ".vp-doc :not(a) > img",
                ".content-container img"
            ].join(",")

            zoom = mediumZoom(selector, {
                background: getComputedStyle(document.documentElement)
                .getPropertyValue("--vp-c-bg")
                .trim() || undefined
            })

            const exclude = document.querySelectorAll([
                ".no-zoom",
                "[data-no-zoom]",
                ".owned-icon",
                ".owned-right-container img"
            ].join(","))

            if (exclude.length) zoom.detach(exclude)
        };

		onMounted(() => nextTick(() => applyZoom()));
		watch(
			() => route.path,
			() => nextTick(() => applyZoom())
		);
	},
} satisfies Theme;
