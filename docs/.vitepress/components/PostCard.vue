<template>
    <a :href="post.path" class="post-card"
        :class="post.type.toLowerCase().replaceAll(' ', '-') + (post.image?.includes('/icon/') ? '-icon' : '')">
        <div class="post-image">
            <img
                :src="post.image ?? postImage"
                :alt="post.title"
                :style="{ transform: post.path.includes('machines') ? 'translateY(50px)' : 'none' }"
                class="no-zoom"
            />
        </div>
        <div class="post-content">
            <div class="post-type" :style="{ color: postTypeColor, '--before-color': postTypeColor }">{{ post.type }}
            </div>
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
    },
    computed: {
        postImage() {
            switch (this.post.type) {
                case "Hack The Box":
                    return "/icon/hack-the-box/htb.svg";
                case "TryHackMe":
                    return "/icon/tryhackme/thm.png";
            }
        },
        postTypeColor() {
            switch (this.post.type) {
                case "Hack The Box":
                    return "#9FEF00";
                case "TryHackMe":
                    return "#C11312";
            }
        },
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
    border-radius: 1rem;
    border: 1px solid var(--vp-c-bg-mute);
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
    height: 150px;
    overflow: hidden;
    background: #161618;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.hack-the-box .post-image img {
    min-height: 100%;
    object-fit: contain;
}

.hack-the-box-icon .post-image img {
    min-height: 100%;
    object-fit: contain;
}

.tryhackme .post-image img {
    width: auto;
    height: 100%;
    padding: .2em;
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
    display: flex;
    align-items: center;
}

.post-type::before {
    background-color: var(--before-color);
    content: "";
    height: 1px;
    margin-right: calc(1em * 0.5);
    width: 20px;
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