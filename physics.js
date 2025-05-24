console.log('physics.js loaded');

function setupPhysics() {
    console.log('setupPhysics called');

    const world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    console.log('Physics world created:', world);

    return world;
}