// REMOVED IMPORTS - Using Global THREE variable from script tags
// import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { DragControls } from 'three/addons/controls/DragControls.js';

// Scene Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.05);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Controls (Accessing from THREE global)
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.maxDistance = 15;
orbitControls.minDistance = 2;

// Lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const rimLight = new THREE.PointLight(0x7000ff, 1.5, 50);
rimLight.position.set(-5, 2, -5);
scene.add(rimLight);

// --- AVATAR FACTORY ---
const draggableObjects = []; // Objects that can be dragged

function createAvatar(color, xPos, zPos) {
    const group = new THREE.Group();
    group.position.set(xPos, 0, zPos);
    scene.add(group);

    // Materials
    const mainMaterial = new THREE.MeshPhongMaterial({
        color: 0x111111,
        emissive: color,
        emissiveIntensity: 0.2,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });

    const coreMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
    });

    // 1. Head
    const headGeo = new THREE.IcosahedronGeometry(0.6, 1);
    const head = new THREE.Mesh(headGeo, mainMaterial);
    head.position.y = 3.2;
    group.add(head);
    draggableObjects.push(head); // Make head draggable

    // Glowing brain/core
    const headCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), coreMaterial);
    head.add(headCore);

    // 2. Torso
    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8);
    const torso = new THREE.Mesh(torsoGeo, mainMaterial);
    torso.position.y = 1.8;
    group.add(torso);
    // Torso usually rigid, but can be added if desired

    // 3. Limbs Helper
    function createLimb(x, y, z, rotZ, isLeg = false) {
        const geo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
        const limb = new THREE.Mesh(geo, mainMaterial);
        limb.position.set(x, y, z);
        limb.rotation.z = rotZ;

        // Add extremities (hands/feet)
        const endGeo = new THREE.OctahedronGeometry(0.15, 0);
        const endMesh = new THREE.Mesh(endGeo, mainMaterial);
        endMesh.position.y = isLeg ? -0.7 : -0.7; // Bottom of limb
        limb.add(endMesh);

        group.add(limb);
        draggableObjects.push(limb); // Make limb draggable
        return limb;
    }

    // Arms
    const leftArm = createLimb(-1.1, 1.5, 0, 0.2);
    const rightArm = createLimb(1.1, 1.5, 0, -0.2);

    // Legs
    const leftLeg = createLimb(-0.5, 0.5, 0, 0, true);
    const rightLeg = createLimb(0.5, 0.5, 0, 0, true);

    return { group, head, torso };
}

// Create 2 Avatars
const avatar1 = createAvatar(0x00d4ff, -2, 0); // Cyan
const avatar2 = createAvatar(0xff0055, 2, 0);  // Magenta/Red

// --- DRAG CONTROLS ---
const dragControls = new THREE.DragControls(draggableObjects, camera, renderer.domElement);

// Disable orbit controls while dragging
dragControls.addEventListener('dragstart', function (event) {
    orbitControls.enabled = false;
    event.object.material.emissiveIntensity = 0.8; // Highlight
});

dragControls.addEventListener('dragend', function (event) {
    orbitControls.enabled = true;
    event.object.material.emissiveIntensity = 0.2; // Restore
});


// PARTICLES
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 300;
const posArray = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 20;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.03,
    color: 0xffffff,
    transparent: true,
    opacity: 0.3
});
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);


// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    orbitControls.update();

    // Gentle floating for the GROUPS (parent container)
    // We modify the group Y, but dragging modifies local Y of children.
    // This allows combined movement.
    avatar1.group.position.y = Math.sin(elapsedTime * 0.5) * 0.1;
    avatar2.group.position.y = Math.sin(elapsedTime * 0.5 + 1) * 0.1;

    // Rotate particles
    particlesMesh.rotation.y = elapsedTime * 0.02;

    renderer.render(scene, camera);
}

animate();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
