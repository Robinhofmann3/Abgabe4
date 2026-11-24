import GUI from 'three/addons/libs/lil-gui.module.min.js';

export function createGUI(throwBall, spawnBall) {

    const gui = new GUI();

    const params = {
        Kraft: 47,
        throwBall: function () {
            throwBall();
        },
        spawnBall: function () {
            spawnBall();
        },
        X: -0.1,
        Z: 5.3,
        ShoulderX: 1.69,
        //ShoulderY: 0,
        ElbowX: 0.32
    };

    // Wurf
    gui.add(params, 'Kraft', 0, 100, 1).name('Wurfkraft');
    gui.add(params, 'throwBall').name('Ball werfen');
    gui.add(params, 'spawnBall').name('Ball holen');

    // Position der Schulter
    gui.add(params, 'X', -10, 10, 0.1).name('Arm X');
    gui.add(params, 'Z', -10, 10, 0.1).name('Arm Z');

    // Gelenke
    gui.add(params, 'ShoulderX', -Math.PI / 2, Math.PI, 0.01).name('Schulter heben');
    //gui.add(params, 'ShoulderY', -Math.PI / 2, Math.PI / 2, 0.01).name('Schulter schwenken');
    gui.add(params, 'ElbowX', 0, 2.5, 0.01).name('Ellbogen beugen');

    return params;
}