console.log('perc-e.js loaded');

function waitForPercCon(callback) {
    if (window.percCon && window.percCon.physicsWorld) {
        callback();
    } else {
        setTimeout(() => waitForPercCon(callback), 100);
    }
}

waitForPercCon(function() {
    const { scene, camera, renderer, physicsWorld } = window.percCon;
    console.log('perc-e.js: window.percCon loaded:', window.percCon);

    // PERC-E (big black floating sphere)
    const perceGeometry = new THREE.SphereGeometry(0.5, 32, 32);

    // Load video
    const video = document.createElement('video');
    video.src = 'images/angrysphere.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.load();
    video.play();
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.needsUpdate = true;

    // Shader material for fading and cube-like mapping
    const perceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            videoTexture: { value: videoTexture },
            opacity: { value: 0.0 },
            baseColor: { value: new THREE.Color(0x333333) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D videoTexture;
            uniform float opacity;
            uniform vec3 baseColor;
            varying vec3 vNormal;
            varying vec2 vUv;
            void main() {
                vec3 absNormal = abs(vNormal);
                vec2 uv;
                if (absNormal.x > absNormal.y && absNormal.x > absNormal.z) {
                    uv = vec2(vNormal.x > 0.0 ? (vNormal.z / absNormal.x + 1.0) * 0.5 : (1.0 - vNormal.z / absNormal.x) * 0.5, (vNormal.y / absNormal.x + 1.0) * 0.5);
                } else if (absNormal.y > absNormal.x && absNormal.y > absNormal.z) {
                    uv = vec2((vNormal.x / absNormal.y + 1.0) * 0.5, vNormal.y > 0.0 ? (1.0 - vNormal.z / absNormal.y) * 0.5 : (vNormal.z / absNormal.y + 1.0) * 0.5);
                } else {
                    uv = vec2(vNormal.z > 0.0 ? (1.0 - vNormal.x / absNormal.z) * 0.5 : (vNormal.x / absNormal.z + 1.0) * 0.5, (vNormal.y / absNormal.z + 1.0) * 0.5);
                }
                vec4 videoColor = texture2D(videoTexture, uv);
                vec4 finalColor = mix(vec4(baseColor, 1.0), videoColor, opacity);
                gl_FragColor = finalColor;
            }
        `,
        side: THREE.DoubleSide,
        transparent: true
    });

    const perce = new THREE.Mesh(perceGeometry, perceMaterial);
    perce.position.set(0, 2, 4);
    perce.castShadow = true;
    scene.add(perce);
    console.log('PERC-E added:', perce);

    // PERC-E physics (floating with Cannon.js)
    const perceBody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Sphere(0.5)
    });
    perceBody.position.set(0, 2, 4);
    perceBody.linearDamping = 0.5;
    physicsWorld.addBody(perceBody);
    perce.userData = { physicsBody: perceBody, isAngry: false };
    console.log('PERC-E physics body added:', perceBody);

    // Floating effect (oscillate up and down)
    let floatTime = 0;
    function floatPerce() {
        floatTime += 0.016;
        const offset = Math.sin(floatTime * 2) * 0.2;
        perceBody.position.y = 2 + offset;
        perce.position.copy(perceBody.position);
    }

    // Angry effect (pixel flashes, video, and woosh sound)
    let shakeTime = 0;
    function makePerceAngry() {
        if (perce.userData.isAngry) return;
        perce.userData.isAngry = true;
        shakeTime = 0; // Reset shake time

        // Play strange woosh sound
        const wooshSound = new Audio('sounds/strange_woosh.mp3');
        wooshSound.play();

        // Particle system for fire effect
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 0.5;
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            const isRed = Math.random() > 0.5;
            colors[i * 3] = isRed ? 1 : 1;
            colors[i * 3 + 1] = isRed ? 0 : 0.5;
            colors[i * 3 + 2] = 0;
            sizes[i] = Math.random() * 0.05 + 0.02;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true
        });
        const particleSystem = new THREE.Points(particles, particleMaterial);
        perce.add(particleSystem);

        // Video fade-in/out (2s fade-in, 6s full, 2s fade-out)
        const shakeInterval = setInterval(() => {
            shakeTime += 0.016;
            console.log('shakeTime:', shakeTime); // Log shakeTime for debugging
            const offsetX = (Math.random() - 0.5) * 0.1;
            const offsetZ = (Math.random() - 0.5) * 0.1;
            perceBody.position.x = offsetX;
            perceBody.position.z = 4 + offsetZ;
            perce.position.copy(perceBody.position);

            // Update particle positions
            const particlePositions = particles.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const radius = 0.5;
                particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                particlePositions[i * 3 + 2] = radius * Math.cos(phi);
            }
            particles.attributes.position.needsUpdate = true;

            // Video fade effect
            if (shakeTime < 2) {
                perceMaterial.uniforms.opacity.value = shakeTime / 2;
            } else if (shakeTime >= 2 && shakeTime < 8) {
                perceMaterial.uniforms.opacity.value = 1.0;
            } else if (shakeTime >= 8 && shakeTime < 10) {
                perceMaterial.uniforms.opacity.value = (10 - shakeTime) / 2;
            }

            if (shakeTime >= 10) {
                clearInterval(shakeInterval);
                perce.remove(particleSystem);
                particleSystem.geometry.dispose();
                particleMaterial.dispose();
                perce.userData.isAngry = false;
                perceBody.position.x = 0;
                perceBody.position.z = 4;
                perce.position.copy(perceBody.position);
                perceMaterial.uniforms.opacity.value = 0.0;
                shakeTime = 0;
            }

            // Expose shakeTime for shooter.js
            window.percCon.shakeTime = shakeTime;
        }, 16);
    }

    // Expose PERC-E for shooter.js
    window.percCon.perce = perce;
    window.percCon.makePerceAngry = makePerceAngry;
    window.percCon.floatPerce = floatPerce;
    window.percCon.shakeTime = 0; // Initial value
});