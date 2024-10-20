import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Pentest Everything",
    description: "A VitePress Site",
    srcDir: "src",
    themeConfig: {
        logo: "/logo.jpg",
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
        ],

        sidebar: [
            {
                text: "Penetration Testing",
                items: [
                    {
                        text: "Hack the box",
                        collapsed: true,
                        items: [
                            {
                                text: "Challenges",
                                collapsed: true,
                                items: [
                                    {
                                        text: "Web",
                                        collapsed: true,
                                        link: "/ctf/hack-the-box/challenges/web",
                                        items: [
                                            { text: "Gunship", link: "/ctf/hack-the-box/challenges/web/gunship" },
                                        ]
                                    },
                                ]
                            },

                        ]
                    },
                    // { text: "Introduction", link: "/penetration-testing" },
                    // { text: "Reconnaissance", link: "/reconnaissance" },
                    // { text: "Scanning", link: "/scanning" },
                    // { text: "Exploitation", link: "/exploitation" },
                    // { text: "Post-Exploitation", link: "/post-exploitation" },
                    // { text: "Reporting", link: "/reporting" },
                ],
            },
            {
                text: "Vulnerabilities",
                items: [
                    {
                        text: "Web",
                        collapsed: true,
                        link: "/vulnerabilities/web",
                        items: [
                            { text: "Prototype Pollution", link: "/vulnerabilities/web/prototype-pollution" },
                        ]
                    },
                ]
            }
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/RetherSzu" },
        ],
    },
});
