import CarObject from "./objects/CarObject.ts";
import PolygonCollider from "./objects/Colliders/PolygonCollider.ts";
import {vec2D} from "./utils/math.ts";
import Scene from "./Scene.ts";
import KajakEngine from "./KajakEngine.ts";
import TreeObject from "./objects/TreeObject.ts";
import SpriteManager from "./objects/SpriteManager.ts";
import {Vec2D} from "./types/math";
import Overlap from "./objects/Overlap.ts";
import {TrackBarriers} from "./objects/BarierSystem.ts";
import {AIController} from "./objects/AIController.ts";
import CheckpointObject from "./objects/CheckpointObject.ts";

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const engine = new KajakEngine(canvas);

const worldBounds = {
    x: -canvas.width/(2 * Scene.scale),
    y: -canvas.height/(2 * Scene.scale),
    width: canvas.width * Scene.scale,
    height: canvas.height * Scene.scale
};

const mainScene = new Scene(worldBounds);
engine.scenes.set(1, mainScene);
engine.setCurrentScene(1);

// Create checkpoints
const checkpoints = [
    new CheckpointObject({
        position: vec2D(-50, 10),
        size: vec2D(10, 2),
        order: 0,
        isFinishLine: false,
        movable: false,
        collider: new PolygonCollider(
            vec2D(0, 0),
            [
                vec2D(-5, -1),
                vec2D(5, -1),
                vec2D(5, 1),
                vec2D(-5, 1)
            ]
        ),
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/map2.png',
            cellSize: vec2D(32, 32),
            count: 1,
            columns: 1
        }),
        mass: 1
    }),
    new CheckpointObject({
        position: vec2D(-20, 12),
        size: vec2D(10, 2),
        order: 1,
        isFinishLine: false,
        movable: false,
        collider: new PolygonCollider(
            vec2D(0, 0),
            [
                vec2D(-5, -1),
                vec2D(5, -1),
                vec2D(5, 1),
                vec2D(-5, 1)
            ]
        ),
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/map2.png',
            cellSize: vec2D(32, 32),
            count: 1,
            columns: 1
        }),
        mass: 1
    }),
    new CheckpointObject({
        position: vec2D(25, -15),
        size: vec2D(10, 2),
        order: 2,
        isFinishLine: false,
        movable: false,
        collider: new PolygonCollider(
            vec2D(0, 0),
            [
                vec2D(-5, -1),
                vec2D(5, -1),
                vec2D(5, 1),
                vec2D(-5, 1)
            ]
        ),
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/map2.png',
            cellSize: vec2D(32, 32),
            count: 1,
            columns: 1
        }),
        mass: 1
    }),
    new CheckpointObject({
        position: vec2D(25, 18),
        size: vec2D(10, 2),
        order: 3,
        isFinishLine: false,
        movable: false,
        collider: new PolygonCollider(
            vec2D(0, 0),
            [
                vec2D(-5, -1),
                vec2D(5, -1),
                vec2D(5, 1),
                vec2D(-5, 1)
            ]
        ),
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/map2.png',
            cellSize: vec2D(32, 32),
            count: 1,
            columns: 1
        }),
        mass: 1
    }),
    new CheckpointObject({
        position: vec2D(-35, -23),
        size: vec2D(10, 2),
        order: 4,
        isFinishLine: false,
        movable: false,
        collider: new PolygonCollider(
            vec2D(0, 0),
            [
                vec2D(-5, -1),
                vec2D(5, -1),
                vec2D(5, 1),
                vec2D(-5, 1)
            ]
        ),
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/map2.png',
            cellSize: vec2D(32, 32),
            count: 1,
            columns: 1
        }),
        mass: 1
    }),
    new CheckpointObject({
        position: vec2D(-45, 0),
        size: vec2D(10, 2),
        order: 5,
        isFinishLine: true,
        movable: false,
        collider: new PolygonCollider(
            vec2D(0, 0),
            [
                vec2D(-5, -1),
                vec2D(5, -1),
                vec2D(5, 1),
                vec2D(-5, 1)
            ]
        ),
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/map2.png',
            cellSize: vec2D(32, 32),
            count: 1,
            columns: 1
        }),
        mass: 1
    }),
    // Add more checkpoints here as needed for the track
];

checkpoints.forEach(checkpoint => {
    mainScene.addObject(checkpoint);
});

const trackBarriers = new TrackBarriers({
    segments: [
        { end: vec2D(-55, -30), start: vec2D(60, -30) },
        { end: vec2D(60, -30), start: vec2D(60, 30) },
        { end: vec2D(60, 30), start: vec2D(-60, 30) },
        { end: vec2D(-60, 30), start: vec2D(-55, -30) },

        // { start: vec2D(-20, -10), end: vec2D(20, -10) },
        // { start: vec2D(20, -10), end: vec2D(20, 10) },
        // { start: vec2D(20, 10), end: vec2D(-20, 10) },
        // { start: vec2D(-20, 10), end: vec2D(-20, -10) },
    ],
    thickness: 1
});

trackBarriers.addToScene(mainScene);

function setupBarrierCollisions(scene: Scene) {
    const cars = Array.from(scene.gameObjects.values())
        .filter(obj => obj instanceof CarObject);

    trackBarriers.segments.forEach(barrier => {
        cars.forEach(car => {
            const overlap = new Overlap(
                car,
                barrier,
                (vehicle, barrierObj, collisionInfo) => {
                    if (collisionInfo) {
                        vehicle.onCollision(barrierObj, collisionInfo);
                    }
                },
                { customCollisionHandler: true }
            );
            scene.overlapManager.addOverlap(overlap);
        });
    });
}

function createCarCollider() {
    return new PolygonCollider(
        vec2D(0, 0),
        [
            vec2D(-0.75, -1.5),
            vec2D(0.75, -1.5),
            vec2D(0.75, 1.5),
            vec2D(-0.75, 1.5)
        ]
    );
}

let nextCarId = 0;

function createCar(position: Vec2D, imageSrc: string, isPlayer: boolean = false): CarObject {
    const carId = nextCarId++;
    return new CarObject({
        position: position,
        size: vec2D(1.5, 3),
        movable: true,
        collider: createCarCollider(),
        mass: 1500,
        maxGrip: 2,
        wheelBase: 2.4,
        spriteManager: new SpriteManager({
            imageSrc: imageSrc,
            cellSize: vec2D(32, 32),
            count: 48,
            columns: 7
        }),
        isPlayer,
        id: carId
    });
}

function createAICar(position: Vec2D, imageSrc: string): CarObject {
    const car = createCar(position, imageSrc);
    const ai = new AIController(car);

    const waypoints = checkpoints.map(cp => cp.position);
    ai.setWaypoints(waypoints);

    const originalUpdate = car.update.bind(car);
    car.update = (deltaTime: number) => {
        ai.update();
        originalUpdate(deltaTime);
    };

    return car;
}

// Create the player car
const playerCar = createCar(vec2D(-50, -5), 'src/assets/car3.png', true);
mainScene.addObject(playerCar);

// Create AI opponents
for (let i = 0; i < 4; i++) {
    const aiCar = createAICar(
        vec2D(-45 - i * 3, -10),
        'src/assets/car2.png'
    );
    mainScene.addObject(aiCar);
}

// Add static obstacles
const box = new TreeObject({
    position: vec2D(-36, 0),
    size: vec2D(2, 2),
    movable: false,
    collider: new PolygonCollider(
        vec2D(0, 0),
        [
            vec2D(0, 14),
            vec2D(22, 1),
            vec2D(22, -1),
            vec2D(0, -14),
        ]
    ),
    mass: 1500,
    spriteManager: new SpriteManager({
        imageSrc: 'src/assets/car1.png',
        cellSize: vec2D(32, 32),
        count: 48,
        columns: 7
    })
});

const box2 = new TreeObject({
    position: vec2D(38, 0),
    size: vec2D(2, 2),
    movable: false,
    collider: new PolygonCollider(
        vec2D(0, 0),
        [
            vec2D(0, 14),
            vec2D(-22, 1),
            vec2D(-22, -1),
            vec2D(0, -14),
        ]
    ),
    mass: 1500,
    spriteManager: new SpriteManager({
        imageSrc: 'src/assets/car1.png',
        cellSize: vec2D(32, 32),
        count: 48,
        columns: 7
    })
});

mainScene.addObject(box);
mainScene.addObject(box2);

function setupCheckpointOverlaps(scene: Scene) {
    const cars = Array.from(scene.gameObjects.values())
        .filter(obj => obj instanceof CarObject);

    const checkpoints = Array.from(scene.gameObjects.values())
        .filter(obj => obj instanceof CheckpointObject);

    for (const car of cars) {
        for (const checkpoint of checkpoints) {
            const overlap = new Overlap(
                car,
                checkpoint,
                (vehicle, checkpointObj) => {
                    if (vehicle instanceof CarObject && checkpointObj instanceof CheckpointObject) {
                        console.log(vehicle.isPlayer, !checkpointObj.isActivated);
                        if (vehicle.isPlayer && !checkpointObj.isActivated) {
                            console.log('overlap', vehicle.isPlayer, checkpointObj);
                            checkpointObj.activate(vehicle);
                            if (!checkpointObj.isFinish) {
                                scene.removeObject(checkpointObj.id);

                            }
                        }
                    }
                }
            );
            scene.overlapManager.addOverlap(overlap);
        }
    }
}

function setupOverlaps(scene: Scene) {
    const cars = Array.from(scene.gameObjects.values())
        .filter(obj => obj instanceof CarObject);

    const barriers = Array.from(scene.gameObjects.values())
        .filter(obj => obj instanceof TreeObject);

    // Car-to-car collisions
    for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
            const overlap = new Overlap(
                cars[i],
                cars[j],
                (car1, car2, collisionInfo) => {
                    if (collisionInfo) {
                        car1.onCollision(car2, collisionInfo);
                    }
                },
                { customCollisionHandler: true }
            );
            scene.overlapManager.addOverlap(overlap);
        }
    }

    // Car-to-barrier collisions
    for (const car of cars) {
        for (const barrier of barriers) {
            const overlap = new Overlap(
                car,
                barrier,
                (vehicle, staticObj, collisionInfo) => {
                    if (collisionInfo) {
                        vehicle.onCollision(staticObj, collisionInfo);
                    }
                },
                { customCollisionHandler: true }
            );
            scene.overlapManager.addOverlap(overlap);
        }
    }

    setupBarrierCollisions(scene);
    setupCheckpointOverlaps(scene);
}

// Setup all overlaps
setupOverlaps(mainScene);

// Handle player controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            playerCar.setThrottle(83.91);
            break;
        case 'ArrowDown':
            playerCar.setThrottle(-30);
            break;
        case 'ArrowLeft':
            playerCar.setSteerAngle(-Math.PI/4);
            break;
        case 'ArrowRight':
            playerCar.setSteerAngle(Math.PI/4);
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            playerCar.setThrottle(0);
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            playerCar.setSteerAngle(0);
            break;
    }
});

// Add leaderboard container
const leaderboardContainer = document.createElement('div');
leaderboardContainer.id = 'leaderboard-container';
document.body.appendChild(leaderboardContainer);

// Start the game
engine.start();
