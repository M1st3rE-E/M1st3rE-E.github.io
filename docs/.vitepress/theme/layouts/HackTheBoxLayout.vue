<template>
    <div v-if="frontmatter.clayout === 'ctf' && frontmatter.type === 'Hack The Box'">
        <h1 class="room-title">Hack The Box | {{ frontmatter.title }}</h1>
        <p class="room-description">
            In this walkthrough, we will be going through the
            <strong>{{ ctfData.name }}</strong> box on Hack The Box.
        </p>
        <div class="room-banner-container" v-if="ctfData.thumbnail">
            <img :src="ctfData.thumbnail" alt="Room Banner" class="room-banner medium-zoom-image" />
        </div>
        <a :href="ctfData.link" target="_blank">
            <p class="ctf-link-text">{{ ctfData.link }}</p>
        </a>
        <div class="vp-doc">
            <hr />
        </div>
        <div class="owned-container" @click="openOwnedLink">
            <div class="owned-left-container">
                <div class="owned-text-container">
                    <h1 class="owned-title">Successfully Pwned {{ ctfData.name }}</h1>
                    <p class="owned-description">
                        Completed and pwned this challenge on Hack The Box.
                    </p>
                </div>

                <div class="owned-icon-container">
                    <img src="/icon/hack-the-box/htb.svg" alt="Owned" class="owned-icon" />
                    <p class="owned-icon-text">Hack The Box</p>
                </div>
            </div>
            <div class="owned-right-container">
                <img :src="ctfData.pwned.thumbnail" alt="Pwned" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { useData } from "vitepress";
import { useRoute } from "vitepress";
import { computed } from "vue";

const { frontmatter } = useData();

const ctfData = computed(() => {
    return {
        name: frontmatter.value.ctf[0].name,
        link: frontmatter.value.ctf[0].link,
        thumbnail: frontmatter.value.ctf[0].thumbnail,
        pwned: {
            link: frontmatter.value.ctf[0].pwned[0].link,
            thumbnail: frontmatter.value.ctf[0].pwned[0].thumbnail,
        },
    }
})

const openOwnedLink = () => {
    window.open(frontmatter.value.ctf[0].pwned[0].link, "_blank");
};

const getCTFType = () => {
    const path = useRoute().path;
    if (path.includes("/ctf/hack-the-box/machines/")) {
        return "machine";
    } else if (path.includes("/ctf/hack-the-box/challenges/misc/")) {
        return "misc";
    } else if (path.includes("/ctf/hack-the-box/challenges/web/")) {
        return "web";
    }
};
</script>

<style scoped>

.owned-container:hover {
    border: 1px solid var(--vp-c-brand);
}

.owned-container:hover .owned-title {
    color: var(--vp-c-brand)!important;
}

.room-banner-container {
    border-radius: 1rem;
    overflow: hidden;
}

.room-banner {
    width: 100%;
    height: 100%;
    max-height: 560px;
    object-fit: contain;
    margin-bottom: -1px;
}

.ctf-link-text {
    font-size: 16px;
    color: #a9a9a9;
    padding: 0.5em 0;
    text-align: center;
    text-decoration: underline;
}

.ctf-link-text:hover {
    color: var(--vp-c-brand);
}

.room-title {
    font-size: 32px;
    font-weight: 700;
    color: white;
    line-height: 1.3;
}

.owned-container {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 0.5rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 1rem;
    margin: 1rem 0;
    cursor: pointer;
    overflow: hidden;
    transition: border 0.3s ease;
}

.owned-left-container {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.owned-text-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.owned-icon-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.owned-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 1px solid var(--vp-c-divider);
    padding: 0.5rem;
}

.owned-icon-text {
    font-size: 16px;
    color: #a9a9a9;
    padding: 0;
    margin: 0;
}

.owned-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    transition: color 0.3s ease;
}

.room-title {
    font-size: 32px;
    font-weight: 700;
    color: white;
}

.room-description {
    font-size: 16px;
    color: #a9a9a9;
    padding: 0;
    margin: 1em 0;
}
</style>
