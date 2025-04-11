console.log('percs.js loaded');

function createPercs(scene) {
    console.log('createPercs called');

    const percs = [];
    const percSize = 0.25;
    const thickness = percSize * 0.05;
    const gap = 0.05;
    const startY = 1;
    const columnGap = 0.3;

    // Perc data (10 percs)
    const percData = [
        { id: '001', name: 'Perc #1', desc: 'Mystical artifact', img: 'images/t1.webp' },
        { id: '002', name: 'Perc #2', desc: 'Glowing essence', img: 'images/t2.webp' },
        { id: '003', name: 'Perc #3', desc: 'Ethereal relic', img: 'images/t3.webp' },
        { id: '004', name: 'Perc #4', desc: 'Cosmic fragment', img: 'images/t4.webp' },
        { id: '005', name: 'Perc #5', desc: 'Divine shard', img: 'images/t5.webp' },
        { id: '006', name: 'Perc #6', desc: 'Celestial glow', img: 'images/t6.webp' },
        { id: '007', name: 'Perc #7', desc: 'Starborn relic', img: 'images/t7.webp' },
        { id: '008', name: 'Perc #8', desc: 'Lunar essence', img: 'images/t8.webp' },
        { id: '009', name: 'Perc #9', desc: 'Astral fragment', img: 'images/t9.webp' },
        { id: '010', name: 'Perc #10', desc: 'Divine light', img: 'images/t10.webp' },
    ];

    // Create percs
    percData.forEach((data, index) => {
        // Front texture (use TextureLoader)
        console.log('Attempting to load image:', data.img);
        const frontTexture = new THREE.TextureLoader().load(
            data.img,
            () => {
                console.log(`Loaded image: ${data.img}`);
                frontTexture.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.error(`Failed to load image: ${data.img}`, err);
                // Fallback to a known image
                frontTexture.image = new Image();
                frontTexture.image.src = 'https://via.placeholder.com/512?text=Test';
                frontTexture.image.onload = () => {
                    console.log('Fallback image loaded for:', data.img);
                    frontTexture.needsUpdate = true;
                };
            }
        );

        // Back canvas (NFT-like data)
        const backCanvas = document.createElement('canvas');
        backCanvas.width = backCanvas.height = 512;
        const backCtx = backCanvas.getContext('2d');
        backCtx.fillStyle = '#1a1a1a';
        backCtx.fillRect(0, 0, 512, 512);
        backCtx.fillStyle = '#ffffff';
        backCtx.font = '24px Arial';
        backCtx.fillText(data.name, 20, 40);
        backCtx.font = '16px Arial';
        backCtx.fillText(`ID: ${data.id}`, 20, 80);
        backCtx.fillText(data.desc, 20, 120);
        console.log('Back canvas created for:', data.name);

        // Textures
        const backTexture = new THREE.CanvasTexture(backCanvas);
        backTexture.needsUpdate = true;
        console.log('Textures created for:', data.name);

        // Perc body
        const percGeometry = new THREE.BoxGeometry(percSize, percSize, thickness);
        const percMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x000000 }),
            new THREE.MeshBasicMaterial({ color: 0x000000 }),
            new THREE.MeshBasicMaterial({ map: backTexture, side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: frontTexture, side: THREE.FrontSide }),
            new THREE.MeshBasicMaterial({ color: 0x000000 }),
            new THREE.MeshBasicMaterial({ color: 0x000000 }),
        ];
        const perc = new THREE.Mesh(percGeometry, percMaterials);
        console.log('Perc created:', data.name);

        // Foil border (edges only)
        const foilTexture = new THREE.TextureLoader().load('images/foil.webp');
        const foilMaterial = new THREE.MeshBasicMaterial({ map: foilTexture });
        const edgeWidth = 0.005;
        const edgeHeight = percSize;
        const edgeDepth = thickness;
        const edges = [
            new THREE.Mesh(new THREE.BoxGeometry(edgeHeight, edgeWidth, edgeDepth), foilMaterial),
            new THREE.Mesh(new THREE.BoxGeometry(edgeHeight, edgeWidth, edgeDepth), foilMaterial),
            new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, edgeHeight, edgeDepth), foilMaterial),
            new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, edgeHeight, edgeDepth), foilMaterial),
        ];
        edges[0].position.set(0, percSize / 2, 0);
        edges[1].position.set(0, -percSize / 2, 0);
        edges[2].position.set(-percSize / 2, 0, 0);
        edges[3].position.set(percSize / 2, 0, 0);
        edges.forEach(edge => perc.add(edge));

        // Position (two columns)
        const col = Math.floor(index / 5);
        const row = index % 5;
        perc.position.set(col * (percSize + columnGap) - 0.15, startY + row * (percSize + gap), 0);
        perc.userData = { spinning: false, targetRotation: 0 };
        scene.add(perc);
        percs.push(perc);
    });

    return percs;
}