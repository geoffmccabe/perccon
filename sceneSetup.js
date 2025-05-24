console.log('sceneSetup.js loaded');

function setupScene() {
    console.log('setupScene called');

    const scene = new THREE.Scene();
    console.log('Scene created:', scene);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 2);
    console.log('Camera created, position:', camera.position);

    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    console.log('Renderer created:', renderer);

    // Fog
    scene.fog = new THREE.Fog(0xe0e0e0, 1, 10);
    console.log('Fog added:', scene.fog);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    console.log('Ambient light added:', ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.radius = 8;
    scene.add(directionalLight);
    console.log('Directional light added:', directionalLight);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = Math.random() * 50 + 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
        sizes[i] = Math.random() * 0.2 + 0.1;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const starMaterial = new THREE.PointsMaterial({
        size: 0.2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.7
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.visible = true;
    scene.add(stars);
    console.log('Stars added, count:', starCount, 'visible:', stars.visible);

    // Floor
    const tileTexture = new THREE.TextureLoader().load('images/whitetile1.webp');
    tileTexture.wrapS = tileTexture.wrapT = THREE.RepeatWrapping;
    tileTexture.repeat.set(100, 100);
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: tileTexture, 
        color: 0xdddddd, // Slightly darker white
        roughness: 0.8,
        metalness: 0.0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.visible = true;
    scene.add(floor);
    console.log('Floor added:', floor, 'visible:', floor.visible);

    return { scene, camera, renderer, floor };
}