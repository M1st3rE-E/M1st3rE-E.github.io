<template>
    <textarea
        v-model="input"
        placeholder="Enter text here"
        rows="5"
    />
    <div class="buttons">
        <button @click="encode">Encode</button>
        <button @click="decode">Decode</button>
        <button @click="clear">Clear</button>
    </div>
    <textarea
        v-model="output"
        placeholder="Output will appear here"
        rows="5"
        readonly
    />
</template>

<script>
export default {
    data() {
        return {
            input: "",
            output: "",
        };
    },
    methods: {
        encode() {
            this.output = btoa(this.input);
        },
        decode() {
            try {
                this.output = atob(this.input);
            } catch (e) {
                this.output = "Error: Invalid Base64 string.";
            }
        },
        clear() {
            this.input = "";
            this.output = "";
        },
    },
};
</script>

<style scoped>

textarea {
    width: 100%;
    font-family: inherit;
    margin: 0.5em 0;
    background: var(--vp-sidebar-bg-color);
    color: var(--vp-c-text-1);
    border-radius: 1rem;
    padding: 1rem;
}

textarea[readonly] {
    background: var(--vp-sidebar-bg-color);
    color: var(--vp-c-text-2)
}

label {
    font-size: 0.9em;
    display: inline-flex;
    align-items: center;
}

input[type="checkbox"] {
    margin-right: 0.5em;
}

.buttons {
    margin: 0.5em 0;
}

button {
    margin-right: 0.5em;
    padding: .25rem .5rem;
    border-radius: 8px;
    color: var(--vp-c-text-1);
    cursor: pointer;
    border: 1px solid var(--vp-c-divider);
    transition: border-color 0.25s;
}

button:hover {
    border-color: var(--vp-c-brand-1);
}

input[type="checkbox"]:checked {
    accent-color: var(--vp-c-brand-1);
}
</style>
