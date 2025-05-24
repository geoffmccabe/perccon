console.log('script.js loaded - Version 27');

runScript();

function runScript() {
    console.log('runScript called');

    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    console.log('Canvas element found:', canvas);

    function waitForDependencies(callback) {
        if (typeof setupScene === 'function') {
            callback();
        } else {
            setTimeout(() => waitForDependencies(callback), 100);
        }
    }

    waitForDependencies(() => {
        const { scene, camera, renderer, floor } = setupScene();
        console.log('Scene setup completed:', { scene, camera, renderer });

        camera.near = 0.01;
        camera.updateProjectionMatrix();

        const physicsWorld = setupPhysics();
        console.log('Physics setup completed:', physicsWorld);

        const dotCanvas = document.createElement('canvas');
        dotCanvas.width = 5;
        dotCanvas.height = 5;
        const dotCtx = dotCanvas.getContext('2d');
        dotCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        dotCtx.beginPath();
        dotCtx.arc(2.5, 2.5, 1.25, 0, Math.PI * 2);
        dotCtx.fill();
        const dotTexture = new THREE.CanvasTexture(dotCanvas);
        const dotMaterial = new THREE.SpriteMaterial({ map: dotTexture, transparent: true });
        const dotCrosshair = new THREE.Sprite(dotMaterial);
        dotCrosshair.scale.set(0.0075, 0.0075, 1);
        dotCrosshair.position.set(0, 0, -0.5);
        camera.add(dotCrosshair);

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
        const fullCrosshair = new THREE.Sprite(crosshairMaterial);
        fullCrosshair.scale.set(0.025, 0.025, 1);
        fullCrosshair.position.set(0, 0, -0.5);
        fullCrosshair.visible = false;
        camera.add(fullCrosshair);
        scene.add(camera);
        console.log('Crosshairs added:', dotCrosshair, fullCrosshair);

        const controls = new THREE.PointerLockControls(camera, renderer.domElement);
        let move = { forward: false, backward: false, left: false, right: false, jump: false, run: false };
        let velocityY = 0;
        let isJumping = false;
        let moveSpeed = 0.05;
        const runMultiplier = 1.6;

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '[') {
                e.preventDefault();
                if (atlasPanel && atlasPanel.element) {
                    const isVisible = atlasPanel.element.style.display === 'block';
                    atlasPanel.element.style.display = isVisible ? 'none' : 'block';
                    atlasPanel.element.style.position = 'fixed';
                    atlasPanel.element.style.top = '0';
                    atlasPanel.element.style.left = '0';
                    atlasPanel.element.style.zIndex = '1000';
                    atlasPanel.element.style.border = '2px solid red';
                    atlasPanel.element.style.visibility = isVisible ? 'hidden' : 'visible';
                    atlasPanel.element.style.width = '512px';
                    atlasPanel.element.style.height = '512px';
                    // Force redraw
                    atlasPanel.element.style.opacity = '0.99';
                    setTimeout(() => {
                        atlasPanel.element.style.opacity = '1';
                        const ctx = atlasPanel.element.getContext('2d');
                        if (ctx) {
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                            ctx.fillRect(0, 0, 1, 1); // Small change to trigger redraw
                        }
                    }, 10);
                    console.log(`${isVisible ? 'Hiding' : 'Showing'} developer panel: Atlas Grid, display: ${atlasPanel.element.style.display}, visibility: ${atlasPanel.element.style.visibility}, zIndex: ${atlasPanel.element.style.zIndex}`);
                } else {
                    console.error('Atlas panel not initialized yet');
                }
            }
            if (!controls.isLocked) {
                controls.lock();
                console.log('Controls locked by keypress:', e.code);
            }
            switch (e.code) {
                case 'KeyW': move.forward = true; break;
                case 'KeyS': move.backward = true; break;
                case 'KeyA': move.left = true; break;
                case 'KeyD': move.right = true; break;
                case 'Space': move.jump = true; break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    move.run = true; break;
                case 'KeyR':
                    if (typeof dotCrosshair !== 'undefined' && typeof fullCrosshair !== 'undefined') {
                        dotCrosshair.visible = !dotCrosshair.visible;
                        fullCrosshair.visible = !fullCrosshair.visible;
                        console.log('Crosshair toggled:', fullCrosshair.visible ? 'full' : 'dot');
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': move.forward = false; break;
                case 'KeyS': move.backward = false; break;
                case 'KeyA': move.left = false; break;
                case 'KeyD': move.right = false; break;
                case 'Space': move.jump = false; break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    move.run = false; break;
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (!controls.isLocked) {
                controls.lock();
                console.log('Controls locked by mouse click:', e.button === 0 ? 'left' : 'right');
            }
        });

        document.addEventListener('wheel', (e) => {
            moveSpeed = Math.max(0.02, Math.min(0.1, moveSpeed + (e.deltaY > 0 ? -0.01 : 0.01)));
        });

        let tierCounters = Array(10).fill(0);
        const savedCounters = localStorage.getItem('percConTierCounters');
        if (savedCounters) {
            tierCounters = JSON.parse(savedCounters);
            console.log('Loaded tier counters from localStorage:', tierCounters);
        } else {
            console.log('No saved tier counters found, initializing to zeros');
        }

        window.percCon = {
            controls: controls,
            camera: camera,
            renderer: renderer,
            scene: scene,
            move: move,
            velocityY: velocityY,
            isJumping: isJumping,
            moveSpeed: moveSpeed,
            floor: floor,
            physicsWorld: physicsWorld,
            tierCounters: tierCounters
        };
        console.log('window.percCon set initially:', window.percCon);

        const percs = createPercs(scene);
        console.log('Percs created:', percs);

        window.percCon.percs = percs;
        console.log('window.percCon updated with percs:', window.percCon);

        const tierColors = [
            '#666666', // T1 Dark Grey
            '#FFCC80', // T2 Golden Yellow/Orange
            '#66FF66', // T3 Green
            '#6666FF', // T4 Blue
            '#B266B2', // T5 Purple
            '#FF6666', // T6 Red
            '#CCCCCC', // T7 White
            '#FF99CC', // T8 Pink
            '#FFFFFF', // T9 Rainbow
            '#FF8566'  // T10 Fire
        ];

        const displayDiv = document.createElement('div');
        displayDiv.style.position = 'fixed';
        displayDiv.style.bottom = '10px';
        displayDiv.style.left = '10px';
        displayDiv.style.display = 'flex';
        displayDiv.style.alignItems = 'center';
        document.body.appendChild(displayDiv);

        const sphereElements = [];
        const glowingSpheres = [];
        for (let i = 0; i < 10; i++) {
            const tierDiv = document.createElement('div');
            tierDiv.style.display = 'flex';
            tierDiv.style.alignItems = 'center';
            tierDiv.style.marginRight = '20px';

            const sphere = document.createElement('div');
            sphere.style.width = '12.5px';
            sphere.style.height = '12.5px';
            sphere.style.borderRadius = '50%';
            sphere.style.background = tierColors[i];
            if (i === 6) { // White (T7) - Pulsing white glow
                sphere.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.8)';
                let intensity = 0;
                let increasing = true;
                setInterval(() => {
                    intensity = increasing ? intensity + 0.02 : intensity - 0.02;
                    if (intensity >= 1) increasing = false;
                    if (intensity <= 0) increasing = true;
                    sphere.style.boxShadow = `0 0 ${5 + intensity * 5}px rgba(255, 255, 255, ${0.8 + intensity * 0.2})`;
                }, 16);
            } else if (i === 7) { // Pink (T8) - Pulsing pink glow (double speed)
                sphere.style.boxShadow = '0 0 5px rgba(255, 153, 204, 0.8)';
                let intensity = 0;
                let increasing = true;
                setInterval(() => {
                    intensity = increasing ? intensity + 0.04 : intensity - 0.04;
                    if (intensity >= 1) increasing = false;
                    if (intensity <= 0) increasing = true;
                    sphere.style.boxShadow = `0 0 ${5 + intensity * 5}px rgba(255, 153, 204, ${0.8 + intensity * 0.2})`;
                }, 16);
            } else if (i === 8) { // Rainbow (T9) - Shifting rainbow colors with glow (10x faster)
                let hue = 0;
                setInterval(() => {
                    hue = (hue + 10) % 360;
                    sphere.style.background = `hsl(${hue}, 100%, 50%)`;
                    sphere.style.boxShadow = `0 0 5px hsl(${hue}, 100%, 50%)`;
                }, 16);
            } else if (i === 9) { // Fire (T10) - Flickering yellow/orange/red/black
                const fireColors = [
                    'rgb(255, 255, 0)', // Bright Yellow
                    'rgb(255, 165, 0)', // Bright Orange
                    'rgb(255, 0, 0)',   // Bright Red
                    'rgb(0, 0, 0)'      // Black
                ];
                setInterval(() => {
                    const color = fireColors[Math.floor(Math.random() * fireColors.length)];
                    sphere.style.background = color;
                    sphere.style.boxShadow = `0 0 5px ${color}`;
                }, 5 + Math.random() * 5);
            }
            tierDiv.appendChild(sphere);
            glowingSpheres.push(sphere);

            const text = document.createElement('span');
            text.style.color = 'black';
            text.style.marginLeft = '5px';
            text.style.fontFamily = 'Arial';
            text.style.fontSize = '14px';
            text.textContent = `T${i + 1} - ${window.percCon.tierCounters[i]}`;
            tierDiv.appendChild(text);

            displayDiv.appendChild(tierDiv);
            sphereElements.push(text);
        }

        let atlasPanel = null;
        let panelPollCount = 0;
        const maxPollAttempts = 20;

        function initializePanels() {
            if (window.debugAtlasPanel) {
                atlasPanel = { element: window.debugAtlasPanel, name: 'Atlas Grid' };
                console.log('Atlas Grid panel initialized:', window.debugAtlasPanel);
            } else if (panelPollCount < maxPollAttempts) {
                console.log('Waiting for debugAtlasPanel... Attempt:', panelPollCount + 1);
                panelPollCount++;
                setTimeout(initializePanels, 1000);
            } else {
                console.error('Failed to initialize debugAtlasPanel after', maxPollAttempts, 'attempts');
            }
        }
        initializePanels();

        function calculateSphereSpeed(tier) {
            const speedMultiplier = 1.0 + ((tier || 1) - 1) * 0.1;
            const baseSpeed = 0.018655 * speedMultiplier;
            const speedVariation = 0.9 + Math.random() * 0.2;
            return baseSpeed * speedVariation;
        }

        window.percCon.calculateSphereSpeed = calculateSphereSpeed;

        function incrementTierCounter(tier) {
            window.percCon.tierCounters[tier - 1]++;
            sphereElements[tier - 1].textContent = `T${tier} - ${window.percCon.tierCounters[tier - 1]}`;
            localStorage.setItem('percConTierCounters', JSON.stringify(window.percCon.tierCounters));
            console.log(`Incremented counter for Tier ${tier}: ${window.percCon.tierCounters[tier - 1]}`);
        }

        window.percCon.incrementTierCounter = incrementTierCounter;

        function animate() {
            requestAnimationFrame(animate);

            if (physicsWorld) {
                physicsWorld.step(1 / 60);
            }

            if (controls.isLocked) {
                const direction = new THREE.Vector3();
                if (move.forward) direction.z += 1;
                if (move.backward) direction.z -= 1;
                if (move.left) direction.x -= 1;
                if (move.right) direction.x += 1;
                direction.normalize();
                const currentSpeed = move.run ? moveSpeed * runMultiplier : moveSpeed;
                direction.multiplyScalar(currentSpeed);
                controls.moveForward(direction.z);
                controls.moveRight(direction.x);

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

            if (window.percCon.floatPerce) {
                window.percCon.floatPerce();
            }

            // Update small spheres in the main animation loop
            if (window.percCon && window.percCon.smallSpheres && window.percCon.camera) {
                const spheresToRemove = [];
                const deltaTime = 1 / 60; // Fixed delta for consistency
                const cameraPosition = window.percCon.camera.position;

                window.percCon.smallSpheres.forEach(sphere => {
                    if (!sphere || !sphere.position || !sphere.userData) {
                        spheresToRemove.push(sphere);
                        return;
                    }
                    sphere.userData.lifetime += deltaTime;
                    if (sphere.userData.lifetime >= 30) {
                        spheresToRemove.push(sphere);
                        return;
                    }

                    // Simplified Movement Logic
                    const direction = cameraPosition.clone().sub(sphere.position).normalize();
                    const speed = sphere.userData.speed || 0;
                    const linearMovement = direction.clone().multiplyScalar(speed * deltaTime * 60);
                    sphere.userData.helixTime += 0.1 * sphere.userData.helixDirection * deltaTime * 60;
                    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
                    const up = new THREE.Vector3().crossVectors(right, direction).normalize();
                    const helixOffset = new THREE.Vector3(
                        Math.cos(sphere.userData.helixTime) * sphere.userData.helixRadius,
                        0,
                        Math.sin(sphere.userData.helixTime) * sphere.userData.helixRadius
                    );
                    const helixMovement = right.multiplyScalar(helixOffset.x).add(up.multiplyScalar(helixOffset.z));
                    sphere.position.add(linearMovement).add(helixMovement);
                    sphere.lookAt(cameraPosition);
                });

                spheresToRemove.forEach(sphere => {
                    if (window.percCon.scene && sphere) {
                        window.percCon.scene.remove(sphere);
                        if (sphere.geometry) sphere.geometry.dispose();
                        if (sphere.material) sphere.material.dispose();
                    }
                    const index = window.percCon.smallSpheres.indexOf(sphere);
                    if (index !== -1) window.percCon.smallSpheres.splice(index, 1);
                });
            }

            renderer.render(scene, camera);
        }

        try {
            animate();
            console.log('Animation loop started');
        } catch (error) {
            console.error('Error in animation loop:', error);
        }

        console.log('script.js fully executed');
    });
}