<template>
    <div class="last-posts">
        <div v-for="post in sortedPosts" :key="post.path" class="post-item">
            <PostCard :post="post" />
        </div>
    </div>
</template>

<script>
import PostCard from "./PostCard.vue";

export default {
    name: "LastPosts",
    components: {
        PostCard
    },
    data() {
        return {
            posts: []
        }
    },
    computed: {
        sortedPosts() {
            // Sort posts by date in descending order and take the first 3
            return this.posts
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
        }
    },
    methods: {
        async fetchPosts() {
            // Get all markdown files from the ctf directory
            const ctfFiles = import.meta.glob('/ctf/**/*.md', { eager: true });

            const posts = [];
            Object.entries(ctfFiles).forEach(([path, module]) => {
                const { __pageData } = module;
                if (path.includes("index.md")) {
                    return;
                }

                this.posts.push({
                    path: path.replace(".md", ""),
                    title: __pageData.frontmatter.title,
                    date: __pageData.frontmatter.date,
                    image: __pageData.frontmatter.image ?? null,
                    type: __pageData.frontmatter.type ?? null,
                });
            });

            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            // this.posts.splice(3);
        }
    },
    mounted() {
        this.fetchPosts();
    }
};
</script>

<style scoped>
.last-posts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
}

.post-item {
    width: 100%;
}
</style>