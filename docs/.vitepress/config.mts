import path from "path";
import { Feed } from "feed";
import { writeFileSync } from "fs";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import { createContentLoader, defineConfig, type SiteConfig } from "vitepress";

const hostname: string = "https://retherszu.github.io";

export default defineConfig({
    title: "Pentest Everything",
    description: "A VitePress Site",
    ignoreDeadLinks: true,
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
                        text: "<div style='display: flex; align-items: center'><img src='/icon/htb.png' style='width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;'/>Hack The Box</div>",
                        collapsed: true,
                        items: [
                            {
                                text: "Challenges",
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
                                            { text: "Oddly Even", link: "/ctf/hack-the-box/challenges/misc/oddly-even" },
                                            { text: "Reversal", link: "/ctf/hack-the-box/challenges/misc/reversal" },
                                            { text: "Addition", link: "/ctf/hack-the-box/challenges/misc/addition" },
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
                                text: "Machines",
                                collapsed: true,
                                items: [
                                    { text: "Chemistry", link: "/ctf/hack-the-box/machines/chemistry" },
                                    { text: "Cap", link: "/ctf/hack-the-box/machines/cap" },
                                    { text: "Paper", link: "/ctf/hack-the-box/machines/paper" },
                                    { text: "Writeup", link: "/ctf/hack-the-box/machines/writeup" },
                                ],
                            },
                        ],
                    },
                    {
                        text: "<div style='display: flex; align-items: center'><img src='/icon/thm.png' style='width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;'/>TryHackMe</div>",
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
                            {
                                text: "Advent of Cyber 1 - 2019",
                                collapsed: true,
                                link: "/ctf/tryhackme/advent-of-cyber-1-2019",
                                items: [
                                    { text: "Day 1 - Inventory Management", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-1-inventory-management" },
                                    { text: "Day 2 - Arctic Forum", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-2-arctic-forum" },
                                    { text: "Day 3 - Evil Elf", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-3-evil-elf" },
                                    { text: "Day 4 - Training", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training" },
                                    { text: "Day 5 - Ho-Ho-Hosint", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint" },
                                    { text: "Day 6 - Data Elf Iltration", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration" },
                                    { text: "Day 7 - Killing Up", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-7-killing-up" },
                                    { text: "Day 8 - SUID Shenanigans", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-8-suid-shenanigans" },
                                    { text: "Day 10 - Metasploit-a-ho-ho-ho", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-10-metasploit-a-ho-ho-ho" },
                                    { text: "Day 11 - Elf Applications", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-11-elf-applications" },
                                    { text: "Day 12 - ElfCryption", link: "/ctf/tryhackme/advent-of-cyber-1-2019/day-12-elfcryption" },
                                ],
                            },
                            { text: "Simple CTF", link: "/ctf/tryhackme/simple-ctf" },
                            { text: "ToolsRus", link: "/ctf/tryhackme/tools-rus" },
                            { text: "Bounty Hacker", link: "/ctf/tryhackme/bounty-hacker" },
                            { text: "Neighbour", link: "/ctf/tryhackme/neighbour" },
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
