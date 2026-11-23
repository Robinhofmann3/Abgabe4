import * as THREE from 'three';

export function createLights(scene) {

    // Umgebungslicht
    const hemisphereLight = new THREE.HemisphereLight(
        0xffffff,
        0x888888,
        1.2
    );
    scene.add(hemisphereLight);

    // Gerichtetes Licht
    const directionalLight = new THREE.DirectionalLight(
        0xffffff,
        2
    );
    directionalLight.position.set(-20, 30, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);

    // Schattenbereich so groß wie das Spielfeld
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 100;

    scene.add(directionalLight);
}