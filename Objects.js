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

    return { ring };

}


// Geometrie und Material werden von allen Bällen geteilt
// (deshalb beim Entfernen eines Balls KEIN dispose() aufrufen)
const ballGeometry = new THREE.SphereGeometry(0.18, 32, 32);

const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    roughness: 0.8
});


// Basketball erstellen (jeder Aufruf = neuer Ball)
export function createBall() {

    // Material klonen, damit jeder Ball seine eigene Farbe haben kann
    const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone());
    ball.castShadow = true;

    return ball;
}



// Arm mit Oberkörper erstellen: Schulter -> Oberarm -> Ellbogen -> Unterarm
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


    // ---------- Oberkörper ----------
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        roughness: 0.8,
        metalness: 0
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.6,
        metalness: 0.2
    });

    // Gruppe: Ursprung = Schulterposition (folgt der Schulter in main.js)
    const body = new THREE.Group();
    body.position.copy(shoulder.position);
    scene.add(body);

    // Rumpf (Breite 0.7, Höhe 0.8, Tiefe 0.4), Oberkante knapp über der Schulter
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.8, 0.4),
        bodyMaterial
    );
    torso.position.set(0.4, -0.3, 0.1);
    torso.castShadow = true;
    body.add(torso);

    // Schultergelenk (Kugel am Armansatz)
    const shoulderJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        jointMaterial
    );
    shoulderJoint.castShadow = true;
    body.add(shoulderJoint);

    // Hals
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16),
        jointMaterial
    );
    neck.position.set(0.4, 0.16, 0.1);
    body.add(neck);

    // Kopf
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 24, 24),
        bodyMaterial
    );
    head.position.set(0.4, 0.38, 0.1);
    head.castShadow = true;
    body.add(head);

    // Ständer (Basishöhe 3.3, wird in main.js passend skaliert)
    const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 3.3, 16),
        jointMaterial
    );
    stand.castShadow = true;
    scene.add(stand);

    // Sockel
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
        jointMaterial
    );
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    return { shoulder, elbow, body, stand, base };
}