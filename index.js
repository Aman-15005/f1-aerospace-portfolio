/* ===================================================================
   AMAN SHUKLA — F1 & AEROSPACE PORTFOLIO
   Three.js 3D Scene + Scroll Animations + Interactions
   =================================================================== */

import * as THREE from 'three';

// ===== THREE.JS SCENE =====

const canvas = document.getElementById('hero-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

camera.position.set(0, 0, 6);
camera.lookAt(0, 0, 0);

// ===== FLOWING AERODYNAMIC CURVES =====

function createFlowCurves() {
    const group = new THREE.Group();
    const curveData = [];

    const curveConfigs = [
        // [yOffset, zOffset, amplitude, opacity, phase]
        [-2.0, -0.5, 0.6, 0.30, 0.0],
        [-0.8,  0.3, 0.8, 0.45, 0.8],
        [ 0.4, -0.4, 0.6, 0.35, 1.8],
        [ 1.6,  0.4, 0.7, 0.45, 3.5],
        [ 2.5, -0.8, 0.5, 0.25, 4.5],
    ];

    curveConfigs.forEach(([yOff, zOff, amp, opacity, phase]) => {
        const pointCount = 200;
        const positions = new Float32Array(pointCount * 3);
        const colors = new Float32Array(pointCount * 3);

        for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const x = -10 + t * 20;
            const y = yOff + Math.sin(t * Math.PI * 2 + phase) * amp;
            const z = zOff + Math.cos(t * Math.PI * 1.5 + phase * 0.5) * amp * 0.6;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const edgeFade = Math.sin(t * Math.PI);
            const brightness = edgeFade * 1.0;
            colors[i * 3] = 1.0 * brightness;
            colors[i * 3 + 1] = 0.30 * brightness;
            colors[i * 3 + 2] = 0.02 * brightness;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity,
            depthWrite: false,
        });

        const line = new THREE.Line(geo, mat);
        group.add(line);
        curveData.push({ line, geo, yOff, zOff, amp, phase });
    });

    return { group, curveData };
}

const { group: flowGroup, curveData: flowCurves } = createFlowCurves();
scene.add(flowGroup);

// ===== GEOMETRIC RING (Aerospace HUD Accent) =====

function createRing() {
    const group = new THREE.Group();
    const ringColor = 0xff4500;

    const outerGeo = new THREE.RingGeometry(2.2, 2.26, 80);
    const outerEdges = new THREE.EdgesGeometry(outerGeo);
    group.add(new THREE.LineSegments(outerEdges,
        new THREE.LineBasicMaterial({ color: ringColor, transparent: true, opacity: 0.35 })));

    const innerGeo = new THREE.RingGeometry(1.65, 1.69, 60);
    const innerEdges = new THREE.EdgesGeometry(innerGeo);
    group.add(new THREE.LineSegments(innerEdges,
        new THREE.LineBasicMaterial({ color: ringColor, transparent: true, opacity: 0.18 })));

    for (let i = 0; i < 72; i++) {
        const angle = (i / 72) * Math.PI * 2;
        const isMajor = i % 6 === 0;
        const innerR = isMajor ? 2.0 : 2.1;
        const outerR = 2.35;
        const pts = [
            new THREE.Vector3(Math.cos(angle) * innerR, Math.sin(angle) * innerR, 0),
            new THREE.Vector3(Math.cos(angle) * outerR, Math.sin(angle) * outerR, 0),
        ];
        group.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: ringColor, transparent: true, opacity: isMajor ? 0.40 : 0.12 })
        ));
    }

    const crossMat = new THREE.LineBasicMaterial({ color: ringColor, transparent: true, opacity: 0.25 });
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
        const pts = [
            new THREE.Vector3(dx * 0.15, dy * 0.15, 0),
            new THREE.Vector3(dx * 0.6, dy * 0.6, 0),
        ];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), crossMat));
    });

    group.position.set(3, 0.3, -3);
    group.rotation.set(0.15, -0.6, 0.1);
    return group;
}

const ring = createRing();
scene.add(ring);

const ring2 = createRing();
ring2.scale.set(0.5, 0.5, 0.5);
ring2.position.set(-4, -1.5, -5);
ring2.rotation.set(-0.3, 0.8, 0);
ring2.children.forEach(child => {
    if (child.material) child.material.opacity *= 0.4;
});
scene.add(ring2);

// ===== SOFT GLOW PARTICLE TEXTURE =====

function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

const glowTexture = createGlowTexture();

// ===== ATMOSPHERIC PARTICLES =====

const PARTICLE_COUNT = 250;
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleVelocities = [];

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2 + Math.random() * 14;
    particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    particlePositions[i * 3 + 2] = r * Math.cos(phi);
    particleVelocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.0015,
        z: (Math.random() - 0.5) * 0.002,
    });
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
    color: 0xff5500,
    size: 0.08,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
    depthWrite: false,
    map: glowTexture,
    blending: THREE.AdditiveBlending,
}));
scene.add(particles);

// ===== SPEED TRAILS =====

const TRAIL_COUNT = 25;
const trailPositions = new Float32Array(TRAIL_COUNT * 6);
const trailColors = new Float32Array(TRAIL_COUNT * 6);
const trailMeta = [];

for (let i = 0; i < TRAIL_COUNT; i++) {
    const y = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 10 - 2;
    const x = (Math.random() - 0.5) * 30;
    const len = 0.3 + Math.random() * 0.8;
    const speed = 0.03 + Math.random() * 0.06;
    const b = 0.2 + Math.random() * 0.4;

    trailPositions[i * 6] = x;
    trailPositions[i * 6 + 1] = y;
    trailPositions[i * 6 + 2] = z;
    trailPositions[i * 6 + 3] = x - len;
    trailPositions[i * 6 + 4] = y;
    trailPositions[i * 6 + 5] = z;

    trailColors[i * 6] = b;
    trailColors[i * 6 + 1] = b * 0.3;
    trailColors[i * 6 + 2] = 0;
    trailColors[i * 6 + 3] = b * 0.3;
    trailColors[i * 6 + 4] = b * 0.1;
    trailColors[i * 6 + 5] = 0;

    trailMeta.push({ y, z, speed, len });
}

const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
const speedTrails = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.45, depthWrite: false,
}));
scene.add(speedTrails);

// ===== ANIMATION LOOP =====

let mouseX = 0, mouseY = 0;
let smoothMouseX = 0, smoothMouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    smoothMouseX += (mouseX - smoothMouseX) * 0.03;
    smoothMouseY += (mouseY - smoothMouseY) * 0.03;

    camera.position.x = smoothMouseX * 0.5;
    camera.position.y = smoothMouseY * 0.3;
    camera.lookAt(0, 0, 0);

    // Flow curves undulate
    flowCurves.forEach(({ geo, yOff, zOff, amp, phase }) => {
        const arr = geo.getAttribute('position').array;
        const count = arr.length / 3;
        const ts = elapsed * 0.3;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            arr[i * 3 + 1] = yOff + Math.sin(t * Math.PI * 2 + phase + ts) * amp;
            arr[i * 3 + 2] = zOff + Math.cos(t * Math.PI * 1.5 + phase * 0.5 + ts * 0.7) * amp * 0.6;
        }
        geo.getAttribute('position').needsUpdate = true;
    });

    ring.rotation.z += 0.001;
    ring2.rotation.z -= 0.0015;

    // Particles drift
    const pArr = particleGeo.getAttribute('position').array;
    for (let i = 0; i < particleVelocities.length; i++) {
        pArr[i * 3] += particleVelocities[i].x;
        pArr[i * 3 + 1] += particleVelocities[i].y;
        pArr[i * 3 + 2] += particleVelocities[i].z;
        const d = Math.sqrt(pArr[i*3]**2 + pArr[i*3+1]**2 + pArr[i*3+2]**2);
        if (d > 18) {
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            const r = 2 + Math.random() * 3;
            pArr[i*3] = r * Math.sin(ph) * Math.cos(th);
            pArr[i*3+1] = r * Math.sin(ph) * Math.sin(th);
            pArr[i*3+2] = r * Math.cos(ph);
        }
    }
    particleGeo.getAttribute('position').needsUpdate = true;

    // Speed trails fly past
    const tArr = trailGeo.getAttribute('position').array;
    for (let i = 0; i < trailMeta.length; i++) {
        const td = trailMeta[i];
        tArr[i*6] += td.speed;
        tArr[i*6+3] += td.speed;
        if (tArr[i*6+3] > 16) {
            const x = -16 - Math.random() * 5;
            tArr[i*6] = x + td.len;
            tArr[i*6+1] = td.y + (Math.random()-0.5)*0.3;
            tArr[i*6+3] = x;
            tArr[i*6+4] = tArr[i*6+1];
        }
    }
    trailGeo.getAttribute('position').needsUpdate = true;

    scene.rotation.y = smoothMouseX * 0.05;
    scene.rotation.x = smoothMouseY * 0.03;

    renderer.render(scene, camera);
}

animate();

// ===== RESIZE HANDLER =====

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});


// ===================================================================
// DOM INTERACTIONS
// ===================================================================

// ===== NAVIGATION =====

const nav = document.getElementById('main-nav');
const navLinks = document.querySelectorAll('.nav-link');
const navCta = document.querySelector('.nav-cta');
const hamburger = document.getElementById('nav-hamburger');
const navLinksContainer = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinksContainer.classList.toggle('open');
});

navLinksContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinksContainer.classList.remove('open');
    });
});

const sections = document.querySelectorAll('.section, #hero');

function updateActiveNav() {
    const scrollPos = window.scrollY + 200;
    sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        const id = section.getAttribute('id');
        if (scrollPos >= top && scrollPos < bottom) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// ===== SCROLL REVEAL =====

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('revealed');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== SKILL BAR ANIMATION =====

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-fill').forEach(fill => {
                fill.style.width = fill.getAttribute('data-level') + '%';
                fill.classList.add('animated');
            });
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-category').forEach(cat => skillObserver.observe(cat));

// ===== PROJECT TAB FILTERING =====

const tabButtons = document.querySelectorAll('.tab-btn');
const projectCards = document.querySelectorAll('.project-card');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-tab');
        projectCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-category') === filter) {
                card.classList.remove('hidden');
                card.style.animation = 'fadeInUp 0.5s ease forwards';
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

// ===== HOBBIES POP-OUT =====

const overlay = document.getElementById('hobbies-overlay');
const overlayIcon = document.getElementById('overlay-icon');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const overlayClose = document.getElementById('hobbies-close');

const hobbyEmojis = {
    photography: '📷', football: '⚽', badminton: '🏸', guitar: '🎸',
    reading: '📚', cooking: '🍳', dance: '💃', music: '🎵',
};

document.querySelectorAll('.hobby-item').forEach(item => {
    item.addEventListener('click', () => {
        const hobby = item.getAttribute('data-hobby');
        overlayIcon.textContent = hobbyEmojis[hobby] || '🎯';
        overlayTitle.textContent = item.getAttribute('data-title');
        overlayDesc.textContent = item.getAttribute('data-desc');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

function closeOverlay() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

overlayClose.addEventListener('click', closeOverlay);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });

// ===== SMOOTH SCROLL =====

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
