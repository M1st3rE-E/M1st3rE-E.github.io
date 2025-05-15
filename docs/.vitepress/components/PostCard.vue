<template>
    <a :href="post.path" class="post-card">
        <div class="post-image">
            <img :src="postImage" :alt="post.title" />
        </div>
        <div class="post-content">
            <div class="post-type">{{ postType }}</div>
            <h3 class="post-title">{{ post.title }}</h3>
            <div class="post-date">{{ formatDate(post.date) }}</div>
        </div>
    </a>
</template>

<script>
export default {
    name: "PostCard",
    props: {
        post: {
            type: Object,
            required: true
        },
        postType: {
            type: String,
            required: true
        }
    },
    computed: {
        postImage() {
            // Return different images based on post type
            switch (this.postType) {
                case "Hack The Box":
                    return "/icon/htb.png";
                case "TryHackMe":
                    return "/icon/thm.png";
                case "Vulnerabilities":
                    return "/icon/vuln.png";
                default:
                    return "/icon/default.png";
            }
        }
    },
    methods: {
        formatDate(date) {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
};
</script>

<style scoped>
.post-card {
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #1B2538, #203552);
    border-radius: 1rem;
    overflow: hidden;
    text-decoration: none;
    color: white;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    margin-bottom: 1rem;
    height: 100%;
}

.post-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.post-image {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: #161618;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.post-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.post-content {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.post-type {
    font-size: 0.875rem;
    font-weight: 600;
    color: #A3EA2A;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
}

.post-type::before {
    align-self: center;
    background-color: var(--vp-c-brand-1);
    content: "";
    height: 1px;
    margin-right: calc(1em * 0.5);
    width: 20px;
    display: inline-flex;
}

.post-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    line-height: 1.4;
    color: white;
}

.post-date {
    font-size: 0.875rem;
    color: #B3B3B3;
    margin-top: auto;
}

@media (max-width: 768px) {
    .post-image {
        height: 150px;
    }
}
</style> 