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
		const initZoom = () => {
			mediumZoom(".content-container img", { background: "var(--vp-c-bg)" });
		};
		onMounted(() => {
			initZoom();
		});
		watch(
			() => route.path,
			() => nextTick(() => initZoom())
		);
	},
} satisfies Theme;
