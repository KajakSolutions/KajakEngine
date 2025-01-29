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

const trackBarriers = new TrackBarriers({
    segments: [
        { start: vec2D(-60, -30), end: vec2D(60, -30) },
        { start: vec2D(60, -30), end: vec2D(60, 30) },
        { start: vec2D(60, 30), end: vec2D(-60, 30) },
        { start: vec2D(-60, 30), end: vec2D(-60, -30) },

        { end: vec2D(-20, -10), start: vec2D(20, -10) },
        { end: vec2D(20, -10), start: vec2D(20, 10) },
        { end: vec2D(20, 10), start: vec2D(-20, 10) },
        { end: vec2D(-20, 10), start: vec2D(-20, -10) },
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

function createCar(position: Vec2D, imageSrc: string) {
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
        })
    });
}

function setupOverlaps(scene: Scene) {
    const cars = Array.from(scene.gameObjects.values())
        .filter(obj => obj instanceof CarObject);

    const barriers = Array.from(scene.gameObjects.values())
        .filter(obj => obj instanceof TreeObject);

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
}

const barrierCollider2 = new PolygonCollider(
    vec2D(0, 0),
    [
        vec2D(0, 14),
        vec2D(-22, 1),
        vec2D(-22, -1),
        vec2D(0, -14),
    ]
);

const box2 =  new TreeObject({
    position: vec2D(38, 0),
    size: vec2D(2, 2),
    movable: false,
    collider: barrierCollider2,
    mass: 1500,
    spriteManager: new SpriteManager({
        imageSrc: 'src/assets/car1.png',
        cellSize: vec2D(32, 32),
        count: 48,
        columns: 7
    })
});


const barrierCollider = new PolygonCollider(
    vec2D(0, 0),
    [
        vec2D(0, 14),
        vec2D(22, 1),
        vec2D(22, -1),
        vec2D(0, -14),
    ]
);

const box =  new TreeObject({
    position: vec2D(-36, 0),
    size: vec2D(2, 2),
    movable: false,
    collider: barrierCollider,
    mass: 1500,
    spriteManager: new SpriteManager({
        imageSrc: 'src/assets/car1.png',
        cellSize: vec2D(32, 32),
        count: 48,
        columns: 7
    })
});

// Tworzenie obiektów
const playerCar = createCar(vec2D(3, 20), 'src/assets/car3.png');
const playerCar2 = createCar(vec2D(10, 20), 'src/assets/car2.png');

mainScene.addObject(playerCar);
mainScene.addObject(playerCar2);
mainScene.addObject(box);
mainScene.addObject(box2);

// Dodatkowe samochody
for(let i = 0; i < 0; i++) {
    const car = createCar(
        vec2D(0.1 * i - 60, 0.05 * i - 20),
        'src/assets/car2.png'
    );
    mainScene.addObject(car);
}

// Konfiguracja overlap
setupOverlaps(mainScene);

// Obsługa sterowania (bez zmian)
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
        case 'w':
            playerCar2.setThrottle(83.91);
            break;
        case 's':
            playerCar2.setThrottle(-30);
            break;
        case 'a':
            playerCar2.setSteerAngle(-Math.PI/4);
            break;
        case 'd':
            playerCar2.setSteerAngle(Math.PI/4);
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            playerCar.setThrottle(0);
            break;
        case 'ArrowDown':
            playerCar.setThrottle(0);
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            playerCar.setSteerAngle(0);
            break;
        case 'w':
            playerCar2.setThrottle(0);
            break;
        case 's':
            playerCar2.setThrottle(0);
            break;
        case 'a':
        case 'd':
            playerCar2.setSteerAngle(0);
            break;
    }
});

engine.start();
