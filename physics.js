import * as THREE from 'three';

// =====================================
// PHYSIK-KONSTANTEN
// =====================================

const gravity = 9.81;
const ballRadius = 0.18;

// Substeps gegen "Tunneling" (Ball fliegt durch Brett/Ring)
const SUBSTEPS = 4;

// Ring: Werte müssen zum Torus in Objects.js passen
const RING_CENTER = new THREE.Vector3(0, 3.05, -6.73);
const RING_RADIUS = 0.30;
const RING_TUBE = 0.02;

const X_AXIS = new THREE.Vector3(1, 0, 0);


// =====================================
// WURFGESCHWINDIGKEIT BERECHNEN
// =====================================

export function calculateThrowVelocity(kraft, elbowX) {

    const velocity = new THREE.Vector3(
        0,
        3 + kraft * 0.08,
        -kraft * 0.2
    );

    // Ellbogenwinkel kippt die Wurfrichtung nach oben:
    // größerer Winkel = steilerer Abwurf = höherer Bogen
    velocity.applyAxisAngle(X_AXIS, elbowX);

    return velocity;

}


// =====================================
// 1. KOLLISION MIT DEM BRETT
// =====================================

function checkBoardCollision(ball, velocity) {

    const radius = ballRadius;
    const center = new THREE.Vector3(0, 3.425, -7);
    const half = new THREE.Vector3(0.9, 0.525, 0.025);

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

    const normal = new THREE.Vector3().subVectors(ball.position, closest);
    const distance = normal.length();

    if (distance < radius) {

        if (distance < 0.0001) {
            normal.set(0, 0, velocity.z < 0 ? 1 : -1);
        } else {
            normal.normalize();
        }

        ball.position.copy(closest).addScaledVector(normal, radius + 0.001);

        const speed = velocity.dot(normal);

        if (speed < 0) {
            velocity.addScaledVector(normal, -(1 + 0.7) * speed);
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

    const normal = new THREE.Vector3().subVectors(ball.position, closest);
    const distance = normal.length();
    const collisionDistance = ballRadius + RING_TUBE;

    if (distance < collisionDistance) {

        if (distance < 0.0001) {
            normal.set(0, velocity.y >= 0 ? 1 : -1, 0);
        } else {
            normal.normalize();
        }

        ball.position.copy(closest).addScaledVector(normal, collisionDistance + 0.001);

        const speed = velocity.dot(normal);

        if (speed < 0) {
            velocity.addScaledVector(normal, -(1 + 0.7) * speed);
        }

    }

}


// =====================================
// 3. KORB-ERKENNUNG
// =====================================

function checkScore(b) {

    const pos = b.mesh.position;
    const prev = b.prevPos;
    let hit = false;

    if (!b.scored && prev.y > RING_CENTER.y && pos.y <= RING_CENTER.y) {

        // Schnittpunkt mit der Ringebene interpolieren
        const t = (prev.y - RING_CENTER.y) / (prev.y - pos.y);
        const x = THREE.MathUtils.lerp(prev.x, pos.x, t);
        const z = THREE.MathUtils.lerp(prev.z, pos.z, t);

        if (Math.hypot(x - RING_CENTER.x, z - RING_CENTER.z) < RING_RADIUS) {
            b.scored = true;
            hit = true;
        }

    }

    prev.copy(pos);

    return hit;

}


// =====================================
// 4. PHYSIK-SCHRITT FÜR EINEN BALL
// =====================================

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

    // Korb prüfen
    const scored = checkScore(b);

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

    return scored;

}


// =====================================
// 5. GESAMTE PHYSIK AKTUALISIEREN
// =====================================

export function updatePhysics(balls, dt, onScore) {

    const h = dt / SUBSTEPS;

    for (const b of balls) {

        for (let i = 0; i < SUBSTEPS; i++) {

            if (!b.moving) break;

            if (stepBall(b, h) && onScore) {
                onScore();
            }

        }

    }

}