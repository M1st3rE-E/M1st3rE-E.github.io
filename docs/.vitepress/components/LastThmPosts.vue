<template>
    <div class="posts-grid">
        <PostCard
            v-for="post in posts"
            :key="post.path"
            :post="post"
            post-type="TryHackMe"
        />
    </div>
</template>

<script>
import PostCard from './PostCard.vue';

export default {
    components: {
        PostCard
    },
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

<style scoped>
.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 1rem 0;
}
</style>
