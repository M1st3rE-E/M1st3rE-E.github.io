<template>
    <div class="room-card" v-if="frontmatter.clayout === 'ctf' && frontmatter.type === 'TryHackMe'" @click="openCTFLink">
        <img :src="frontmatter.banner || '/icon/tryhackme/banner-default.png'" alt="Room Banner" class="room-banner" />
        <div class="room-card-background"></div>
        <div style="display: flex; align-items: center; gap: 1rem;">
            <img class="room-icon no-zoom" :src="frontmatter.icon" alt="Room Icon" />
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <h2 class="room-title">{{ frontmatter.title }}</h2>
                <p class="room-description">{{ frontmatter.description }}</p>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img v-if="frontmatter.level" :src="`/icon/tryhackme/difficulty/${frontmatter.level.toLowerCase()}.svg`"
                        alt="Room Level" style="width: 20px; height: 20px;" />
                    <p v-if="frontmatter.level" class="room-level" :style="{ color: roomLevelColor }">
                        {{ frontmatter.level }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'

const { frontmatter } = useData()

const roomLevelColor = computed(() => {
    if (!frontmatter.value.level) return "#FFFFFF"
    switch (frontmatter.value.level.toLowerCase()) {
        case "easy":
            return "#3BC81E"
        case "medium":
            return "#FFBB45"
        case "hard":
            return "#FF5B67"
        case "info":
            return "#719cf9"
        default:
            return "#FFFFFF"
    }
})

const openCTFLink = () => {
    if (frontmatter.value["ctf-link"]) {
        window.open(frontmatter.value["ctf-link"], '_blank')
    }
}
</script>

<style scoped>
.room-card {
    padding: 1.5rem;
    border-radius: 1.5rem;
    display: flex;
    flex-direction: column;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.room-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.room-banner {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 30%;
    z-index: -1;
    filter: blur(2px);
}

.room-card-background {
    position: absolute;
    top: 0;
    left: 0%;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(to right, #1A1A1A 30%, #1A1A1A 50%, transparent);
    z-index: -1;
}

.room-title {
    border-top: none;
    padding: 0;
    margin: 0 !important;
    margin-bottom: .5rem !important;
    font-size: 32px;
    font-weight: 700;
    color: white;
    line-height: 1;
}

.room-description {
    font-size: 16px;
    color: #d1d5db;
    padding: 0;
    margin: 0;
}

.room-level {
    font-size: 16px;
    color: #d1d5db;
    padding: 0;
    margin: 0;
}

.room-icon {
    width: 90px;
    height: 90px;
}

@media (max-width: 768px) {
    .room-icon {
        display: none;
    }
}
</style>