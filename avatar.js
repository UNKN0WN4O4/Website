// Global THREE variables assumed from script tags

// Scene Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.05);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Controls - Orbit Only
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.maxDistance = 10;
orbitControls.minDistance = 1;
// orbitControls.enablePan = false; // Optional: restrict panning

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
const avatars = [];

function createAvatar(color, xPos, zPos) {
    const scale = 0.5;
    const group = new THREE.Group();
    group.position.set(xPos, -1, zPos);
    group.scale.set(scale, scale, scale);
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

    // 1. Torso 
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.6, 8);
    const torso = new THREE.Mesh(torsoGeo, mainMaterial);
    torso.position.y = 1.3;
    group.add(torso);

    // 2. Head 
    const headGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const head = new THREE.Mesh(headGeo, mainMaterial);
    head.position.y = 1.4;
    torso.add(head);

    // Glowing core
    const headCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), coreMaterial);
    head.add(headCore);

    // Track limbs for animation
    const limbs = {
        leftArm: null,
        rightArm: null,
        leftLeg: null,
        rightLeg: null
    };

    // 3. Connected Limbs
    function createLimb(x, y, z, rotZ, name) {
        // Joint/Pivot point
        const joint = new THREE.Group();
        joint.position.set(x, y, z);

        const geo = new THREE.CylinderGeometry(0.12, 0.08, 1.2, 6);
        const limb = new THREE.Mesh(geo, mainMaterial);
        limb.position.y = -0.6; // Offset so pivot is at top
        limb.rotation.z = rotZ;

        joint.add(limb);

        // Hands/Feet
        const endGeo = new THREE.OctahedronGeometry(0.18, 0);
        const endMesh = new THREE.Mesh(endGeo, mainMaterial);
        endMesh.position.y = -0.7;
        limb.add(endMesh);

        torso.add(joint);

        if (name) limbs[name] = joint;
        return joint;
    }

    // Arms 
    createLimb(-0.4, 0.5, 0, 0.3, 'leftArm');
    createLimb(0.4, 0.5, 0, -0.3, 'rightArm');

    // Legs 
    createLimb(-0.25, -0.7, 0, 0, 'leftLeg');
    createLimb(0.25, -0.7, 0, 0, 'rightLeg');

    const avatarData = { group, head, torso, limbs, color, initialY: group.position.y };
    avatars.push(avatarData);
    return avatarData;
}

// Create 2 Avatars
const avatar1 = createAvatar(0x00d4ff, -0.8, 0); // Cyan
avatar1.group.rotation.y = Math.PI / 2; // Face Right

const avatar2 = createAvatar(0xff0055, 0.8, 0);  // Magenta
avatar2.group.rotation.y = -Math.PI / 2; // Face Left

// --- CHAT SYSTEM --- (Kept same)
const bubbleContainer = document.getElementById('bubble-container');
const displayDuration = 3000;

function say(avatarIndex, text) {
    const avatar = avatars[avatarIndex];
    if (!avatar) return;
    if (avatar.bubbleElement) avatar.bubbleElement.remove();

    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.innerText = text;
    bubble.style.border = `2px solid #${avatar.color.toString(16)}`;
    bubbleContainer.appendChild(bubble);

    avatar.bubbleElement = bubble;
    requestAnimationFrame(() => { bubble.style.opacity = '1'; bubble.style.marginTop = '-10px'; });

    setTimeout(() => {
        bubble.style.opacity = '0';
        bubble.style.marginTop = '0';
        setTimeout(() => {
            if (avatar.bubbleElement === bubble) {
                bubble.remove();
                avatar.bubbleElement = null;
            }
        }, 300);
    }, displayDuration);
}

// --- HYBRID CHATBOT (API + Offline Fallback) ---
const GEMINI_API_KEY = 'AIzaSyD_8jfrdmt7WMGAxXIGOcfhqHvK1pQoWDU';
const DEBUG_MODE = false;

let apiCooldownUntil = 0;

async function fetchGeminiResponse(userMessage) {
    // 1. Check Circuit Breaker (Is API cooling down?)
    if (Date.now() < apiCooldownUntil) {
        console.log('API on cooldown. Using offline response.');
        return getOfflineResponse(userMessage);
    }

    // 2. Try Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = "You are a witty, slightly mysterious pink digital avatar floating in a void. Keep your responses concise (under 20 words) and enigmatic. You are talking to a user who has visited your digital realm.";

    const payload = {
        contents: [{
            parts: [{
                text: `${systemPrompt}\n\nUser: ${userMessage}\nAvatar:`
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.warn('Gemini API Error:', data.error.message);

            // Handle Quota/Rate Limits -> Trigger Circuit Breaker (60s cooldown)
            const errMsg = data.error.message.toLowerCase();
            if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('429')) {
                apiCooldownUntil = Date.now() + 60000; // 60 seconds cooldown
                return getOfflineResponse(userMessage) + " (API resting...)";
            }

            // Other errors -> Just fallback this one time
            return getOfflineResponse(userMessage);
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

    } catch (error) {
        console.error('Network Error:', error);
        return getOfflineResponse(userMessage); // Fallback to offline
    }

    return getOfflineResponse(userMessage);
}

// 2. Offline Fallback Logic
function getOfflineResponse(userMessage) {
    const msg = userMessage.toLowerCase();

    // Keyword Rules
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) return "Greetings, traveler of the code.";
    if (msg.includes('who are you') || msg.includes('name')) return "I am a fragment of the digital void.";
    if (msg.includes('void') || msg.includes('place')) return "This is the space between spaces.";
    if (msg.includes('pink') || msg.includes('color')) return "I chose this color to stand out.";
    if (msg.includes('anime') || msg.includes('vrm')) return "You can replace me with a VRM model.";
    if (msg.includes('joke')) return "Why did the function break up? Too many arguments.";
    if (msg.includes('how are you')) return "Operating within parameters.";

    const defaults = [
        "The void listens.",
        "Interesting.",
        "I see.",
        "Could you repeat that?",
        "..."
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
}

const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const text = chatInput.value.trim();
        if (text) {
            // 1. User speaks (Cyan Avatar / User Bubble)
            // Using Avatar 1 (Cyan) to represent User for now, or just generic bubble?
            // The request was "connect pink avatar to gemini". 
            // Let's have the user speak as themselves (Avatar 1/Cyan is "Left", Avatar 2/Magenta is "Right").
            // User controls Avatar 1 (Cyan) in this context effectively.
            say(0, text);
            chatInput.value = '';

            // 2. Pink Avatar (Avatar 2) thinks and responds
            // Show a temporary "..." or just wait
            // say(1, "..."); 

            const reply = await fetchGeminiResponse(text);
            say(1, reply);
        }
    }
});

function updateBubbles() {
    avatars.forEach(avatar => {
        if (avatar.bubbleElement) {
            const headPos = new THREE.Vector3();
            avatar.head.getWorldPosition(headPos);
            headPos.y += 0.8;
            headPos.project(camera);
            const x = (headPos.x * .5 + .5) * container.clientWidth;
            const y = (headPos.y * -.5 + .5) * container.clientHeight;
            avatar.bubbleElement.style.left = `${x}px`;
            avatar.bubbleElement.style.top = `${y}px`;
        }
    });
}

// --- PARTICLE SYSTEM ---
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    // Spread particles in a large cube volume
    posArray[i] = (Math.random() - 0.5) * 50;
}

particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true
});
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    orbitControls.update();
    updateBubbles();

    // Rotate particle system slowly
    particlesMesh.rotation.y = time * 0.05;
    particlesMesh.rotation.x = time * 0.02;

    avatars.forEach((avatar, index) => {
        // Offset time for variety
        const t = time + index * 2;

        // 1. Floating Body
        avatar.group.position.y = avatar.initialY + Math.sin(t * 1.5) * 0.1;

        // 2. Breathing Torso
        const breath = 1 + Math.sin(t * 2) * 0.02;
        avatar.torso.scale.set(1, breath, 1);

        // 3. Limb Swaying (Procedural Animation)
        // Arms
        if (avatar.limbs.leftArm) avatar.limbs.leftArm.rotation.z = Math.sin(t * 1.2) * 0.1 + 0.3;
        if (avatar.limbs.rightArm) avatar.limbs.rightArm.rotation.z = Math.sin(t * 1.2 + Math.PI) * 0.1 - 0.3;

        // Legs (Dangling)
        if (avatar.limbs.leftLeg) avatar.limbs.leftLeg.rotation.x = Math.sin(t * 1.5) * 0.1 + 0.1;
        if (avatar.limbs.rightLeg) avatar.limbs.rightLeg.rotation.x = Math.sin(t * 1.5 + Math.PI) * 0.1 + 0.1;

        // 4. Subtle Head rotation
        avatar.head.rotation.y = Math.sin(t * 0.5) * 0.1;
    });

    renderer.render(scene, camera);
}

animate();

// --- VRM SUPPORT ---
// Call this function to load an anime avatar: loadVRM('path/to/model.vrm', 0, 0);
function loadVRM(url, x, z) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        url,
        (gltf) => {
            THREE.VRM.from(gltf).then((vrm) => {
                scene.add(vrm.scene);
                vrm.scene.position.set(x, -1, z);
                vrm.scene.rotation.y = Math.PI; // Default to facing camera usually

                // Add to a list if we want to update it in animate()
                // vrms.push(vrm); 

                console.log('VRM loaded cleanly');
            });
        },
        (progress) => console.log('Loading VRM...', 100.0 * (progress.loaded / progress.total), '%'),
        (error) => console.error('VRM Load Error:', error)
    );
}

// Global list for VRMs if we decide to use them
const vrms = [];

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
