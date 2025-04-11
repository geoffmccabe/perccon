console.log('shooter.js loaded');

function waitForPercCon(callback) {
    if (window.percCon && window.percCon.floatPerce) {
        callback();
    } else {
        setTimeout(() => waitForPercCon(callback), 100);
    }
}

waitForPercCon(function() {
    const { controls, percs, camera, renderer, scene, move, floatPerce, makePerceAngry } = window.percCon;
    console.log('shooter.js: window.percCon loaded:', window.percCon);

    // Shooter state
    let mode = 'touch'; // Default mode: touch (flip), can toggle to shoot (spin)

    // Sounds (allow overlapping by creating new instances)
    function playBulletFiredSound() {
        const sound = new Audio('sounds/bulletfired.mp3');
        sound.play();
    }
    function playBulletImpactSound() {
        const sound = new Audio('sounds/bullet_impact.mp3');
        sound.play();
    }

    // Impact visual (small spark)
    function createImpact(position) {
        const geometry = new THREE.SphereGeometry(0.01, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow spark
        const spark = new THREE.Mesh(geometry, material);
        spark.position.copy(position);
        scene.add(spark);
        // Remove after 0.5 seconds
        setTimeout(() => {
            scene.remove(spark);
            spark.geometry.dispose();
            spark.material.dispose();
        }, 500);
    }

    // Toggle mode with F key
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyF') {
            mode = (mode === 'touch') ? 'shoot' : 'touch';
            console.log('Mode:', mode);
        }
    });

    // Mouse click to touch or shoot
    document.addEventListener('click', () => {
        if (controls.isLocked) {
            if (mode === 'touch') {
                // Touch mode: flip the perc
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2(0, 0);
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(percs);
                if (intersects.length > 0) {
                    const perc = intersects[0].object;
                    if (!perc.userData.spinning) {
                        perc.userData.spinning = true;
                        perc.userData.targetRotation += Math.PI;
                    }
                }
                // Check PERC-E
                const perceIntersects = raycaster.intersectObject(window.percCon.perce);
                if (perceIntersects.length > 0 && !window.percCon.perce.userData.isAngry) {
                    makePerceAngry();
                }
            } else if (mode === 'shoot') {
                // Shoot mode: fire a bullet
                playBulletFiredSound();

                // Bullet physics (Glock pistol: ~370 m/s muzzle velocity, air friction)
                const muzzleVelocity = 370; // m/s (Glock 9mm)
                const gravity = 9.81; // m/s^2
                const dragCoefficient = 0.0005; // Simplified air friction
                const bulletDirection = new THREE.Vector3();
                camera.getWorldDirection(bulletDirection);
                const bulletVelocity = bulletDirection.clone().multiplyScalar(muzzleVelocity);
                const bulletPosition = camera.position.clone();

                // Create bullet (small sphere for visualization)
                const bulletGeometry = new THREE.SphereGeometry(0.005, 8, 8);
                const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
                bullet.position.copy(bulletPosition);
                scene.add(bullet);

                // Bullet physics simulation
                let time = 0;
                const interval = setInterval(() => {
                    time += 0.016; // ~60 FPS
                    const velocity = bulletVelocity.clone();

                    // Apply gravity
                    velocity.y -= gravity * time;

                    // Apply air friction (simplified drag)
                    velocity.multiplyScalar(Math.exp(-dragCoefficient * time));

                    // Update position
                    const deltaPosition = velocity.clone().multiplyScalar(0.016);
                    const newPosition = bullet.position.clone().add(deltaPosition);
                    bullet.position.copy(newPosition);

                    // Check collision with percs
                    const raycaster = new THREE.Raycaster();
                    raycaster.set(bullet.position, deltaPosition.clone().normalize());
                    raycaster.far = deltaPosition.length();
                    const targets = [...percs, window.percCon.perce];
                    const intersects = raycaster.intersectObjects(targets);
                    if (intersects.length > 0) {
                        const target = intersects[0].object;
                        if (target === window.percCon.perce) {
                            if (!target.userData.isAngry) {
                                playBulletImpactSound();
                                createImpact(intersects[0].point);
                                makePerceAngry();
                            }
                        } else {
                            if (!target.userData.spinning) {
                                playBulletImpactSound();
                                createImpact(intersects[0].point);
                                target.userData.spinning = true;
                                target.userData.targetRotation += Math.PI;
                            }
                        }
                        scene.remove(bullet);
                        bullet.geometry.dispose();
                        bullet.material.dispose();
                        clearInterval(interval);
                        return;
                    }

                    // Remove bullet if it goes too far
                    if (bullet.position.distanceTo(camera.position) > 100) {
                        scene.remove(bullet);
                        bullet.geometry.dispose();
                        bullet.material.dispose();
                        clearInterval(interval);
                    }
                }, 16);
            }
        }
    });

    // Update PERC-E position
    setInterval(() => {
        floatPerce();
    }, 16);
});