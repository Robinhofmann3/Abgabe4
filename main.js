import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createLights } from './lights.js';

import {
    createGround,
    createBasket,
    createBall,
    createThrowLine,
    createArm
} from './Objects.js';

import { createGUI } from './gui.js';


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

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById('WebGL-output').appendChild(renderer.domElement);


    // =====================================
    // KAMERA-STEUERUNG
    // =====================================

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.target.set(0, 3.05, -7);
    controls.enableDamping = true;
    controls.update();


    // =====================================
    // FPS-ANZEIGE
    // =====================================

    const stats = new Stats();
    document.body.appendChild(stats.dom);


    // =====================================
    // SCORE-ANZEIGE
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


    // =====================================
    // OBJEKTE ERSTELLEN
    // =====================================

    createLights(scene);
    createGround(scene);
    createBasket(scene);

    const arm = createArm(scene);

    const { update: updateThrowLine } = createThrowLine(scene);


    // =====================================
    // PHYSIK
    // =====================================

    const gravity = 9.81;
    const ballRadius = 0.18;

    // Substeps gegen "Tunneling" (Ball fliegt durch Brett/Ring)
    const SUBSTEPS = 4;

    // Ring: Werte müssen zum Torus in Objects.js passen
    const RING_CENTER = new THREE.Vector3(0, 3.05, -6.73);
    const RING_RADIUS = 0.30;
    const RING_TUBE = 0.02;

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

    const handWorld = new THREE.Vector3();


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
            velocity: calculateThrowVelocity(params.Kraft),
            moving: true,
            prevPos: mesh.position.clone(),   // für die Korb-Erkennung
            scored: false                     // pro Ball nur einmal zählen
        });

        // Zu viele Bälle: ältesten entfernen
        if (balls.length > MAX_BALLS) {
            const oldest = balls.shift();
            scene.remove(oldest.mesh);
        }

        // Hand ist jetzt leer
        heldBall = null;

    }


    // =====================================
    // WURFGESCHWINDIGKEIT BERECHNEN
    // =====================================

    function calculateThrowVelocity(kraft) {

        return new THREE.Vector3(
            0,
            3 + kraft * 0.08,
            -kraft * 0.2
        );

    }


    // =====================================
    // 1. KOLLISION MIT DEM BRETT
    // =====================================

    function checkBoardCollision(ball, velocity) {

        const radius = ballRadius;

        const center = new THREE.Vector3(0, 3.425, -7);

        const half = new THREE.Vector3(
            0.9,
            0.525,
            0.025
        );

        const closest = new THREE.Vector3(
            THREE.MathUtils.clamp(
                ball.position.x,
                center.x - half.x,
                center.x + half.x
            ),
            THREE.MathUtils.clamp(
                ball.position.y,
                center.y - half.y,
                center.y + half.y
            ),
            THREE.MathUtils.clamp(
                ball.position.z,
                center.z - half.z,
                center.z + half.z
            )
        );

        const normal = new THREE.Vector3()
            .subVectors(ball.position, closest);

        const distance = normal.length();

        if (distance < radius) {

            if (distance < 0.0001) {

                normal.set(
                    0,
                    0,
                    velocity.z < 0 ? 1 : -1
                );

            } else {

                normal.normalize();

            }

            ball.position.copy(closest)
                .addScaledVector(normal, radius + 0.001);

            const speed = velocity.dot(normal);

            if (speed < 0) {

                velocity.addScaledVector(
                    normal,
                    -(1 + 0.7) * speed
                );

            }

        }

    }


    // =====================================
    // 2. KOLLISION MIT DEM BASKETBALLRING
    // =====================================

    function checkRingCollision(ball, velocity) {

        const dx = ball.position.x - RING_CENTER.x;
        const dz = ball.position.z - RING_CENTER.z;

        const angle = Math.atan2(dz, dx);

        const closest = new THREE.Vector3(
            RING_CENTER.x + Math.cos(angle) * RING_RADIUS,
            RING_CENTER.y,
            RING_CENTER.z + Math.sin(angle) * RING_RADIUS
        );

        const normal = new THREE.Vector3()
            .subVectors(ball.position, closest);

        const distance = normal.length();

        const collisionDistance = ballRadius + RING_TUBE;

        if (distance < collisionDistance) {

            if (distance < 0.0001) {

                normal.set(
                    0,
                    velocity.y >= 0 ? 1 : -1,
                    0
                );

            } else {

                normal.normalize();

            }

            ball.position.copy(closest)
                .addScaledVector(
                    normal,
                    collisionDistance + 0.001
                );

            const speed = velocity.dot(normal);

            if (speed < 0) {

                velocity.addScaledVector(
                    normal,
                    -(1 + 0.7) * speed
                );

            }

        }

    }


    // =====================================
    // 3. KORB-ERKENNUNG
    // =====================================

    // Prüft pro Ball, ob er von oben durch die Ringebene geflogen ist.
    // Muss nach jedem Physik-Schritt genau einmal pro Ball laufen,
    // weil sich der Ball die vorherige Position merkt.
    function checkScore(b) {

        const pos = b.mesh.position;
        const prev = b.prevPos;
        let hit = false;

        if (!b.scored && prev.y > RING_CENTER.y && pos.y <= RING_CENTER.y) {

            // Schnittpunkt mit der Ringebene interpolieren
            const t = (prev.y - RING_CENTER.y) / (prev.y - pos.y);
            const x = THREE.MathUtils.lerp(prev.x, pos.x, t);
            const z = THREE.MathUtils.lerp(prev.z, pos.z, t);

            // Die Ringkollision verhindert schon, dass der Ball außen vorbeigeht,
            // deshalb reicht der Ringradius als Grenze.
            if (Math.hypot(x - RING_CENTER.x, z - RING_CENTER.z) < RING_RADIUS) {
                b.scored = true;
                hit = true;
            }

        }

        prev.copy(pos);

        return hit;

    }


    // =====================================
    // 4. GUI
    // =====================================

    const params = createGUI(
        () => throwBall(),
        () => getBall()
    );


    // Ersten Ball in die Hand legen
    // (nach createGUI, weil throwBall params benutzt)
    spawnBall();


    // =====================================
    // 5. FENSTERGRÖSSE ANPASSEN
    // =====================================

    window.addEventListener('resize', () => {

        camera.aspect =
            window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    });


    // =====================================
    // 6. PHYSIK-SCHRITT FÜR EINEN BALL
    // =====================================

    let score = 0;

    function stepBall(b, h) {

        const ball = b.mesh;
        const velocity = b.velocity;

        // Schwerkraft
        velocity.y -= gravity * h;

        // Position aktualisieren
        ball.position.addScaledVector(velocity, h);

        // Kollisionen
        checkBoardCollision(ball, velocity);
        checkRingCollision(ball, velocity);

        // Korb?
        if (checkScore(b)) {
            score++;
            scoreDisplay.textContent = 'Punkte: ' + score;
            console.log('Korb! Punkte:', score);
        }

        // Ballrotation
        ball.rotation.x += velocity.z * h * 2;
        ball.rotation.z -= velocity.x * h * 2;

        // Bodenkollision
        if (ball.position.y <= ballRadius) {

            ball.position.y = ballRadius;

            velocity.y *= -0.7;
            velocity.x *= 0.8;
            velocity.z *= 0.8;

            // Ball bleibt liegen, wenn er kaum noch springt
            if (Math.abs(velocity.y) < 1) {

                velocity.set(0, 0, 0);
                b.moving = false;

            }

        }

    }


    // =====================================
    // 7. ANIMATION
    // =====================================

    function animate() {

        requestAnimationFrame(animate);

        const dt = Math.min(clock.getDelta(), 0.05);

        controls.update();
        stats.update();


        // ---------------------------------
        // ARM POSITIONIEREN
        // ---------------------------------

        arm.shoulder.position.set(params.X, params.Y, params.Z);
        arm.shoulder.rotation.x = params.ShoulderX;
        arm.shoulder.rotation.y = params.ShoulderY;
        arm.elbow.rotation.x = params.ElbowX;


        // ---------------------------------
        // WURFLINIE AN DER HAND
        // ---------------------------------

        arm.shoulder.updateMatrixWorld(true);

        if (heldBall) {

            heldBall.getWorldPosition(handWorld);

        } else {

            // Hand leer: Linie von der Handposition aus zeichnen
            handWorld.copy(HAND_OFFSET);
            arm.elbow.localToWorld(handWorld);

        }

        updateThrowLine(params.Kraft, handWorld);


        // ---------------------------------
        // BALLPHYSIK (alle fliegenden Bälle, mit Substeps)
        // ---------------------------------

        const h = dt / SUBSTEPS;

        for (const b of balls) {

            for (let i = 0; i < SUBSTEPS; i++) {

                if (!b.moving) break;

                stepBall(b, h);

            }

        }


        // ---------------------------------
        // RENDERN
        // ---------------------------------

        renderer.render(scene, camera);

    }


    animate();

}


window.onload = init;