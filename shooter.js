console.log('shooter.js loaded - Version 14');

function waitForPercCon(callback) {
    if (window.percCon && window.percCon.floatPerce) {
        callback();
    } else {
        setTimeout(() => waitForPercCon(callback), 100);
    }
}

waitForPercCon(function() {
    try {
        console.log('shooter.js: Starting execution');
        const { controls, percs, camera, renderer, scene, move, floatPerce, makePerceAngry } = window.percCon;
        console.log('shooter.js: window.percCon loaded:', window.percCon);

        let mode = 'touch';
        const smallSpheres = [];
        let lastShotTime = 0; // Initialize lastShotTime
        const minShotInterval = 100; // Minimum time between shots in ms

        function playBulletFiredSound() {
            const sound = new Audio('sounds/bulletfired.mp3');
            const variation = Math.min(1, 0.9 + Math.random() * 0.2); // Cap volume at 1
            sound.volume = variation;
            sound.playbackRate = variation;
            sound.play();
        }

        function playBulletImpactSound() {
            const sound = new Audio('sounds/bullet_impact.mp3');
            const variation = Math.min(1, 0.9 + Math.random() * 0.2); // Cap volume at 1
            sound.volume = variation;
            sound.playbackRate = variation;
            sound.play();
        }

        function createImpact(position) {
            const sparkCount = 10;
            const sparkGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(sparkCount * 3);
            const velocities = new Float32Array(sparkCount * 3);
            const opacities = new Float32Array(sparkCount);
            for (let i = 0; i < sparkCount; i++) {
                positions[i * 3] = position.x;
                positions[i * 3 + 1] = position.y;
                positions[i * 3 + 2] = position.z;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const speed = 0.5 + Math.random() * 0.5;
                velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
                velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
                velocities[i * 3 + 2] = speed * Math.cos(phi);
                opacities[i] = 1.0;
            }
            sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            sparkGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
            sparkGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
            const sparkTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');
            const sparkMaterial = new THREE.PointsMaterial({
                size: 0.05,
                map: sparkTexture,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 1.0,
                depthWrite: false
            });
            const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
            scene.add(sparks);
            console.log('Impact sparks created at:', position);

            let sparkTime = 0;
            const sparkInterval = setInterval(() => {
                sparkTime += 0.016;
                const sparkPositions = sparks.geometry.attributes.position.array;
                const sparkVelocities = sparks.geometry.attributes.velocity.array;
                const sparkOpacities = sparks.geometry.attributes.opacity.array;
                for (let i = 0; i < sparkCount; i++) {
                    sparkPositions[i * 3] += sparkVelocities[i * 3] * 0.016;
                    sparkPositions[i * 3 + 1] += sparkVelocities[i * 3 + 1] * 0.016;
                    sparkPositions[i * 3 + 2] += sparkVelocities[i * 3 + 2] * 0.016;
                    sparkOpacities[i] = Math.max(0, 1.0 - sparkTime / 0.5);
                }
                sparkGeometry.attributes.position.needsUpdate = true;
                sparkGeometry.attributes.opacity.needsUpdate = true;
                if (sparkTime >= 0.5) {
                    clearInterval(sparkInterval);
                    scene.remove(sparks);
                    sparks.geometry.dispose();
                    sparks.material.dispose();
                }
            }, 16);
        }

        function createExplosion(position) {
            const explosionCount = 20;
            const explosionGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(explosionCount * 3);
            const velocities = new Float32Array(explosionCount * 3);
            const colors = new Float32Array(explosionCount * 3);
            const opacities = new Float32Array(explosionCount);
            for (let i = 0; i < explosionCount; i++) {
                positions[i * 3] = position.x;
                positions[i * 3 + 1] = position.y;
                positions[i * 3 + 2] = position.z;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const speed = 1.0 + Math.random() * 1.0;
                velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
                velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
                velocities[i * 3 + 2] = speed * Math.cos(phi);
                const colorChoice = Math.random();
                if (colorChoice < 0.33) {
                    colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.0;
                } else if (colorChoice < 0.66) {
                    colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.27; colors[i * 3 + 2] = 0.0;
                } else {
                    colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.0; colors[i * 3 + 2] = 0.0;
                }
                opacities[i] = 1.0;
            }
            explosionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            explosionGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
            explosionGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            explosionGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
            const explosionTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');
            const explosionMaterial = new THREE.PointsMaterial({
                size: 0.1,
                map: explosionTexture,
                blending: THREE.AdditiveBlending,
                transparent: true,
                vertexColors: true,
                opacity: 1.0,
                depthWrite: false
            });
            const explosion = new THREE.Points(explosionGeometry, explosionMaterial);
            scene.add(explosion);
            console.log('Explosion created at:', position);

            let explosionTime = 0;
            const explosionInterval = setInterval(() => {
                explosionTime += 0.016;
                const explosionPositions = explosion.geometry.attributes.position.array;
                const explosionVelocities = explosion.geometry.attributes.velocity.array;
                const explosionOpacities = explosion.geometry.attributes.opacity.array;
                for (let i = 0; i < explosionCount; i++) {
                    explosionPositions[i * 3] += explosionVelocities[i * 3] * 0.016;
                    explosionPositions[i * 3 + 1] += explosionVelocities[i * 3 + 1] * 0.016;
                    explosionPositions[i * 3 + 2] += explosionVelocities[i * 3 + 2] * 0.016;
                    explosionOpacities[i] = Math.max(0, 1.0 - explosionTime / 0.5);
                }
                explosionGeometry.attributes.position.needsUpdate = true;
                explosionGeometry.attributes.opacity.needsUpdate = true;
                if (explosionTime >= 0.5) {
                    clearInterval(explosionInterval);
                    scene.remove(explosion);
                    explosion.geometry.dispose();
                    explosion.material.dispose();
                }
            }, 16);
        }

        function createSmallSphere(position, videoTexture) {
            console.log('Creating small sphere at:', position);
            
            const tiers = [
                { tier: 1, color: 0x333333, speedMultiplier: 1.0, rangeEnd: 402, name: 'Dark Grey', video: null },
                { tier: 2, color: 0xFFA500, speedMultiplier: 1.1, rangeEnd: 643, name: 'Golden Yellow/Orange', video: null },
                { tier: 3, color: 0x00FF00, speedMultiplier: 1.2, rangeEnd: 788, name: 'Green', video: null },
                { tier: 4, color: 0x0000FF, speedMultiplier: 1.3, rangeEnd: 876, name: 'Blue', video: null },
                { tier: 5, color: 0x800080, speedMultiplier: 1.4, rangeEnd: 929, name: 'Purple', video: null },
                { tier: 6, color: 0xFF0000, speedMultiplier: 1.5, rangeEnd: 960, name: 'Red', video: null },
                { tier: 7, color: 0xFFFFFF, speedMultiplier: 1.6, rangeEnd: 979, name: 'White', video: null },
                { tier: 8, color: 0xFF69B4, speedMultiplier: 1.7, rangeEnd: 990, name: 'Pink', video: null },
                { tier: 9, color: 0xFFFFFF, speedMultiplier: 1.8, rangeEnd: 996, name: 'Rainbow', video: null },
                { tier: 10, color: 0xFF4500, speedMultiplier: 1.9, rangeEnd: 1000, name: 'Fire', video: null }
            ];

            function getRandomTier() {
                const rand = Math.floor(Math.random() * 1000) + 1;
                for (let i = 0; i < tiers.length; i++) {
                    if (rand <= tiers[i].rangeEnd) {
                        return tiers[i];
                    }
                }
                return tiers[tiers.length - 1];
            }

            const tier = getRandomTier();
            const diameter = 0.15 + Math.random() * 0.2;
            const geometry = new THREE.SphereGeometry(diameter / 2, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: tier.color,
                metalness: tier.tier === 7 ? 0.9 : 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 1.0
            });

            if (tier.tier === 9) {
                let hue = 0;
                setInterval(() => {
                    hue = (hue + 0.01) % 1;
                    const color = new THREE.Color().setHSL(hue, 1, 0.5);
                    material.color.set(color);
                }, 16);
            }

            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(position);
            scene.add(sphere);
            smallSpheres.push(sphere);
            console.log('Small sphere added:', sphere, 'Tier:', tier.tier);

            const helixDirection = Math.random() < 0.5 ? 1 : -1;
            const speed = window.percCon.calculateSphereSpeed(tier.tier);
            const radiusVariation = 0.5 + Math.random() * 1.0;
            const baseRadius = 0.1;
            const helixRadius = baseRadius * radiusVariation;
            console.log(`Small sphere parameters - speed: ${speed}, helixDirection: ${helixDirection}, helixRadius: ${helixRadius}`);

            // Store movement parameters in userData for animation loop
            sphere.userData = {
                tier: tier.tier,
                lifetime: 0,
                helixTime: Math.random() * Math.PI * 2,
                helixDirection: helixDirection,
                speed: speed,
                helixRadius: helixRadius
            };
        }

        window.percCon.smallSpheres = smallSpheres;
        window.percCon.createSmallSphere = createSmallSphere;

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR') {
                mode = (mode === 'touch') ? 'shoot' : 'touch';
                console.log('Mode changed to:', mode);
            }
        });

        document.addEventListener('mousedown', (e) => {
            // Ensure controls exist and check if locked
            if (!window.percCon || !window.percCon.controls || !window.percCon.controls.isLocked) {
                return; // Do nothing if not locked (script.js handles locking click)
            }

            // Check if it was the LEFT mouse button (button index 0)
            if (e.button !== 0) {
                return; // Ignore non-left clicks
            }

            // Check rate limit for left clicks
            const currentTime = Date.now();
            if (currentTime - lastShotTime < minShotInterval) {
                return; // Rate limit active
            }
            lastShotTime = currentTime;

            if (mode === 'touch') {
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2(0, 0);
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(percs, true);
                if (intersects.length > 0) {
                    const target = intersects[0].object;
                    const perc = target.parent && target.parent.type === 'Group' ? target.parent : target;
                    if (!perc.userData.spinning) {
                        perc.userData.spinning = true;
                        perc.userData.targetRotation += Math.PI;
                        console.log('Perc flipped:', perc);
                    }
                } else {
                    console.log('No Perc hit in touch mode');
                }
            } else if (mode === 'shoot') {
                playBulletFiredSound();

                const muzzleVelocity = 370;
                const gravity = 9.81;
                const dragCoefficient = 0.0005;
                const bulletDirection = new THREE.Vector3();
                camera.getWorldDirection(bulletDirection);
                const bulletVelocity = bulletDirection.clone().multiplyScalar(muzzleVelocity);
                const bulletPosition = camera.position.clone();

                const bulletGeometry = new THREE.SphereGeometry(0.005, 8, 8);
                const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
                const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
                bullet.position.copy(bulletPosition);
                scene.add(bullet);
                bullet.visible = false; // Initially invisible
                console.log('Bullet created at:', bullet.position);

                let previousPosition = bullet.position.clone();

                const trailPoints = [bullet.position.clone()];
                const trailGeometry = new THREE.BufferGeometry();
                const trailMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x808080, 
                    transparent: true, 
                    opacity: 0.5 
                });
                const trail = new THREE.Line(trailGeometry, trailMaterial);
                scene.add(trail);
                console.log('Trail created');

                let time = 0;
                const interval = setInterval(() => {
                    time += 0.016;
                    const velocity = bulletVelocity.clone();
                    velocity.y -= gravity * time;
                    velocity.multiplyScalar(Math.exp(-dragCoefficient * time));
                    const deltaPosition = velocity.clone().multiplyScalar(0.016);
                    const newPosition = bullet.position.clone().add(deltaPosition);
                    bullet.position.copy(newPosition);

                    const distanceToCamera = bullet.position.distanceTo(camera.position);
                    bullet.visible = distanceToCamera > 10;

                    console.log('Bullet position:', bullet.position);

                    trailPoints.push(bullet.position.clone());
                    if (trailPoints.length > 20) {
                        trailPoints.shift();
                    }
                    trail.geometry.setFromPoints(trailPoints);
                    trail.material.opacity = Math.max(0, trail.material.opacity - 0.05);

                    const raycaster = new THREE.Raycaster();
                    const direction = newPosition.clone().sub(previousPosition).normalize();
                    raycaster.set(previousPosition, direction);
                    raycaster.far = newPosition.distanceTo(previousPosition);
                    const targets = [...percs, window.percCon.perce, ...smallSpheres];
                    const intersects = raycaster.intersectObjects(targets, true);
                    if (intersects.length > 0) {
                        const target = intersects[0].object;
                        const targetParent = target.parent && target.parent.type === 'Group' ? target.parent : target;
                        console.log('Bullet hit:', target === window.percCon.perce ? 'PERC-E' : smallSpheres.includes(target) ? 'Small Sphere' : 'Perc');
                        playBulletImpactSound();
                        createImpact(intersects[0].point);
                        if (target === window.percCon.perce) {
                            if (!target.userData.isAngry) {
                                console.log('PERC-E hit, triggering angry effect');
                                makePerceAngry();
                            } else if (target.userData.isAngry && window.percCon.shakeTime >= 2 && window.percCon.shakeTime < 8) {
                                console.log('PERC-E is angry, spawning small spheres (shakeTime:', window.percCon.shakeTime, ')');
                                for (let i = 0; i < 3; i++) {
                                    createSmallSphere(intersects[0].point, null);
                                }
                            } else {
                                console.log('PERC-E is angry, but not in spawn window (shakeTime:', window.percCon.shakeTime, ')');
                            }
                        } else if (smallSpheres.includes(target)) {
                            console.log('Small sphere hit, removing');
                            createExplosion(target.position);
                            playBulletImpactSound();
                            if (window.percCon.incrementTierCounter) {
                                window.percCon.incrementTierCounter(target.userData.tier);
                            } else {
                                console.error('incrementTierCounter not defined');
                            }
                            scene.remove(target);
                            const idx = smallSpheres.indexOf(target);
                            if (idx !== -1) smallSpheres.splice(idx, 1);
                        } else if (targetParent.userData && targetParent.userData.spinning !== undefined) {
                            if (!targetParent.userData.spinning) {
                                targetParent.userData.spinning = true;
                                targetParent.userData.targetRotation += Math.PI;
                            }
                        }
                        scene.remove(bullet);
                        bullet.geometry.dispose();
                        bullet.material.dispose();
                        scene.remove(trail);
                        trail.geometry.dispose();
                        trail.material.dispose();
                        clearInterval(interval);
                        return;
                    }

                    previousPosition.copy(bullet.position);

                    if (bullet.position.distanceTo(camera.position) > 100) {
                        console.log('Bullet removed: too far');
                        scene.remove(bullet);
                        bullet.geometry.eachAttribute(attr => attr.array = null);
                        bullet.geometry.dispose();
                        bullet.material.dispose();
                        scene.remove(trail);
                        trail.geometry.eachAttribute(attr => attr.array = null);
                        trail.geometry.dispose();
                        trail.material.dispose();
                        clearInterval(interval);
                    }
                }, 16);
            }
        });

        setInterval(() => {
            if (window.percCon.floatPerce) {
                window.percCon.floatPerce();
            }
        }, 16);
    } catch (error) {
        console.error('Error in shooter.js execution:', error);
    }
});