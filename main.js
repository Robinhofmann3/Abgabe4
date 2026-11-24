import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createLights } from './lights.js';

import {
    createGround,
    createBasket,
    createBall,
    createArm
} from './Objects.js';

import { createGUI } from './gui.js';
import { calculateThrowVelocity, updatePhysics } from './physics.js';


function init() {

    // =====================================
    // SZENE
    // =====================================

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);


    // =====================================
    // KAMERA
    // =====================================

    const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5, 15);
    


    // =====================================
    // RENDERER
    // =====================================

    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    // =====================================
    // KAMERA-STEUERUNG
    // =====================================

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.target.set(0, 3.05, -7);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;   // Kamera bleibt über dem Boden
    controls.update();


    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById('WebGL-output').appendChild(renderer.domElement);

    // =====================================
    // SCORE-ANZEIGE & TREFFER-EFFEKT
    // =====================================

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

    const SCORE_LIGHT_MAX = 120;    // Helligkeit beim Treffer
    const SCORE_LIGHT_FADE = 2.5;   // Abklingen pro Sekunde
    let score = 0;

    function handleScore() {
        score++;
        scoreDisplay.textContent = 'Punkte: ' + score;

        // Treffer-Effekt
        scoreLight.intensity = SCORE_LIGHT_MAX;
        hemisphereLight.intensity = 0;               // Umgebungslicht aus
        ring.material.emissive.set(0xffdd00);
        ring.material.emissiveIntensity = 3;

        console.log('Korb! Punkte:', score);
    }


    // =====================================
    // OBJEKTE ERSTELLEN
    // =====================================

    const {scoreLight, hemisphereLight} = createLights(scene);
    const HEMI_BASE = hemisphereLight.intensity;   // normale Helligkeit merken
    createGround(scene);
    const {ring} = createBasket(scene);
    const arm = createArm(scene);
    const clock = new THREE.Clock();


    // =====================================
    // BÄLLE (dynamisch erzeugt)
    // =====================================

    const MAX_BALLS = 20;

    // fliegende Bälle: { mesh, velocity, moving, prevPos, scored }
    const balls = [];
    let heldBall = null;       // Ball in der Hand (null = Hand leer)

    // Ende des Unterarms (0.38) + Ballradius (0.18), lokal zum Ellbogen
    const HAND_OFFSET = new THREE.Vector3(0, 0, -0.56);



    // Neuen Ball erzeugen und in die Hand legen
    function spawnBall() {

        heldBall = createBall();
        heldBall.position.copy(HAND_OFFSET);
        arm.elbow.add(heldBall);

    }


    // Ball holen: nur wenn die Hand leer ist
    function getBall() {

        if (heldBall) return;

        spawnBall();

    }


    // Ball werfen: nur wenn ein Ball in der Hand ist
    function throwBall() {

        if (!heldBall) return;

        const mesh = heldBall;

        // Vom Arm lösen, Weltposition bleibt erhalten
        scene.attach(mesh);

        balls.push({
            mesh: mesh,
            velocity: calculateThrowVelocity(params.Kraft, params.ElbowX),
            moving: true,
            prevPos: mesh.position.clone(),   // für die Korb-Erkennung
            scored: false                     // pro Ball nur einmal zählen
        });

        // Zu viele Bälle: ältesten entfernen
        if (balls.length > MAX_BALLS) {
            const oldest = balls.shift();
            if (oldest.mesh === hoveredBall) setHover(null);
            scene.remove(oldest.mesh);
            oldest.mesh.material.dispose();
        }

        // Hand ist jetzt leer
        heldBall = null;

    }


    // =====================================
    // PICKING: HOVER-FARBE + ANKLICKEN = EINSAMMELN
    // =====================================

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const HOVER_COLOR = 0xffee00;
    let hoveredBall = null;   // Mesh unter der Maus

    // Gibt den Index des Balls unter der Maus zurück (-1 = keiner)
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

        // alten Ball zurücksetzen
        if (hoveredBall) {
            hoveredBall.material.emissive.set(0x000000);
        }

        // neuen Ball hervorheben
        if (mesh) {
            mesh.material.emissive.set(HOVER_COLOR);
            mesh.material.emissiveIntensity = 0.8;
        }

        hoveredBall = mesh;
        renderer.domElement.style.cursor = mesh ? 'pointer' : 'default';
    }

    // Maus bewegt sich: Ball unter der Maus einfärben
    renderer.domElement.addEventListener('pointermove', (event) => {
        const index = pickBallIndex(event);
        setHover(index !== -1 ? balls[index].mesh : null);
    });

    // Klick: Ball einsammeln (löschen)
    renderer.domElement.addEventListener('pointerdown', (event) => {
        const index = pickBallIndex(event);
        if (index !== -1) {
            const mesh = balls[index].mesh;
            if (mesh === hoveredBall) setHover(null);
            scene.remove(mesh);
            mesh.material.dispose();   // eigenes Material, daher dispose ok
            balls.splice(index, 1);    // auch aus der Physik entfernen
        }
    });


    // =====================================
    // GUI
    // =====================================

    const params = createGUI(
        () => throwBall(),
        () => getBall()
    );


    // Ersten Ball in die Hand legen
    spawnBall();


    // =====================================
    // ANIMATION
    // =====================================

    function animate() {

        requestAnimationFrame(animate);

        const dt = Math.min(clock.getDelta(), 0.05);

        controls.update();


        // ---------------------------------
        // TREFFER-EFFEKT AUSFADEN
        // ---------------------------------

        if (scoreLight.intensity > 0) {

            scoreLight.intensity = Math.max(
                0,
                scoreLight.intensity - SCORE_LIGHT_MAX * SCORE_LIGHT_FADE * dt
            );

            const f = scoreLight.intensity / SCORE_LIGHT_MAX;   // 1 -> 0

            ring.material.emissiveIntensity = 3 * f;
            hemisphereLight.intensity = HEMI_BASE * (1 - f);    // 0 -> normal

        }


        // ---------------------------------
        // ARM POSITIONIEREN
        // ---------------------------------
        const SHOULDER_Y = 1.5;

        arm.shoulder.position.set(params.X, SHOULDER_Y, params.Z);
        arm.shoulder.rotation.x = params.ShoulderX;
        arm.elbow.rotation.x = params.ElbowX;


        // ---------------------------------
        // OBERKÖRPER FOLGT DER SCHULTER
        // ---------------------------------

        arm.body.position.set(params.X, SHOULDER_Y, params.Z);

        // Ständer reicht vom Boden bis zur Rumpf-Unterkante (0.7 unter der Schulter)

        const standHeight = Math.max(SHOULDER_Y - 0.7, 0.01);
        arm.stand.scale.y = standHeight / 3.3;
        arm.stand.position.set(params.X + 0.4, standHeight / 2, params.Z + 0.1);
        arm.base.position.set(params.X + 0.4, 0.05, params.Z + 0.1);

        // ---------------------------------
        // BALLPHYSIK
        // ---------------------------------

        updatePhysics(balls, dt, handleScore);


        // ---------------------------------
        // RENDERN
        // ---------------------------------

        renderer.render(scene, camera);

    }


    animate();

}


window.onload = init;