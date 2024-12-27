import path from "path";
import { Feed } from "feed";
import { writeFileSync } from "fs";
import { createContentLoader, defineConfig, type SiteConfig } from "vitepress";

const hostname: string = "https://retherszu.github.io";

export default defineConfig({
    title: "Pentest Everything",
    description: "A VitePress Site",
    ignoreDeadLinks: true,
    markdown: {
        image: {
            lazyLoading: true,
        },
    },
    lastUpdated: true,
    buildEnd: async (config: SiteConfig) => {
        const feed = new Feed({
            title: "Rether szu",
            description: "My personal blog",
            id: hostname,
            link: hostname,
            language: "en",
            image: "/logo.jpg",
            favicon: "/favicon.ico",
            copyright: "Copyright (c) 2024-present, Rether Szu",
        });

        const posts = await createContentLoader("ctf/**/*.md", {
            excerpt: true,
            render: true,
        }).load();

        const filterdPosts = posts.filter((post) => post.frontmatter?.date !== undefined);

        filterdPosts.sort(
            (a, b) =>
                +new Date(b.frontmatter.date as string) -
                +new Date(a.frontmatter.date as string),
        );

        for (const { url, excerpt, frontmatter } of filterdPosts) {
            feed.addItem({
                title: frontmatter.title,
                id: `${hostname}${url}`,
                link: `${hostname}${url}`,
                description: excerpt,
                author: [
                    {
                        name: "Rether Szu",
                        link: "https://github.com/RetherSzu",
                    },
                ],
                date: frontmatter.date,
            });
        }

        writeFileSync(path.join(config.outDir, "feed.rss"), feed.rss2());
    },
    srcDir: "src",
    themeConfig: {
        logo: "/logo.jpg",
        outline: {
            level: [1, 3],
        },
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
                                        // @formatter:off
                                        items: [
                                            { text: "Gunship", link: "/ctf/hack-the-box/challenges/web/gunship" },
                                            { text: "Spookifier", link: "/ctf/hack-the-box/challenges/web/spookifier" },
                                            { text: "PDFy", link: "/ctf/hack-the-box/challenges/web/pdfy" },
                                            { text: "Insomnia", link: "/ctf/hack-the-box/challenges/web/insomnia" },
                                            { text: "Breathtaking View", link: "/ctf/hack-the-box/challenges/web/breathtaking-view" },
                                            { text: "POP Restaurant", link: "/ctf/hack-the-box/challenges/web/pop-restaurant" },
                                            { text: "Pentest Notes", link: "/ctf/hack-the-box/challenges/web/pentest-notes" },
                                            { text: "JScalc", link: "/ctf/hack-the-box/challenges/web/jscalc" },
                                            { text: "Proxy As A Service", link: "/ctf/hack-the-box/challenges/web/proxy-as-a-service" },
                                            { text: "Apache blaze", link: "/ctf/hack-the-box/challenges/web/apache-blaze" },
                                            { text: "Flag Command", link: "/ctf/hack-the-box/challenges/web/flag-command" },
                                            { text: "WayWitch", link: "/ctf/hack-the-box/challenges/web/way-witch" },
                                            { text: "Void Whispers", link: "/ctf/hack-the-box/challenges/web/void-whispers" },
                                            { text: "Unholy Union", link: "/ctf/hack-the-box/challenges/web/unholy-union" },
                                            { text: "Phantom Script", link: "/ctf/hack-the-box/challenges/web/phantom-script" },
                                            { text: "KORP Terminal", link: "/ctf/hack-the-box/challenges/web/korp-terminal" },
                                            { text: "Cursed Stale Policy", link: "/ctf/hack-the-box/challenges/web/cursed-stale-policy" },
                                        ],
                                        // @formatter:on
                                    },
                                ],
                            },
                            {
                                text: "Machines",
                                collapsed: true,
                                items: [
                                    { text: "Chemistry", link: "/ctf/hack-the-box/machines/chemistry" },
                                ],
                            },
                        ],
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
                        items: [
                            { text: "Prototype Pollution", link: "/vulnerabilities/web/prototype-pollution" },
                            {
                                text: "Server-Side Template Injection (SSTI)",
                                collapsed: true,
                                link: "/vulnerabilities/web/server-side-template-injection",
                                items: [
                                    {
                                        text: "Jinja2 (Python)",
                                        link: "/vulnerabilities/web/server-side-template-injection/ssti-in-jinja2",
                                    },
                                ],
                            },
                            // @formatter:off
                            { text: "Server-Side Request Forgery (SSRF)", link: "/vulnerabilities/web/server-side-request-forgery", },
                            // @formatter:on
                        ],
                    },
                ],
            },
            {
                text: "Tools",
                items: [
                    { text: "Url encoding", link: "/tools/url-encoding" },
                    { text: "Base64 encoding", link: "/tools/base64-encoding" },
                ],
            },
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/RetherSzu" },
        ],
    },
});
