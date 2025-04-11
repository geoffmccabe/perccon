// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 2); // Eye level, facing wall
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Fog
scene.fog = new THREE.Fog(0xe0e0e0, 1, 10); // Light gray, ethereal

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
directionalLight.position.set(0, 5, 5);
scene.add(directionalLight);

// Floor (granite tiles)
const tileTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/roughness_map.jpg'); // Mock granite
tileTexture.wrapS = tileTexture.wrapT = THREE.RepeatWrapping;
tileTexture.repeat.set(10, 10);
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ map: tileTexture, color: 0xffffff });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// FPS controls
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
let move = { forward: false, backward: false, left: false, right: false };
document.addEventListener('click', () => controls.lock());
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': move.forward = true; break;
        case 'KeyS': move.backward = true; break;
        case 'KeyA': move.left = true; break;
        case 'KeyD': move.right = true; break;
    }
});
document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': move.forward = false; break;
        case 'KeyS': move.backward = false; break;
        case 'KeyA': move.left = false; break;
        case 'KeyD': move.right = false; break;
    }
});

// Percs
const percs = [];
const percSize = 0.25; // 25cm in Three.js units (meters)
const thickness = percSize * 0.05; // 1.25cm
const gap = 0.05; // 5cm
const startY = 1; // 1m off floor

// Mock perc data
const percData = [
    { id: '001', name: 'Perc #1', desc: 'A mystical artifact', img: 'images/t1.webp' },
    { id: '002', name: 'Perc #2', desc: 'Glowing essence', img: 'images/t2.webp' },
    { id: '003', name: 'Perc #3', desc: 'Ethereal relic', img: 'images/t3.webp' },
    { id: '004', name: 'Perc #4', desc: 'Cosmic fragment', img: 'images/t4.webp' },
    { id: '005', name: 'Perc #5', desc: 'Divine shard', img: 'images/t5.webp' },
];

// Create percs
percData.forEach((data, index) => {
    // Front canvas
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = frontCanvas.height = 512;
    const frontCtx = frontCanvas.getContext('2d');
    const frontImg = new Image();
    frontImg.src = data.img;
    frontImg.onload = () => {
        frontCtx.fillStyle = '#ffffff';
        frontCtx.fillRect(0, 0, 512, 512);
        frontCtx.drawImage(frontImg, 0, 0, 512, 512);
        frontTexture.needsUpdate = true;
        renderer.render(scene, camera);
    };

    // Back canvas
    const backCanvas = document.createElement('canvas');
    backCanvas.width = backCanvas.height = 512;
    const backDiv = document.createElement('div');
    backDiv.className = 'perc-back';
    backDiv.innerHTML = `<h2>${data.name}</h2><p>ID: ${data.id}</p><p>${data.desc}</p>`;
    document.body.appendChild(backDiv); // Temporary for CSS
    const backStyle = getComputedStyle(backDiv);
    const backCtx = backCanvas.getContext('2d');
    backCtx.fillStyle = backStyle.background;
    backCtx.fillRect(0, 0, 512, 512);
    backCtx.fillStyle = backStyle.color;
    backCtx.font = '24px Arial';
    backCtx.fillText(data.name, 20, 40);
    backCtx.font = '16px Arial';
    backCtx.fillText(`ID: ${data.id}`, 20, 80);
    backCtx.fillText(data.desc, 20, 120);
    document.body.removeChild(backDiv);

    // Textures
    const frontTexture = new THREE.CanvasTexture(frontCanvas);
    const backTexture = new THREE.CanvasTexture(backCanvas);

    // Perc body (rounded square)
    const percGeometry = new THREE.BoxGeometry(percSize, percSize, thickness);
    const percMaterials = [
        new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }), // Sides (temp)
        new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ map: backTexture, side: THREE.BackSide }), // Top (back)
        new THREE.MeshBasicMaterial({ map: frontTexture, side: THREE.FrontSide }), // Bottom (front)
        new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
    ];
    const perc = new THREE.Mesh(percGeometry, percMaterials);

    // Foil border
    const foilGeometry = new THREE.BoxGeometry(percSize + 0.02, percSize + 0.02, thickness + 0.02);
    const foilTexture = new THREE.TextureLoader().load('images/foil.webp');
    foilTexture.wrapS = foilTexture.wrapT = THREE.RepeatWrapping;
    const foilMaterial = new THREE.MeshBasicMaterial({ map: foilTexture });
    const foil = new THREE.Mesh(foilGeometry, foilMaterial);
    foil.position.z = -thickness / 2 - 0.01; // Slight offset
    perc.add(foil);

    // Position
    perc.position.set(0, startY + index * (percSize + gap), 0);
    perc.userData = { spinning: false, targetRotation: 0 };
    scene.add(perc);
    percs.push(perc);
});

// Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
document.addEventListener('click', (e) => {
    if (controls.isLocked) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(percs);
        if (intersects.length > 0) {
            const perc = intersects[0].object;
            if (!perc.userData.spinning) {
                perc.userData.spinning = true;
                perc.userData.targetRotation += Math.PI;
            }
        }
    }
});

// Animation
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // Move camera
    if (controls.isLocked) {
        const speed = 0.05;
        const direction = new THREE.Vector3();
        if (move.forward) direction.z -= 1;
        if (move.backward) direction.z += 1;
        if (move.left) direction.x -= 1;
        if (move.right) direction.x += 1;
        direction.normalize().multiplyScalar(speed);
        controls.moveForward(direction.z);
        controls.moveRight(direction.x);
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
        // Animate foil
        perc.children[0].material.map.offset.x = time * 0.1; // Scroll texture
    });

    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
