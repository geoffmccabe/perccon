console.log('perc-e.js loaded');

function waitForPercCon(callback) {
    if (window.percCon && window.percCon.physicsWorld) {
        callback();
    } else {
        setTimeout(() => waitForPercCon(callback), 100);
    }
}

waitForPercCon(function() {
    const { scene, camera, renderer, physicsWorld, Ammo } = window.percCon;
    console.log('perc-e.js: window.percCon loaded:', window.percCon);

    // PERC-E (big black floating sphere)
    const perceGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const perceMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const perce = new THREE.Mesh(perceGeometry, perceMaterial);
    perce.position.set(0, 2, -2); // Behind camera
    perce.castShadow = true;
    scene.add(perce);
    console.log('PERC-E added:', perce);

    // PERC-E physics (floating)
    const perceShape = new Ammo.btSphereShape(0.5);
    const perceTransform = new Ammo.btTransform();
    perceTransform.setIdentity();
    perceTransform.setOrigin(new Ammo.btVector3(0, 2, -2));
    const perceMotionState = new Ammo.btDefaultMotionState(perceTransform);
    const perceBody = new Ammo.btRigidBody(
        new Ammo.btRigidBodyConstructionInfo(1, perceMotionState, perceShape, new Ammo.btVector3(0, 0, 0))
    );
    perceBody.setDamping(0.5, 0.5); // Damping for floating effect
    physicsWorld.addRigidBody(perceBody);
    perce.userData = { physicsBody: perceBody, isAngry: false };
    console.log('PERC-E physics body added:', perceBody);

    // Floating effect (oscillate up and down)
    let floatTime = 0;
    function floatPerce() {
        floatTime += 0.016;
        const offset = Math.sin(floatTime * 2) * 0.2; // Oscillate ±0.2 units
        const transform = new Ammo.btTransform();
        perceBody.getMotionState().getWorldTransform(transform);
        const origin = transform.getOrigin();
        origin.setY(2 + offset);
        transform.setOrigin(origin);
        perceBody.getMotionState().setWorldTransform(transform);
        perce.position.copy(new THREE.Vector3(origin.x(), origin.y(), origin.z()));
    }

    // Angry effect (pixel flashes and woosh sound)
    function makePerceAngry() {
        if (perce.userData.isAngry) return;
        perce.userData.isAngry = true;

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
            colors[i * 3] = isRed ? 1 : 1; // Red or orange
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

        // Shaking effect
        let shakeTime = 0;
        const shakeInterval = setInterval(() => {
            shakeTime += 0.016;
            const offsetX = (Math.random() - 0.5) * 0.1;
            const offsetZ = (Math.random() - 0.5) * 0.1;
            const transform = new Ammo.btTransform();
            perceBody.getMotionState().getWorldTransform(transform);
            const origin = transform.getOrigin();
            origin.setX(offsetX);
            origin.setZ(-2 + offsetZ);
            transform.setOrigin(origin);
            perceBody.getMotionState().setWorldTransform(transform);

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

            if (shakeTime >= 3) {
                // Turn off angry effect
                clearInterval(shakeInterval);
                perce.remove(particleSystem);
                particleSystem.geometry.dispose();
                particleSystem.material.dispose();
                perce.userData.isAngry = false;
            }
        }, 16);
    }

    // Expose PERC-E for shooter.js
    window.percCon.perce = perce;
    window.percCon.makePerceAngry = makePerceAngry;
    window.percCon.floatPerce = floatPerce;
});