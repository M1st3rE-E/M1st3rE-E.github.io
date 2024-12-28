<template>
    <a class="main-container" :href="htbCardLink">
        <div class="shader-container" id="waves"></div>
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
                <div style="display: flex; justify-content: center; align-items: center; gap: .5rem;">
                    <p class="sub-title">Congratulations</p>
                    <img
                        alt="background"
                        aria-label="web"
                        style="width: 1.5rem; height: 1.5rem; border-radius: 1rem"
                        src="https://labs.hackthebox.com/storage/avatars/49f2048100de56f233249290202e112f.png"
                    />
                    <p class="sub-title">0bytes, best of luck in capturing flags ahead!</p>
                </div>
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

watch(
    () => props.challengeType,
    (newType) => {
        switch (newType) {
            case "web":
                iconUrl.value = "https://app.hackthebox.com/images/icons/ic-challenge-categ/ic-web.svg";
                break;
            default:
                iconUrl.value = "https://app.hackthebox.com/images/icons/ic-challenge-categ/ic-web.svg";
                break;
        }
    },
    { immediate: true },
);

// https://github.com/bsehovac/shader-program/blob/master/examples/waves.html
class ShaderProgram {
    constructor(holder, options = {}) {
        options = Object.assign(
            {
                antialias: false,
                depthTest: false,
                mousemove: false,
                autosize: true,
                msaa: 0,
                vertex: `
        precision highp float;
        attribute vec4 a_position;
        attribute vec4 a_color;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mousemove;
        uniform mat4 u_projection;
        varying vec4 v_color;
        void main() {
          gl_Position = u_projection * a_position;
          gl_PointSize = (10.0 / gl_Position.w) * 100.0;
          v_color = a_color;
        }`,
                fragment: `
        precision highp float;
        uniform sampler2D u_texture;
        uniform int u_hasTexture;
        varying vec4 v_color;
        void main() {
          if ( u_hasTexture == 1 ) {
            gl_FragColor = v_color * texture2D(u_texture, gl_PointCoord);
          } else {
            gl_FragColor = v_color;
          }
        }`,
                uniforms: {},
                buffers: {},
                camera: {},
                texture: null,
                onUpdate: () => {
                },
                onResize: () => {
                },
            },
            options,
        );

        const uniforms = Object.assign(
            {
                time: { type: "float", value: 0 },
                hasTexture: { type: "int", value: 0 },
                resolution: { type: "vec2", value: [0, 0] },
                mousemove: { type: "vec2", value: [0, 0] },
                projection: {
                    type: "mat4",
                    value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                },
            },
            options.uniforms,
        );

        const buffers = Object.assign(
            {
                position: { size: 3, data: [] },
                color: { size: 4, data: [] },
            },
            options.buffers,
        );

        const camera = Object.assign(
            {
                fov: 60,
                near: 1,
                far: 10000,
                aspect: 1,
                z: 100,
                perspective: true,
            },
            options.camera,
        );

        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl", { antialias: options.antialias });

        if (!gl) return false;

        this.count = 0;
        this.gl = gl;
        this.canvas = canvas;
        this.camera = camera;
        this.holder = holder;
        this.msaa = options.msaa;
        this.onUpdate = options.onUpdate;
        this.onResize = options.onResize;
        this.data = {};

        holder.appendChild(canvas);

        this.createProgram(options.vertex, options.fragment);

        this.createBuffers(buffers);
        this.createUniforms(uniforms);

        this.updateBuffers();
        this.updateUniforms();

        this.createTexture(options.texture);

        gl.enable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl[options.depthTest ? "enable" : "disable"](gl.DEPTH_TEST);

        if (options.autosize)
            window.addEventListener("resize", e => this.resize(e), false);
        if (options.mousemove)
            window.addEventListener("mousemove", e => this.mousemove(e), false);

        this.resize();

        this.update = this.update.bind(this);
        this.time = { start: performance.now(), old: performance.now() };
        this.update();
    }

    mousemove(e) {
        let x = (e.pageX / this.width) * 2 - 1;
        let y = (e.pageY / this.height) * 2 - 1;

        this.uniforms.mousemove = [x, y];
    }

    resize(e) {
        const holder = this.holder;
        const canvas = this.canvas;
        const gl = this.gl;

        const width = (this.width = holder.offsetWidth);
        const height = (this.height = holder.offsetHeight);
        const aspect = (this.aspect = width / height);
        const dpi = (this.dpi = Math.max(this.msaa ? 2 : 1, devicePixelRatio));

        canvas.width = width * dpi;
        canvas.height = height * dpi;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        gl.viewport(0, 0, width * dpi, height * dpi);
        gl.clearColor(0, 0, 0, 0);

        this.uniforms.resolution = [width, height];
        this.uniforms.projection = this.setProjection(aspect);

        this.onResize(width, height, dpi);
    }

    setProjection(aspect) {
        const camera = this.camera;

        if (camera.perspective) {
            camera.aspect = aspect;

            const fovRad = camera.fov * (Math.PI / 180);
            const f = Math.tan(Math.PI * 0.5 - 0.5 * fovRad);
            const rangeInv = 1.0 / (camera.near - camera.far);

            const matrix = [
                f / camera.aspect,
                0,
                0,
                0,
                0,
                f,
                0,
                0,
                0,
                0,
                (camera.near + camera.far) * rangeInv,
                -1,
                0,
                0,
                camera.near * camera.far * rangeInv * 2,
                0,
            ];

            matrix[14] += camera.z;
            matrix[15] += camera.z;

            return matrix;
        } else {
            return [
                2 / this.width,
                0,
                0,
                0,
                0,
                -2 / this.height,
                0,
                0,
                0,
                0,
                1,
                0,
                -1,
                1,
                0,
                1,
            ];
        }
    }

    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {
            gl.deleteShader(shader);
        }
    }

    createProgram(vertex, fragment) {
        const gl = this.gl;

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertex);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragment);

        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            this.program = program;
        } else {
            gl.deleteProgram(program);
        }
    }

    createUniforms(data) {
        const gl = this.gl;
        const uniforms = (this.data.uniforms = data);
        const values = (this.uniforms = {});

        Object.keys(uniforms).forEach(name => {
            const uniform = uniforms[name];

            uniform.location = gl.getUniformLocation(this.program, "u_" + name);

            Object.defineProperty(values, name, {
                set: value => {
                    uniforms[name].value = value;
                    this.setUniform(name, value);
                },
                get: () => uniforms[name].value,
            });
        });
    }

    setUniform(name, value) {
        const gl = this.gl;
        const uniform = this.data.uniforms[name];

        uniform.value = value;

        switch (uniform.type) {
            case "int": {
                gl.uniform1i(uniform.location, value);
                break;
            }
            case "float": {
                gl.uniform1f(uniform.location, value);
                break;
            }
            case "vec2": {
                gl.uniform2f(uniform.location, ...value);
                break;
            }
            case "vec3": {
                gl.uniform3f(uniform.location, ...value);
                break;
            }
            case "vec4": {
                gl.uniform4f(uniform.location, ...value);
                break;
            }
            case "mat2": {
                gl.uniformMatrix2fv(uniform.location, false, value);
                break;
            }
            case "mat3": {
                gl.uniformMatrix3fv(uniform.location, false, value);
                break;
            }
            case "mat4": {
                gl.uniformMatrix4fv(uniform.location, false, value);
                break;
            }
        }

        // ivec2       : uniform2i,
        // ivec3       : uniform3i,
        // ivec4       : uniform4i,
        // sampler2D   : uniform1i,
        // samplerCube : uniform1i,
        // bool        : uniform1i,
        // bvec2       : uniform2i,
        // bvec3       : uniform3i,
        // bvec4       : uniform4i,
    }

    updateUniforms() {
        const gl = this.gl;
        const uniforms = this.data.uniforms;

        Object.keys(uniforms).forEach(name => {
            const uniform = uniforms[name];

            this.uniforms[name] = uniform.value;
        });
    }

    createBuffers(data) {
        const gl = this.gl;
        const buffers = (this.data.buffers = data);
        const values = (this.buffers = {});

        Object.keys(buffers).forEach(name => {
            const buffer = buffers[name];

            buffer.buffer = this.createBuffer("a_" + name, buffer.size);

            Object.defineProperty(values, name, {
                set: data => {
                    buffers[name].data = data;
                    this.setBuffer(name, data);

                    if (name == "position") this.count = buffers.position.data.length / 3;
                },
                get: () => buffers[name].data,
            });
        });
    }

    createBuffer(name, size) {
        const gl = this.gl;
        const program = this.program;

        const index = gl.getAttribLocation(program, name);
        const buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(index);
        gl.vertexAttribPointer(index, size, gl.FLOAT, false, 0, 0);

        return buffer;
    }

    setBuffer(name, data) {
        const gl = this.gl;
        const buffers = this.data.buffers;

        if (name == null && !gl.bindBuffer(gl.ARRAY_BUFFER, null)) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[name].buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    }

    updateBuffers() {
        const gl = this.gl;
        const buffers = this.buffers;

        Object.keys(buffers).forEach(name => (buffers[name] = buffer.data));

        this.setBuffer(null);
    }

    createTexture(src) {
        const gl = this.gl;
        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 0]),
        );

        this.texture = texture;

        if (src) {
            this.uniforms.hasTexture = 1;
            this.loadTexture(src);
        }
    }

    loadTexture(src) {
        const gl = this.gl;
        const texture = this.texture;

        const textureImage = new Image();

        textureImage.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                textureImage,
            );

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // gl.generateMipmap( gl.TEXTURE_2D )
        };

        textureImage.src = src;
    }

    update() {
        const gl = this.gl;

        const now = performance.now();
        const elapsed = (now - this.time.start) / 5000;
        const delta = now - this.time.old;
        this.time.old = now;

        this.uniforms.time = elapsed;

        if (this.count > 0) {
            if (gl.COLORBUFFERBIT) {
                gl.clear(gl.COLORBUFFERBIT);
            }
            gl.drawArrays(gl.POINTS, 0, this.count);
        }

        this.onUpdate(delta);

        requestAnimationFrame(this.update);
    }
}

Object.defineProperty(window, "ShaderProgram", {
    get() {
        return ShaderProgram;
    },
    set() {
        console.error("ShaderProgram is immutable!!!");
    },
    enumerable: true,
    configurable: false,
});

onMounted(() => {
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
        onResize(y, C, x) {
            const S = []
                , B = []
                , q = 200 * (y / C)
                , R = 1e3
                , I = 10
                , W = 7
                , p = 10;
            for (let Q = 0; Q < q; Q += W)
                for (let se = 0; se < R; se += W)
                    S.push(-q / 2 + Q, -30, -R / 2 + se),
                        B.push(0, 1 - Q / q * 1, 0 + Q / q * .5, p ? .1 : se / R);
            this.uniforms.field = [q, I, R],
                this.buffers.position = S,
                this.buffers.color = B,
                this.uniforms.size = C / 400 * 10 * x;
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
    background: #161618;
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

.sub-title {
    font-size: 1rem;
    margin-top: 1rem;
    text-align: center;
    color: #fff;
    font-weight: 300;
    line-height: 1.5;
}
</style>
