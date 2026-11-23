import * as THREE from 'three';

// Spielfeld-Maße
export const COURT_WIDTH = 80;
export const COURT_DEPTH = 140;


// Boden erstellen
export function createGround(scene) {

    const geometry = new THREE.PlaneGeometry(
        COURT_WIDTH,
        COURT_DEPTH
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0xc68642,
        roughness: 0.8,
        metalness: 0
    });

    const ground = new THREE.Mesh(geometry, material);

    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';

    scene.add(ground);

    return ground;
}


// Basketballkorb erstellen
export function createBasket(scene) {

    const boardZ = -7;

    // Brett
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.05, 0.05),
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        })
    );

    board.position.set(0, 3.425, boardZ);
    board.castShadow = true;

    scene.add(board);


    // Ring
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(
            0.30,
            0.02,
            16,
            48
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff6600
        })
    );

    ring.rotation.x = Math.PI / 2;

    ring.position.set(
        0,
        3.05,
        boardZ + 0.27
    );

    ring.castShadow = true;

    scene.add(ring);


    // Pfosten
    const poleHeight = 3.425;
    const poleRadius = 0.08;

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(
            poleRadius,
            poleRadius,
            poleHeight,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0x333333
        })
    );

    pole.position.set(
        0,
        poleHeight / 2,
        boardZ - 0.025 - poleRadius
    );

    pole.castShadow = true;

    scene.add(pole);

}


// Geometrie und Material werden von allen Bällen geteilt
const ballGeometry = new THREE.SphereGeometry(0.18, 32, 32);

const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    roughness: 0.8
});


// Basketball erstellen (jeder Aufruf = neuer Ball)
export function createBall() {

    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;

    return ball;

}


// Wurflinie erstellen
export function createThrowLine(scene) {

    const start = new THREE.Vector3(0, 4, 5);

    const gravity = 9.81;
    const SEGMENTS = 100;
    const TIME_STEP = 0.02;

    const positions = new Float32Array(
        (SEGMENTS + 1) * 3
    );

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    );

    const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
            color: 0x0000ff
        })
    );

    line.frustumCulled = false;

    scene.add(line);

    // Wurflinie anhand der Physik berechnen
    function update(kraft, startPos = start) {

        const velocity = new THREE.Vector3(
            0,
            3 + kraft * 0.08,
            -kraft * 0.2
        );

        const points = [];

        for (let i = 0; i <= SEGMENTS; i++) {

            const t = i * TIME_STEP;

            const point = new THREE.Vector3(
                startPos.x + velocity.x * t,
                startPos.y + velocity.y * t
                    - 0.5 * gravity * t * t,
                startPos.z + velocity.z * t
            );

            // Flugbahn am Boden beenden
            if (point.y < 0.18) {
                break;
            }

            points.push(point);
        }

        // Geometrie mit berechneten Punkten aktualisieren
        geometry.setFromPoints(points);

        geometry.computeBoundingSphere();
    }

    update(50);

    return {
        update
    };
}


// Arm erstellen: Schulter -> Oberarm -> Ellbogen -> Unterarm
export function createArm(scene) {

    const geometry = new THREE.BoxGeometry();

    const material = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0
    });

    const material2 = new THREE.MeshStandardMaterial({
        color: 0x008000,
        roughness: 0.8,
        metalness: 0
    });

    // Oberarm (Länge 0.45, zeigt nach -z)
    const upperArm = new THREE.Mesh(geometry, material);
    upperArm.scale.set(0.15, 0.15, 0.45);
    upperArm.position.z = -0.225;          // halbe Länge
    upperArm.castShadow = true;

    // Schulter = Drehpunkt des Oberarms
    const shoulder = new THREE.Group();
    shoulder.rotation.order = 'YXZ';       // erst schwenken, dann heben
    shoulder.position.set(-0.4, 4, 5);
    shoulder.add(upperArm);

    // Unterarm (Länge 0.38)
    const lowerArm = new THREE.Mesh(geometry, material2);
    lowerArm.scale.set(0.13, 0.13, 0.38);
    lowerArm.position.z = -0.19;           // halbe Länge
    lowerArm.castShadow = true;

    // Ellbogen = Drehpunkt des Unterarms, am Ende des Oberarms
    const elbow = new THREE.Group();
    elbow.position.z = -0.45;
    elbow.add(lowerArm);
    shoulder.add(elbow);

    scene.add(shoulder);

    return { shoulder, elbow };
}