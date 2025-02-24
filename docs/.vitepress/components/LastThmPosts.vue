<template>
    <li v-for="post in posts" :key="post.path">
        <a :href="post.path">{{ post.title }}</a>
    </li>
</template>

<script>
export default {
    setup() {
        const postsList = import.meta.glob("/ctf/tryhackme/**/*.md", { eager: true });

        const posts = [];
        Object.entries(postsList).forEach(([path, module]) => {
            const { __pageData } = module;
            if (path.includes("index.md")) {
                return;
            }

            posts.push({
                path: path.replace(".md", ""),
                title: __pageData.frontmatter.title.replace(" - TryHackMe", ""),
                date: __pageData.frontmatter.date,
            });
        });

        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        posts.splice(3);

        return { posts };
    },
};
</script>
