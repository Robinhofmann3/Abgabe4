import * as THREE from 'three';

export const COURT_WIDTH = 80;
export const COURT_DEPTH = 140;

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


export function createBasket(scene) {

    const basket = new THREE.Group();
    basket.name = 'basket';
    const boardZ = -7;
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.05, 0.05),
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        })
    );

    board.position.set(0, 3.425, boardZ);
    board.castShadow = true;
    basket.add(board);

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
    ring.position.set(0, 3.05, boardZ + 0.27);
    ring.castShadow = true;
    basket.add(ring);

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
    pole.position.set(0, poleHeight / 2, boardZ - 0.025 - poleRadius);
    pole.castShadow = true;
    basket.add(pole);

    scene.add(basket);

    return { basket, ring };
}


const ballGeometry = new THREE.SphereGeometry(0.18, 32, 32);

const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    roughness: 0.8
});

export function createBall() {
    const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone());
    ball.castShadow = true;

    return ball;
}


export function createPlayer(scene, shoulderY = 1.5) {

    const player = new THREE.Group();
    player.name = 'player';
    player.position.set(-0.1, 0, 5);
    scene.add(player);

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

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
        jointMaterial
    );
    base.position.set(0.4, 0.05, 0.1);
    base.castShadow = true;
    base.receiveShadow = true;
    player.add(base);

    const standHeight = Math.max(shoulderY - 0.7, 0.01);
    const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 3.3, 16),
        jointMaterial
    );
    stand.scale.y = standHeight / 3.3;
    stand.position.set(0.4, standHeight / 2, 0.1);
    stand.castShadow = true;
    player.add(stand);

    const body = new THREE.Group();
    body.position.set(0, shoulderY, 0);
    player.add(body);

    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.8, 0.4),
        bodyMaterial
    );
    torso.position.set(0.4, -0.3, 0.1);
    torso.castShadow = true;
    body.add(torso);

    const shoulderJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        jointMaterial
    );
    shoulderJoint.castShadow = true;
    body.add(shoulderJoint);

    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16),
        jointMaterial
    );
    neck.position.set(0.4, 0.16, 0.1);
    body.add(neck);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 24, 24),
        bodyMaterial
    );
    head.position.set(0.4, 0.38, 0.1);
    head.castShadow = true;
    body.add(head);

    const geometry = new THREE.BoxGeometry();

    const upperArmMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0
    });

    const lowerArmMaterial = new THREE.MeshStandardMaterial({
        color: 0x008000,
        roughness: 0.8,
        metalness: 0
    });

    const shoulder = new THREE.Group();
    shoulder.rotation.order = 'YXZ';
    body.add(shoulder);

    const upperArm = new THREE.Mesh(geometry, upperArmMaterial);
    upperArm.scale.set(0.15, 0.15, 0.45);
    upperArm.position.z = -0.225;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.z = -0.45;
    shoulder.add(elbow);

    const lowerArm = new THREE.Mesh(geometry, lowerArmMaterial);
    lowerArm.scale.set(0.13, 0.13, 0.38);
    lowerArm.position.z = -0.19;
    lowerArm.castShadow = true;
    elbow.add(lowerArm);

    return { player, body, shoulder, elbow };
}