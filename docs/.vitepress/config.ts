import path from "path";
import { Feed } from "feed";
import { writeFileSync } from "fs";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import { createContentLoader, defineConfig, type SiteConfig } from "vitepress";

const hostname: string = "https://retherszu.github.io";

// Helper function to create machine entries with icons
function createMachineEntry(name: string, slug: string) {
    return {
        text: `<img src='/ctf/hack-the-box/machines/${slug}/icon.png' style='width: 24px; height: 24px; vertical-align: middle; margin-right: 5px;'/>${name}`,
        link: `/ctf/hack-the-box/machines/${slug}`,
    };
}

export default defineConfig({
    title: "Pentest Everything",
    description: "A VitePress Site",
    ignoreDeadLinks: true,
    appearance: "force-dark",
    
    markdown: {
        config(md) {
            md.use(tabsMarkdownPlugin);
        },
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
                        text: "<div style='display: flex; align-items: center'><img src='/icon/hack-the-box/htb.svg' style='width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;'/>Hack The Box</div>",
                        collapsed: true,
                        items: [
                            {
                                text: "<div style='display: flex; align-items: center'><img src='/icon/hack-the-box/ic-challenges.svg' style='width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;'/>Challenges</div>",
                                link: "/ctf/hack-the-box/challenges",
                                collapsed: true,
                                items: [
                                    {
                                        text: "Web",
                                        collapsed: true,
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
                                            { text: "Feedback Flux", link: "/ctf/hack-the-box/challenges/web/feedback-flux" },
                                            { text: "Jailbreak", link: "/ctf/hack-the-box/challenges/web/jailbreak" },
                                            { text: "Labyrinth Linguist", link: "/ctf/hack-the-box/challenges/web/labyrinth-linguist" },
                                            { text: "HauntMart", link: "/ctf/hack-the-box/challenges/web/hauntmart" },
                                            { text: "PumpkinSpice", link: "/ctf/hack-the-box/challenges/web/pumpkin-spice" },
                                            { text: "Spellbound Servants", link: "/ctf/hack-the-box/challenges/web/spellbound-servants" },
                                            { text: "Armaxis", link: "/ctf/hack-the-box/challenges/web/armaxis" },
                                            { text: "OnlyHacks", link: "/ctf/hack-the-box/challenges/web/onlyhacks" },
                                        ],
                                        // @formatter:on
                                    },
                                    {
                                        text: "Misc",
                                        collapsed: true,
                                        // @formatter:off
                                        items: [
                                            { text: "Emdee five for life", link: "/ctf/hack-the-box/challenges/misc/emdee-five-for-life" },
                                            { text: "Computational Recruiting", link: "/ctf/hack-the-box/challenges/misc/computational-recruiting" },
                                            { text: "Locked Away", link: "/ctf/hack-the-box/challenges/misc/locked-away" },
                                            { text: "Compressor", link: "/ctf/hack-the-box/challenges/misc/compressor" },
                                            { text: "MinMax", link: "/ctf/hack-the-box/challenges/misc/minmax" },
                                            { text: "ShinyHunter", link: "/ctf/hack-the-box/challenges/misc/shiny-hunter" },
                                            { text: "Deterministic", link: "/ctf/hack-the-box/challenges/misc/deterministic" },
                                        ]
                                        // @formatter:on
                                    }
                                ],
                            },
                            {
                                text: "<div style='display: flex; align-items: center'><img src='/icon/hack-the-box/ic-machines.svg' style='width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;'/>Machines</div>",
                                collapsed: true,
                                link: "/ctf/hack-the-box/machines",
                                items: [
                                    createMachineEntry("Lame", "lame"),
                                    createMachineEntry("Legacy", "legacy"),
                                    createMachineEntry("Devel", "devel"),
                                    createMachineEntry("Popcorn", "popcorn"),
                                    createMachineEntry("Beep", "beep"),
                                    createMachineEntry("Cronos", "cronos"),
                                    createMachineEntry("October", "october"),
                                    createMachineEntry("Bank", "bank"),
                                    createMachineEntry("Blocky", "blocky"),
                                    createMachineEntry("Writeup", "writeup"),
                                    createMachineEntry("Cap", "cap"),
                                    createMachineEntry("Antique", "antique"),
                                    createMachineEntry("Paper", "paper"),
                                    createMachineEntry("BoardLight", "board-light"),
                                    createMachineEntry("Chemistry", "chemistry"),
                                    createMachineEntry("Cat", "cat"),
                                    createMachineEntry("Titanic", "titanic"),
                                    createMachineEntry("Cypher", "cypher"),
                                    createMachineEntry("Dog", "dog"),
                                    createMachineEntry("Code", "code"),
                                    createMachineEntry("Noctural", "noctural"),
                                    createMachineEntry("Planning", "planning"),
                                ],
                            },
                        ],
                    },
                    {
                        text: "<div style='display: flex; align-items: center'><img src='/icon/tryhackme/thm.png' style='width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;'/>TryHackMe</div>",
                        collapsed: true,
                        link: "/ctf/tryhackme",
                        items: [
                            { text: "Light", link: "/ctf/tryhackme/light" },
                            { text: "Lo-Fi", link: "/ctf/tryhackme/lo-fi" },
                            { text: "Capture", link: "/ctf/tryhackme/capture" },
                            { text: "Pickle Rick", link: "/ctf/tryhackme/pickle-rick" },
                            { text: "Lesson Learned?", link: "/ctf/tryhackme/lesson-learned" },
                            { text: "RootMe", link: "/ctf/tryhackme/rootme" },
                            { text: "Whiterose", link: "/ctf/tryhackme/whiterose" },
                            { text: "Basic Pentesing", link: "/ctf/tryhackme/basic-pentesting" },
                            { text: "Cheese CTF", link: "/ctf/tryhackme/cheese-ctf" },
                            { text: "Silver platter", link: "/ctf/tryhackme/silver-platter" },
                            { text: "The Sticker Shop", link: "/ctf/tryhackme/the-sticker-shop" },
                            { text: "Lookup", link: "/ctf/tryhackme/lookup" },
                            { text: "U.A. High School", link: "/ctf/tryhackme/high-school" },
                            { text: "Billing", link: "/ctf/tryhackme/billing" },
                            { text: "Publisher", link: "/ctf/tryhackme/publisher" },
                            { text: "mKingdom", link: "/ctf/tryhackme/mkingdom" },
                            { text: "Decryptify", link: "/ctf/tryhackme/decryptify" },
                            { text: "Simple CTF", link: "/ctf/tryhackme/simple-ctf" },
                            { text: "ToolsRus", link: "/ctf/tryhackme/tools-rus" },
                            { text: "Bounty Hacker", link: "/ctf/tryhackme/bounty-hacker" },
                            { text: "Neighbour", link: "/ctf/tryhackme/neighbour" },
                            { text: "Compiled", link: "/ctf/tryhackme/compiled" },
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
                            // @formatter:off
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
                            { text: "Server-Side Request Forgery (SSRF)", link: "/vulnerabilities/web/server-side-request-forgery", },
                            // @formatter:on
                        ],
                    },
                ],
            },
            {
                text: "Tools",
                items: [
                    {
                        text: "Online Tools",
                        collapsed: true,
                        items: [
                            { text: "Url encoding", link: "/tools/online-tools/url-encoding" },
                            { text: "Base64 encoding", link: "/tools/online-tools/base64-encoding" },
                        ],
                    },
                ],
            },
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/RetherSzu" },
        ],
    },
});
