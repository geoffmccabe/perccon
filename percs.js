console.log('percs.js loaded');

function createPercs(scene) {
    console.log('createPercs called');

    const percs = [];
    const percSize = 0.25;
    const thickness = percSize * 0.05;
    const gap = 0.05;
    const startY = 1;
    const columnGap = 0.1;
    const totalPerks = 1000;
    const percsPerColumn = 5;
    const totalColumns = Math.ceil(totalPerks / percsPerColumn);
    const detailDistance = 10;
    const lowResDistance = 20;
    const visibilityDistance = 50;

    const fpsDisplay = document.createElement('div');
    fpsDisplay.style.position = 'fixed';
    fpsDisplay.style.top = '10px';
    fpsDisplay.style.left = '10px';
    fpsDisplay.style.color = 'white';
    fpsDisplay.style.fontFamily = 'Arial';
    fpsDisplay.style.fontSize = '12px';
    fpsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsDisplay.style.padding = '5px';
    document.body.appendChild(fpsDisplay);
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;

    function updateFPS() {
        const currentTime = performance.now();
        frameCount++;
        if (currentTime - lastTime >= 1000) {
            fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            fpsDisplay.textContent = `FPS: ${fps}`;
            frameCount = 0;
            lastTime = currentTime;
        }
    }

    const basePercData = [
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

    const atlasSize = 2048;
    const textureSize = 512;
    const texturesPerRow = Math.floor(atlasSize / textureSize);
    const maxTextures = Math.floor((atlasSize / textureSize) * (atlasSize / textureSize));
    let currentAtlasIndex = 0;
    let atlasTextures = [];
    let atlasCanvases = [];
    let atlasCtxs = [];
    let atlasCounts = [];
    let atlasMaterials = [];

    const lowResSize = 64;
    const lowResAtlasSize = 1024;
    const lowResTexturesPerRow = Math.floor(lowResAtlasSize / lowResSize);
    const maxLowResTextures = Math.floor((lowResAtlasSize / lowResSize) * (lowResAtlasSize / lowResSize));
    let currentLowResAtlasIndex = 0;
    let lowResAtlasTextures = [];
    let lowResAtlasCanvases = [];
    let lowResAtlasCtxs = [];
    let lowResAtlasCounts = [];
    let lowResAtlasMaterials = [];

    const errorCanvas = document.createElement('canvas');
    errorCanvas.width = errorCanvas.height = 512;
    const errorCtx = errorCanvas.getContext('2d');
    errorCtx.fillStyle = 'red';
    errorCtx.fillRect(0, 0, 512, 512);
    errorCtx.fillStyle = 'white';
    errorCtx.font = '48px Arial';
    errorCtx.fillText('TEXTURE', 100, 200);
    errorCtx.fillText('MISSING', 100, 300);
    const errorTexture = new THREE.CanvasTexture(errorCanvas);

    function createNewAtlas(isLowRes = false) {
        const size = isLowRes ? lowResAtlasSize : atlasSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (isLowRes) {
            lowResAtlasCanvases.push(canvas);
            lowResAtlasCtxs.push(ctx);
            lowResAtlasCounts.push(0);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            lowResAtlasTextures.push(texture);
            lowResAtlasMaterials.push(new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
            currentLowResAtlasIndex = lowResAtlasCanvases.length - 1;
            console.log(`Created new low-res texture atlas #${currentLowResAtlasIndex + 1}`);
        } else {
            atlasCanvases.push(canvas);
            atlasCtxs.push(ctx);
            atlasCounts.push(0);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            atlasTextures.push(texture);
            atlasMaterials.push(new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true }));
            currentAtlasIndex = atlasCanvases.length - 1;
            console.log(`Created new full-res texture atlas #${currentAtlasIndex + 1}`);
        }
    }

    createNewAtlas();
    createNewAtlas(true);

    const atlasMapping = new Map();
    const lowResAtlasMapping = new Map();

    const atlasPositions = [
        { atlasIndex: 0, offsetX: 0.00, offsetY: 0.00, x:    0, y:    0 },
        { atlasIndex: 0, offsetX: 0.25, offsetY: 0.00, x:  512, y:    0 },
        { atlasIndex: 0, offsetX: 0.50, offsetY: 0.00, x: 1024, y:    0 },
        { atlasIndex: 0, offsetX: 0.75, offsetY: 0.00, x: 1536, y:    0 },
        { atlasIndex: 0, offsetX: 0.00, offsetY: 0.25, x:    0, y:  512 },
        { atlasIndex: 0, offsetX: 0.25, offsetY: 0.25, x:  512, y:  512 },
        { atlasIndex: 0, offsetX: 0.50, offsetY: 0.25, x: 1024, y:  512 },
        { atlasIndex: 0, offsetX: 0.75, offsetY: 0.25, x: 1536, y:  512 },
        { atlasIndex: 0, offsetX: 0.00, offsetY: 0.50, x:    0, y: 1024 },
        { atlasIndex: 0, offsetX: 0.25, offsetY: 0.50, x:  512, y: 1024 },
    ];

    function computeLowResTexture(img, targetCtx, x, y) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 512;
        tempCanvas.height = 512;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, 512, 512);

        const gridSize = 64;
        for (let gy = 0; gy < 8; gy++) {
            for (let gx = 0; gx < 8; gx++) {
                const imageData = tempCtx.getImageData(gx * gridSize, gy * gridSize, gridSize, gridSize);
                const data = imageData.data;
                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }

                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                targetCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                targetCtx.fillRect(x + gx * 8, y + gy * 8, 8, 8);
            }
        }
    }

    let debugCanvas = null;
    function debugAtlasTexture(atlasIndex) {
        if (!atlasTextures[atlasIndex] || !atlasTextures[atlasIndex].image) return;
        debugCanvas = document.createElement('canvas');
        debugCanvas.width = 512;
        debugCanvas.height = 512;
        const ctx = debugCanvas.getContext('2d');
        ctx.drawImage(atlasTextures[atlasIndex].image, 0, 0, 512, 512);
        document.body.appendChild(debugCanvas);
        debugCanvas.style.position = 'fixed';
        debugCanvas.style.top = '0';
        debugCanvas.style.left = '0';
        debugCanvas.style.zIndex = '1000';
        debugCanvas.style.border = '2px solid red';
        debugCanvas.style.display = 'none';
        window.debugAtlasPanel = debugCanvas;
    }

    let loadedImages = 0;
    function loadNextImage(index) {
        if (index >= basePercData.length) {
            debugAtlasTexture(0);
            console.log('All images loaded into atlas');
            createPercsNow();
            return;
        }

        const data = basePercData[index];
        const img = new Image();
        img.src = data.img;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const pos = atlasPositions[index];
            atlasCtxs[pos.atlasIndex].drawImage(img, pos.x, pos.y, textureSize, textureSize);
            atlasTextures[pos.atlasIndex].needsUpdate = true;
            atlasMapping.set(index, {
                atlasIndex: pos.atlasIndex,
                offsetX: pos.offsetX,
                offsetY: pos.offsetY,
            });
            console.log(`Added full-res texture for Perc #${index + 1} to atlas #${pos.atlasIndex + 1} at position (${pos.x}, ${pos.y})`);

            if (lowResAtlasCounts[currentLowResAtlasIndex] >= maxLowResTextures) {
                createNewAtlas(true);
            }
            const lowResAtlasIndex = currentLowResAtlasIndex;
            const count = lowResAtlasCounts[lowResAtlasIndex];
            const row = Math.floor(count / lowResTexturesPerRow);
            const col = count % lowResTexturesPerRow;
            const x = col * lowResSize;
            const y = row * lowResSize;
            computeLowResTexture(img, lowResAtlasCtxs[lowResAtlasIndex], x, y);
            lowResAtlasTextures[lowResAtlasIndex].needsUpdate = true;
            lowResAtlasCounts[lowResAtlasIndex]++;
            lowResAtlasMapping.set(index, {
                atlasIndex: lowResAtlasIndex,
                offsetX: col * (lowResSize / lowResAtlasSize),
                offsetY: row * (lowResSize / lowResAtlasSize),
            });
            console.log(`Added low-res texture for Perc #${index + 1} to atlas #${lowResAtlasIndex + 1} at position (${x}, ${y})`);

            loadedImages++;
            loadNextImage(index + 1);
        };
        img.onerror = () => {
            console.error(`Failed to load image for Perc #${index + 1}: ${data.img}`);
            const pos = atlasPositions[index];
            atlasCtxs[pos.atlasIndex].drawImage(errorCanvas, pos.x, pos.y, textureSize, textureSize);
            atlasTextures[pos.atlasIndex].needsUpdate = true;
            atlasMapping.set(index, {
                atlasIndex: pos.atlasIndex,
                offsetX: pos.offsetX,
                offsetY: pos.offsetY,
            });

            if (lowResAtlasCounts[currentLowResAtlasIndex] >= maxLowResTextures) {
                createNewAtlas(true);
            }
            const lowResAtlasIndex = currentLowResAtlasIndex;
            const count = lowResAtlasCounts[lowResAtlasIndex];
            const row = Math.floor(count / lowResTexturesPerRow);
            const col = count % lowResTexturesPerRow;
            const x = col * lowResSize;
            const y = row * lowResSize;
            lowResAtlasCtxs[lowResAtlasIndex].drawImage(errorCanvas, x, y, lowResSize, lowResSize);
            lowResAtlasTextures[lowResAtlasIndex].needsUpdate = true;
            lowResAtlasCounts[lowResAtlasIndex]++;
            lowResAtlasMapping.set(index, {
                atlasIndex: lowResAtlasIndex,
                offsetX: col * (lowResSize / lowResAtlasSize),
                offsetY: row * (lowResSize / lowResAtlasSize),
            });

            loadedImages++;
            loadNextImage(index + 1);
        };
    }

    const backCanvas = document.createElement('canvas');
    backCanvas.width = backCanvas.height = 512;
    const backCtx = backCanvas.getContext('2d');
    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.needsUpdate = true;

    const foilTexture = new THREE.TextureLoader().load('images/foil.webp');
    const foilMaterial = new THREE.MeshBasicMaterial({ map: foilTexture });

    function createPercsNow() {
        for (let i = 0; i < totalPerks; i++) {
            createPerc(i, 0);
        }

        for (let i = 0; i < totalPerks; i++) {
            createPerc(i, -3);
        }

        if (window.percCon && window.percCon.renderer && window.percCon.scene && window.percCon.camera) {
            function animateRender() {
                requestAnimationFrame(animateRender);
                window.percCon.renderer.render(window.percCon.scene, window.percCon.camera);
                updateFPS();
            }
            animateRender();
            console.log('Forced render update after creating all PERCs');
        } else {
            console.error('Cannot force render update: window.percCon or its properties are not set');
        }

        console.log('Returning percs array with length:', percs.length);
    }

    function createPerc(index, zOffset) {
        try {
            const dataIndex = index % basePercData.length;
            const data = basePercData[dataIndex];

            backCtx.fillStyle = '#1a1a1a';
            backCtx.fillRect(0, 0, 512, 512);
            backCtx.fillStyle = '#ffffff';
            backCtx.font = '24px Arial';
            backCtx.fillText(data.name, 20, 40);
            backCtx.font = '16px Arial';
            backCtx.fillText(`ID: ${data.id}`, 20, 80);
            backCtx.fillText(data.desc, 20, 120);
            backTexture.needsUpdate = true;
            if (index === 0 || (index + 1) % 100 === 0) {
                console.log('Back canvas updated for:', data.name);
            }

            const col = Math.floor(index / percsPerColumn);
            const row = index % percsPerColumn;
            const x = col * (percSize + columnGap) - (totalColumns * (percSize + columnGap)) / 2;
            const y = startY + row * (percSize + gap);
            const z = zOffset;
            const distance = Math.sqrt(x * x + (z - 2) * (z - 2));

            if (distance > visibilityDistance) {
                return;
            }

            const atlasInfo = atlasMapping.get(dataIndex);
            const lowResAtlasInfo = lowResAtlasMapping.get(dataIndex);
            if (!atlasInfo || !atlasTextures[atlasInfo.atlasIndex].image) {
                console.error(`Texture not ready for Perc #${index + 1}`);
                return;
            }

            let perc;
            const isSecondSet = zOffset < 0;
            let geometry, backGeometry;
            if (isSecondSet) {
                const shape = new THREE.Shape();
                const cornerRadius = 0.05;
                shape.moveTo(-percSize / 2 + cornerRadius, -percSize / 2);
                shape.lineTo(percSize / 2 - cornerRadius, -percSize / 2);
                shape.quadraticCurveTo(percSize / 2, -percSize / 2, percSize / 2, -percSize / 2 + cornerRadius);
                shape.lineTo(percSize / 2, percSize / 2 - cornerRadius);
                shape.quadraticCurveTo(percSize / 2, percSize / 2, percSize / 2 - cornerRadius, percSize / 2);
                shape.lineTo(-percSize / 2 + cornerRadius, percSize / 2);
                shape.quadraticCurveTo(-percSize / 2, percSize / 2, -percSize / 2, percSize / 2 - cornerRadius);
                shape.lineTo(-percSize / 2, -percSize / 2 + cornerRadius);
                shape.quadraticCurveTo(-percSize / 2, -percSize / 2, -percSize / 2 + cornerRadius, -percSize / 2);
                const extrudeSettings = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3, UVGenerator: THREE.ExtrudeGeometry.WorldUVGenerator };
                geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                backGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

                // Set UVs using modern attributes.uv
                const uvAttribute = geometry.attributes.uv;
                for (let j = 0; j < uvAttribute.count; j++) {
                    const x = (j % 2 === 0) ? atlasInfo.offsetX : atlasInfo.offsetX + 0.25;
                    const y = (j < 2 || j > 5) ? atlasInfo.offsetY : atlasInfo.offsetY + 0.25;
                    uvAttribute.setXY(j, x, y);
                }
                uvAttribute.needsUpdate = true;

                // Removed deprecated faceVertexUvs usage to fix gaps
                /*
                const faceVertexUvs = geometry.faceVertexUvs[0];
                for (let i = 0; i < faceVertexUvs.length; i++) {
                    faceVertexUvs[i] = [
                        new THREE.Vector2(atlasInfo.offsetX, atlasInfo.offsetY + 0.25),
                        new THREE.Vector2(atlasInfo.offsetX + 0.25, atlasInfo.offsetY + 0.25),
                        new THREE.Vector2(atlasInfo.offsetX, atlasInfo.offsetY)
                    ];
                }
                geometry.uvsNeedUpdate = true;
                */
            } else {
                geometry = new THREE.PlaneGeometry(percSize, percSize);
                backGeometry = new THREE.PlaneGeometry(percSize, percSize);
            }

            const uvs = geometry.attributes.uv.array;
            uvs[0] = atlasInfo.offsetX; uvs[1] = atlasInfo.offsetY + 0.25;
            uvs[2] = atlasInfo.offsetX + 0.25; uvs[3] = atlasInfo.offsetY + 0.25;
            uvs[4] = atlasInfo.offsetX; uvs[5] = atlasInfo.offsetY;
            uvs[6] = atlasInfo.offsetX + 0.25; uvs[7] = atlasInfo.offsetY;
            geometry.attributes.uv.needsUpdate = true;

            if (distance < detailDistance) {
                const frontMaterial = atlasMaterials[atlasInfo.atlasIndex];
                const backMaterial = new THREE.MeshBasicMaterial({ map: backTexture, side: THREE.DoubleSide });
                const frontMesh = new THREE.Mesh(geometry, frontMaterial);
                const backMesh = new THREE.Mesh(backGeometry, backMaterial);
                frontMesh.position.set(0, 0, thickness / 2);
                backMesh.position.set(0, 0, -thickness / 2);
                backMesh.rotation.y = Math.PI;
                frontMesh.castShadow = true;
                backMesh.castShadow = true;
                perc = new THREE.Group();
                perc.add(frontMesh);
                perc.add(backMesh);
                if (index === 0 || (index + 1) % 100 === 0) {
                    console.log(`Perc #${index + 1}: Using full detail at distance ${distance}`);
                }

                if (!isSecondSet) {
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
                    edges.forEach(edge => {
                        edge.castShadow = true;
                        perc.add(edge);
                    });
                }
            } else if (distance < lowResDistance) {
                const geometry = isSecondSet ? new THREE.PlaneGeometry(percSize * 0.9, percSize * 0.9) : new THREE.PlaneGeometry(percSize, percSize);
                const atlasInfo = atlasMapping.get(dataIndex) || { atlasIndex: 0, offsetX: 0, offsetY: 0 };
                const material = atlasMaterials[atlasInfo.atlasIndex];
                const uvs = geometry.attributes.uv.array;
                uvs[0] = atlasInfo.offsetX; uvs[1] = atlasInfo.offsetY + 0.25;
                uvs[2] = atlasInfo.offsetX + 0.25; uvs[3] = atlasInfo.offsetY + 0.25;
                uvs[4] = atlasInfo.offsetX; uvs[5] = atlasInfo.offsetY;
                uvs[6] = atlasInfo.offsetX + 0.25; uvs[7] = atlasInfo.offsetY;
                geometry.attributes.uv.needsUpdate = true;
                perc = new THREE.Mesh(geometry, material);
                perc.castShadow = true;
                if (index === 0 || (index + 1) % 100 === 0) {
                    console.log(`Perc #${index + 1}: Using simplified full-res at distance ${distance}`);
                }
            } else {
                const geometry = isSecondSet ? new THREE.PlaneGeometry(percSize * 0.9, percSize * 0.9) : new THREE.PlaneGeometry(percSize, percSize);
                const lowResAtlasInfo = lowResAtlasMapping.get(dataIndex) || { atlasIndex: 0, offsetX: 0, offsetY: 0 };
                const material = lowResAtlasMaterials[lowResAtlasInfo.atlasIndex];
                const uvs = geometry.attributes.uv.array;
                uvs[0] = lowResAtlasInfo.offsetX; uvs[1] = lowResAtlasInfo.offsetY + (1 / lowResTexturesPerRow);
                uvs[2] = lowResAtlasInfo.offsetX + (1 / lowResTexturesPerRow); uvs[3] = lowResAtlasInfo.offsetY + (1 / lowResTexturesPerRow);
                uvs[4] = lowResAtlasInfo.offsetX; uvs[5] = lowResAtlasInfo.offsetY;
                uvs[6] = lowResAtlasInfo.offsetX + (1 / lowResTexturesPerRow); uvs[7] = lowResAtlasInfo.offsetY;
                geometry.attributes.uv.needsUpdate = true;
                perc = new THREE.Mesh(geometry, material);
                perc.castShadow = true;
                if (index === 0 || (index + 1) % 100 === 0) {
                    console.log(`Perc #${index + 1}: Using low-res 8x8 grid at distance ${distance}`);
                }
            }

            perc.position.set(x, y, z);
            perc.userData = { spinning: false, targetRotation: 0 };
            scene.add(perc);
            if (index === 0 || (index + 1) % 100 === 0) {
                console.log(`Perc #${index + 1} added to scene at position:`, perc.position);
            }
            percs.push(perc);
        } catch (error) {
            if (index === 0 || (index + 1) % 100 === 0) {
                console.error(`Failed to create Perc #${index + 1}:`, error);
            }
        }
    }

    loadNextImage(0);
    return percs;
}