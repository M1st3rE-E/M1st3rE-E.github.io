<template>
    <a class="main-container" :href="htbCardLink">
        <div ref="wavesRef" class="shader-container" id="waves"></div>
        <div class="container">
            <div class="type-container">
                <img
                    alt="background"
                    aria-label="web"
                    :src="iconUrl"
                />
            </div>
            <div class="main-content">
                <p class="title">{{ challengeName }} has been Pwned!</p>
            </div>
        </div>
    </a>
</template>

<script setup>
import { defineProps, onMounted, ref, watch } from "vue";

// Define props
const props = defineProps({
    challengeType: String,
    htbCardLink: String,
    challengeName: String,
});

const iconUrl = ref("");
const wavesRef = ref(null);

watch(
    () => props.challengeType,
    (newType) => {
        switch (newType) {
            case "web":
                iconUrl.value = "https://app.hackthebox.com/images/icons/ic-challenge-categ/ic-web.svg";
                break;
            case "misc":
                iconUrl.value = "https://app.hackthebox.com/images/icons/ic-challenge-categ/ic-misc.svg";
                break;
            default:
                iconUrl.value = "https://app.hackthebox.com/images/icons/ic-challenge-categ/ic-misc.svg";
                break;
        }
    },
    { immediate: true },
);

onMounted(async () => {
    const { default: ShaderProgram } = await import("./ShaderProgram.js");
    new ShaderProgram(document.getElementById("waves"), {
        texture: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAftJREFUeNrsV9FxwjAMDbkMkG4AEwAbwAZhg2SClglaJgAmSDYAJiAbJJ0ANigjVOKeOZ+wjWPC9ae60yU4lp5lS89iEAVI+ROl9MjxsyreoktXH4MA0A96fJKmGGLQFYFvXgJMgDN+kA4tU86kBS2g7gWYABloTZqJTwpgJsb3pEtawDkIGOeottUamWMnVqQb2/kPLKA5oky1YXawJUdfFhsefzfYcPSVExirZ8CJmFfBwcUj29daxitpYV/fAZNRaTCoYdB2zPwJFiDPn0uvuAEj0qNtUqhYgplz5InDLifDCDV67gg4RFLmtjnJAx9smJGjrStDDZUgk+xOYsNYi5JRkmL1DTnOHKD8rRGspsqv9QE+UGQjTiqUgxLevh0BHJE8t0TiMf4malmVEvs6+ABfBdzLRpKDZ4i+RPI0huy92rr423nGONMlzrgUAKbEqcFqD5Mx9slSdkQ6p9eFOH/9HBc8x7cCki5lQk75AtjTDuy0S2NP44uuNR4HcsO35f3lwE/LPzDLGNTXi8DX2Ac4A0HkPYDmIJjMCIwLuhL0WEp67HIfg0ZlS1SpZiDWapTv3rkgdJ0eU59ttdBoi3u4MG41r4Z0yq/iguAtO6Gvihw910lQ6QUUOpVtb2iXGWlbKH+Hd5mefbVNnuur//yfxKv+O/0KMACAidBaPX5LZQAAAABJRU5ErkJggg==",
        uniforms: {
            size: {
                type: "float",
                value: 10,
            },
            field: {
                type: "vec3",
                value: [0, 0, 0],
            },
            speed: {
                type: "float",
                value: 7,
            },
        },
        vertex: `
            #define M_PI 3.1415926535897932384626433832795

            precision highp float;

            attribute vec4 a_position;
            attribute vec4 a_color;

            uniform float u_time;
            uniform float u_size;
            uniform float u_speed;
            uniform vec3 u_field;
            uniform mat4 u_projection;

            varying vec4 v_color;

            void main() {
                vec3 pos = a_position.xyz;

                pos.y += (
                cos(pos.x / u_field.x * M_PI * 8.0 + u_time * u_speed) +
                sin(pos.z / u_field.z * M_PI * 8.0 + u_time * u_speed)
                ) * u_field.y;

                gl_Position = u_projection * vec4( pos.xyz, a_position.w );
                gl_PointSize = ( u_size / gl_Position.w ) * 200.0;

                v_color = a_color;
            }`,
        fragment: `
            precision highp float;

            uniform sampler2D u_texture;

            varying vec4 v_color;

            void main() {
                gl_FragColor = v_color * texture2D(u_texture, gl_PointCoord);
            }`,
        onResize(w, h, x) {
            const S = []
                , B = []
                , q = 200 * (w / h)
                , R = 1e3
                , I = 10
                , W = 7;
            for (let Q = 0; Q < q; Q += W) {
                for (let se = 0; se < R; se += W) {
                    S.push(-q / 2 + Q, -30, -R / 2 + se),
                        B.push(0, 1 - Q / q, Q / q * .5, 1);
                }
            }

            this.uniforms.field = [q, I, R],
                this.buffers.position = S,
                this.buffers.color = B,
                this.uniforms.size = h / 400 * 10 * x;
        },
    });
});
</script>

<style scoped>
.shader-container {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
}

.container {
    border: 1px solid #2e2e32;
    overflow: hidden;
    border-radius: 20px;
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.main-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    background: rgba(17, 17, 17, .5);
    border-radius: 20px;
    cursor: pointer;
    z-index: 1;
    transition: opacity 0.3s ease;
    opacity: 0;
}

.main-container:hover::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    background: rgba(17, 17, 17, .3);
    border-radius: 20px;
    cursor: pointer;
    z-index: 1;
    opacity: 1;
    transition: opacity 0.3s ease;
}

.main-container:hover::after {
    mask-image: none !important;
    --icon: none !important;
    background: none !important;
}

.main-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    color: white;
}

.main-container:hover {
    color: white;
}

.type-container {
    height: 118px;
    width: 118px;
    display: flex;
    font-size: 2rem;
    background: rgba(22, 22, 24, .9);
    padding: 1rem;
    justify-content: center;
    align-items: center;
    margin: 1rem;
    border-radius: 100%;
}

.type-container img {
    width: 48px;
    height: 48px;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 2rem;
    background: #161618;
    padding: 1rem;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.title {
    position: relative;
    font-size: 1rem;
}

.title::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(to left, rgba(159, 239, 0, 0) 0%, rgba(159, 239, 0, .75) 50%, rgba(159, 239, 0, 0) 100%);
}
</style>