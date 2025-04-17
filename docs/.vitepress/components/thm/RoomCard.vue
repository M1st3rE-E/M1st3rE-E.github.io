<template>
    <div class="room-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <p class="room-type">CHALLENGE ROOM</p>
                <h2 class="room-title">{{ roomName }}</h2>
            </div>
            <img
                :src="roomIcon"
                alt="Room Icon"
                style="width: 200px; height: 200px;"
            />
        </div>
        <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <a :href="roomLink" target="_blank" class="start-button">Start Room</a>
            <div style="display: flex; flex-direction: row; align-items: flex-end; justify-content: center">
                <div style="display: flex; flex-direction: row; align-items: center; margin-right: 1rem">
                    <p style="margin-right: .25rem">Level:</p>
                    <p :style="{ color: roomLevelColor }">{{ roomLevel }}</p>
                </div>
                <p>Technology: {{ roomTechnology }}</p>
            </div>
        </div>
    </div>

</template>

<script>
export default {
    name: "RoomCard",
    props: {
        roomName: {
            type: String,
            required: true,
        },
        roomLink: {
            type: String,
            required: true,
        },
        roomIcon: {
            type: String,
            required: true,
        },
        roomLevel: {
            type: String,
            required: true,
        },
        roomTechnology: {
            type: String,
            required: true,
        },
    },
    computed: {
        roomLevelColor() {
            switch (this.roomLevel.toLowerCase()) {
                case "easy":
                    return "#A3EA2A";
                case "medium":
                    return "#FFBB45";
                case "hard":
                    return "#FF5B67";
                default:
                    return "#FFFFFF";
            }
        },
    },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Roboto:wght@400;700&display=swap');

.room-card {
    font-family: 'Poppins', serif;
    padding: 1.5rem;
    border-radius: 1.5rem;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to top, #1B2538, #203552);
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
}

.room-type {
    font-size: 2rem !important;
    font-weight: 700;
    color: #A3EA2AFF !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2rem;
}

.room-title {
    border-top: none;
    padding: 0;
    margin: 0;
    font-size: 3.5rem;
    font-weight: 700;
    color: white;
    line-height: 1;
}

.start-button {
    border: 2px solid #A3EA2AFF;
    color: white;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    text-decoration: none;
    transition: background-color 0.3s ease;
}

.start-button:hover {
    background-color: #A3EA2AFF;
    color: #1B2538;
}

.room-card p {
    font-size: 0.875rem;
    color: #d1d5db;
}
</style>
