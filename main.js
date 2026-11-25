import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLights } from './lights.js';
import {
    createGround,
    createBasket,
    createBall,
    createPlayer
} from './Objects.js';
import { createGUI } from './gui.js';
import { calculateThrowVelocity, updatePhysics } from './physics.js';

function init() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('WebGL-output').appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3.05, -7);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.update();

    // Wir brauchen nur noch das scoreLight aus createLights
    const { scoreLight } = createLights(scene);

    createGround(scene);
    createBasket(scene);
    const player = createPlayer(scene);

    // Punkte-Anzeige
    const scoreDisplay = document.createElement('div');
    scoreDisplay.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 20px;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        font: bold 28px sans-serif;
        border-radius: 8px;
        pointer-events: none;
    `;
    scoreDisplay.textContent = 'Punkte: 0';
    document.body.appendChild(scoreDisplay);

    let score = 0;

    // Simpler Licht-Blitz bei Treffer
    function handleScore() {
        score++;
        scoreDisplay.textContent = 'Punkte: ' + score;
        
        scoreLight.intensity = 120;
        setTimeout(() => {
            scoreLight.intensity = 0;
        }, 500);
    }

    const MAX_BALLS = 20;
    const balls = [];
    let heldBall = null;
    const HAND_OFFSET = new THREE.Vector3(0, 0, -0.56);

    function spawnBall() {
        heldBall = createBall();
        heldBall.position.copy(HAND_OFFSET);
        player.elbow.add(heldBall);
    }

    function getBall() {
        if (heldBall) return;
        spawnBall();
    }

    function throwBall() {
        if (!heldBall) return;
        const mesh = heldBall;
        scene.attach(mesh);
        balls.push({
            mesh: mesh,
            velocity: calculateThrowVelocity(params.Kraft, params.ElbowX),
            moving: true,
            scored: false
        });

        if (balls.length > MAX_BALLS) {
            const oldest = balls.shift();
            if (oldest.mesh === hoveredBall) setHover(null);
            scene.remove(oldest.mesh);
            oldest.mesh.material.dispose();
        }
        heldBall = null;
    }

    // Hover & Klick zum Löschen von Bällen
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const HOVER_COLOR = 0xffee00;
    let hoveredBall = null;

    function pickBallIndex(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(balls.map(b => b.mesh), false);
        if (hits.length === 0) return -1;

        return balls.findIndex(b => b.mesh === hits[0].object);
    }

    function setHover(mesh) {
        if (mesh === hoveredBall) return;

        if (hoveredBall) {
            hoveredBall.material.emissive.set(0x000000);
        }

        if (mesh) {
            mesh.material.emissive.set(HOVER_COLOR);
            mesh.material.emissiveIntensity = 0.8;
        }

        hoveredBall = mesh;
        renderer.domElement.style.cursor = mesh ? 'pointer' : 'default';
    }

    renderer.domElement.addEventListener('pointermove', (event) => {
        const index = pickBallIndex(event);
        setHover(index !== -1 ? balls[index].mesh : null);
    });

    renderer.domElement.addEventListener('pointerdown', (event) => {
        const index = pickBallIndex(event);
        if (index !== -1) {
            const mesh = balls[index].mesh;
            if (mesh === hoveredBall) setHover(null);
            scene.remove(mesh);
            mesh.material.dispose();
            balls.splice(index, 1);
        }
    });

    const params = createGUI(
        () => throwBall(),
        () => getBall()
    );

    spawnBall();

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        player.player.position.set(params.X, 0, params.Z);
        player.shoulder.rotation.x = params.ShoulderX;
        player.elbow.rotation.x = params.ElbowX;

        updatePhysics(balls, handleScore);
        renderer.render(scene, camera);
    }

    animate();
}

window.onload = init;