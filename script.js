console.log('script.js loaded');

// Load Ammo.js and run script.js logic
let AmmoInitialized = false;

// Ammo.js initialization (JavaScript version)
if (typeof Ammo === 'undefined') {
    console.error('Ammo.js is not loaded. Ensure the Ammo.js script is included in index.html.');
} else {
    console.log('Ammo.js script loaded');
    AmmoInitialized = true;
    runScript();
}

function runScript() {
    if (!AmmoInitialized) {
        console.error('Ammo.js not initialized yet');
        return;
    }

    console.log('runScript called');

    // Check if canvas exists
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    console.log('Canvas element found:', canvas);

    // Scene setup
    const { scene, camera, renderer, floor } = setupScene();
    console.log('Scene setup completed:', { scene, camera, renderer });

    // Physics setup
    const physicsWorld = setupPhysics(Ammo);
    console.log('Physics setup completed:', physicsWorld);

    // Crosshair
    const crosshairCanvas = document.createElement('canvas');
    crosshairCanvas.width = 8;
    crosshairCanvas.height = 8;
    const crosshairCtx = crosshairCanvas.getContext('2d');
    crosshairCtx.strokeStyle = '#ffffff';
    crosshairCtx.lineWidth = 1;
    crosshairCtx.beginPath();
    crosshairCtx.moveTo(4, 0); crosshairCtx.lineTo(4, 2);
    crosshairCtx.moveTo(4, 6); crosshairCtx.lineTo(4, 8);
    crosshairCtx.moveTo(0, 4); crosshairCtx.lineTo(2, 4);
    crosshairCtx.moveTo(6, 4); crosshairCtx.lineTo(8, 4);
    crosshairCtx.stroke();
    const crosshairTexture = new THREE.CanvasTexture(crosshairCanvas);
    const crosshairMaterial = new THREE.SpriteMaterial({ map: crosshairTexture, transparent: true });
    const crosshair = new THREE.Sprite(crosshairMaterial);
    crosshair.scale.set(0.025, 0.025, 1);
    crosshair.position.set(0, 0, -0.5);
    camera.add(crosshair);
    scene.add(camera);
    console.log('Crosshair added:', crosshair);

    // FPS controls
    const controls = new THREE.PointerLockControls(camera, renderer.domElement);
    let move = { forward: false, backward: false, left: false, right: false, jump: false };
    let velocityY = 0;
    let isJumping = false;
    let moveSpeed = 0.05;

    // Lock controls on any key press
    document.addEventListener('keydown', (e) => {
        if (!controls.isLocked) controls.lock();
        switch (e.code) {
            case 'KeyW': move.forward = true; break;
            case 'KeyS': move.backward = true; break;
            case 'KeyA': move.left = true; break;
            case 'KeyD': move.right = true; break;
            case 'Space': move.jump = true; break;
        }
    });
    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': move.forward = false; break;
            case 'KeyS': move.backward = false; break;
            case 'KeyA': move.left = false; break;
            case 'KeyD': move.right = false; break;
            case 'Space': move.jump = false; break;
        }
    });
    document.addEventListener('wheel', (e) => {
        moveSpeed = Math.max(0.02, Math.min(0.1, moveSpeed + (e.deltaY > 0 ? -0.01 : 0.01)));
    });

    // Percs
    const percs = createPercs(scene);
    console.log('Percs created:', percs);

    // Expose variables for shooter.js and perc-e.js
    window.percCon = {
        controls: controls,
        percs: percs,
        camera: camera,
        renderer: renderer,
        scene: scene,
        move: move,
        velocityY: velocityY,
        isJumping: isJumping,
        moveSpeed: moveSpeed,
        floor: floor,
        physicsWorld: physicsWorld,
        Ammo: Ammo // Pass Ammo to other scripts
    };
    console.log('window.percCon set:', window.percCon);

    // Animation
    function animate() {
        requestAnimationFrame(animate);

        // Update physics
        if (physicsWorld) {
            physicsWorld.stepSimulation(1 / 60, 10);
        }

        // Move camera
        if (controls.isLocked) {
            const direction = new THREE.Vector3();
            if (move.forward) direction.z += 1;
            if (move.backward) direction.z -= 1;
            if (move.left) direction.x -= 1;
            if (move.right) direction.x += 1;
            direction.normalize().multiplyScalar(moveSpeed);
            controls.moveForward(direction.z);
            controls.moveRight(direction.x);

            // Jumping
            if (move.jump && !isJumping) {
                velocityY = 0.1;
                isJumping = true;
            }
            if (isJumping) {
                camera.position.y += velocityY;
                velocityY -= 0.005;
                if (camera.position.y <= 1.5) {
                    camera.position.y = 1.5;
                    isJumping = false;
                    velocityY = 0;
                }
            }
        }

        // Spin percs
        percs.forEach(perc => {
            if (perc.userData.spinning) {
                const delta = perc.userData.targetRotation - perc.rotation.y;
                if (Math.abs(delta) > 0.01) {
                    perc.rotation.y += delta * 0.1;
                } else {
                    perc.rotation.y = perc.userData.targetRotation;
                    perc.userData.spinning = false;
                }
            }
        });

        // Debug: Log scene children to confirm objects are present
        console.log('Scene children in animate:', scene.children);

        renderer.render(scene, camera);
    }
    animate();
    console.log('Animation loop started');

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}