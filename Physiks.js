import * as CANNON from 'cannon-es';
import { COURT_DEPTH } from './Objects.js';

export function createPhysics(startPosition) {
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // Physik-Materialien: Reibung und Abprall zwischen Ball und festen Objekten
    const ballMat = new CANNON.Material('ball');
    const hardMat = new CANNON.Material('hard');
    world.addContactMaterial(new CANNON.ContactMaterial(ballMat, hardMat, {
        friction: 0.4,
        restitution: 0.7     // 0 = bleibt liegen, 1 = springt voll zurück
    }));

    const boardZ = -14 / 2;

    // Feste Körper (mass 0 = bewegen sich nie)
    function addStatic(x, y, z) {
        const body = new CANNON.Body({ mass: 0, material: hardMat });
        body.position.set(x, y, z);
        world.addBody(body);
        return body;
    }

    // Boden
    const ground = addStatic(0, 0, 0);
    ground.addShape(new CANNON.Plane());
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

    // Brett (halbe Kantenlängen)
    const board = addStatic(0, 3.425, boardZ);
    board.addShape(new CANNON.Box(new CANNON.Vec3(0.9, 0.525, 0.025)));

    // Pfosten (als Quader angenähert)
    const pole = addStatic(0, 3.425 / 2, boardZ - 0.025 - 0.08);
    pole.addShape(new CANNON.Box(new CANNON.Vec3(0.08, 3.425 / 2, 0.08)));

    // Ring: kleine Kugeln im Kreis angeordnet (cannon hat keinen Torus)
    const ring = addStatic(0, 3.05, boardZ + 0.27);
    const SEGMENTS = 24;
    for (let i = 0; i < SEGMENTS; i++) {
        const a = (i / SEGMENTS) * Math.PI * 2;
        ring.addShape(
            new CANNON.Sphere(0.02),
            new CANNON.Vec3(Math.cos(a) * 0.23, 0, Math.sin(a) * 0.23)
        );
    }

    // Ball
    const ballBody = new CANNON.Body({
        mass: 0.6,
        shape: new CANNON.Sphere(0.18),
        material: ballMat
    });
    ballBody.position.set(startPosition.x, startPosition.y, startPosition.z);
    world.addBody(ballBody);

    let thrown = false;

    return {
        world,

        throwBall(position, velocity) {
            ballBody.position.set(position.x, position.y, position.z);
            ballBody.velocity.set(velocity.x, velocity.y, velocity.z);
            ballBody.angularVelocity.set(0, 0, 0);
            ballBody.quaternion.set(0, 0, 0, 1);
            thrown = true;
        },

        // jedes Frame aufrufen: Physik rechnen und Mesh anpassen
        update(dt, ballMesh) {
            if (!thrown) return;      // Ball hängt in der Luft, bis geworfen wird
            world.step(1 / 60, dt, 3);
            ballMesh.position.copy(ballBody.position);
            ballMesh.quaternion.copy(ballBody.quaternion);
        }
    };
}