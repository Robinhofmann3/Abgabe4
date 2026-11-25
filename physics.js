import * as THREE from 'three';

const DT = 1 / 60;
const RING_CENTER = new THREE.Vector3(0, 3.05, -6.73);

// 1. Wurf-Startgeschwindigkeit
export function calculateThrowVelocity(kraft, winkel) {
    const velocity = new THREE.Vector3(0, 3 + kraft * 0.08, -kraft * 0.2);
    velocity.applyAxisAngle(new THREE.Vector3(1, 0, 0), winkel);
    return velocity;
}

// 2. Bewegung & Kollisionen 
export function updatePhysics(balls, onScore) {
    for (const b of balls) {
        if (!b.moving) continue;

        const ball = b.mesh;
        const vel = b.velocity;

        // Schwerkraft & Bewegung
        vel.y -= 9.81 * DT;
        ball.position.addScaledVector(vel, DT);

        // Brett-Abpraller
        if (ball.position.z < -6.8 && ball.position.y > 2.8 && Math.abs(ball.position.x) < 0.9) {
            ball.position.z = -6.8;
            vel.z *= -0.6;
        }

        // Treffer prüfen
        if (!b.scored && vel.y < 0 && ball.position.distanceTo(RING_CENTER) < 0.35) {
            b.scored = true;
            if (onScore) onScore();
        }

        // Boden-Kollision
        if (ball.position.y <= 0.18) {
            ball.position.y = 0.18;
            vel.y *= -0.6;
            vel.x *= 0.8;
            vel.z *= 0.8;

            if (Math.abs(vel.y) < 0.8) {
                b.moving = false;
            }
        }
    }
}