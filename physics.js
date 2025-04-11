console.log('physics.js loaded');

function setupPhysics(Ammo) {
    console.log('setupPhysics called');

    // Physics setup (Ammo.js)
    const physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        new Ammo.btDefaultCollisionDispatcher(),
        new Ammo.btDbvtBroadphase(),
        new Ammo.btSequentialImpulseConstraintSolver(),
        new Ammo.btDefaultCollisionConfiguration()
    );
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
    console.log('Physics world created:', physicsWorld);

    return physicsWorld;
}