import CarObject from "./objects/CarObject.ts";
import PolygonCollider from "./objects/Colliders/PolygonCollider.ts";
import {vec2D} from "./utils/math.ts";
import Scene from "./Scene.ts";
import KajakEngine from "./KajakEngine.ts";
import {AABBCollider} from "./objects/Colliders/AABBCollider.ts";
import TreeObject from "./objects/TreeObject.ts";
import SpriteManager from "./objects/SpriteManager.ts";

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const engine = new KajakEngine(canvas);

const worldBounds = { x: -canvas.width/(2 * Scene.scale), y: -canvas.height/(2 * Scene.scale), width: canvas.width* Scene.scale, height: canvas.height * Scene.scale };
const mainScene = new Scene(worldBounds);
engine.scenes.set(1, mainScene);
engine.setCurrentScene(1);

// @ts-ignore
const carAABBCollider = new AABBCollider(
    vec2D(-1.5, -1.5),
    vec2D(3, 3)
);

// @ts-ignore
const carAABBCollider2 = new AABBCollider(
    vec2D(-1.5, -1.5),
    vec2D(3, 3)
);

// @ts-ignore
const carPolygonCollider = new PolygonCollider(
    vec2D(0, 0),
    [
        vec2D(-0.75, -1.5),
        vec2D(0.75, -1.5),
        vec2D(0.75, 1.5),
        vec2D(-0.75, 1.5)
    ]
);

const playerCar = new CarObject({
    position: vec2D(3, 0),
    size: vec2D(1.5, 3),
    movable: true,
    collider: carPolygonCollider,
    mass: 1500,
    maxGrip: 2,
    wheelBase: 2.4,
    spriteManager: new SpriteManager({
        imageSrc: 'src/assets/car1.png',
        cellSize: vec2D(32, 32),
        count: 48,
        columns: 7
    })
});

const carCollider2 = new PolygonCollider(
    vec2D(0, 0),
    [
        vec2D(-0.75, -1.5),
        vec2D(0.75, -1.5),
        vec2D(0.75, 1.5),
        vec2D(-0.75, 1.5)
    ]
);

const playerCar2 = new CarObject({
    position: vec2D(10, 0.1),
    size: vec2D(1.5, 3),
    movable: true,
    collider: carCollider2,
    mass: 1500,
    maxGrip: 2,
    wheelBase: 2.4,
    spriteManager: new SpriteManager({
        imageSrc: 'src/assets/car2.png',
        cellSize: vec2D(32, 32),
        count: 48,
        columns: 7
    })
});

const BoxCollider2 = new PolygonCollider(
    vec2D(0, 0),
    [
        vec2D(0, 14),
        vec2D(-22, 2),
        vec2D(-22, -2),
        vec2D(0, -14),
    ]
);

const box2 = new TreeObject({
    position: vec2D(38, 0),
    size: vec2D(2, 2),
    movable: false,
    collider: BoxCollider2,
    mass: 1500,
    spriteManager: new SpriteManager({
        imageSrc: 'src/assets/car1.png',
        cellSize: vec2D(32, 32),
        count: 48,
        columns: 7
    })
});

const BoxCollider = new PolygonCollider(
    vec2D(0, 0),
    [
        vec2D(0, 14),
        vec2D(22, 1),
        vec2D(22, -1),
        vec2D(0, -14),
    ]
);

const box = new TreeObject({
        position: vec2D(-36, 0),
        size: vec2D(2, 2),
        movable: false,
        collider: BoxCollider,
        mass: 1500,
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/car1.png',
            cellSize: vec2D(32, 32),
            count: 48,
            columns: 7
        })
});

for(let i = 0; i < 10; i++) {
    const collider = new PolygonCollider(
        vec2D(0, 0),
        [
            vec2D(-0.75, -1.5),
            vec2D(0.75, -1.5),
            vec2D(0.75, 1.5),
            vec2D(-0.75, 1.5)
        ]
    );

    const car = new CarObject({
        position: vec2D(0.1* i - 60,0.05 * i - 20),
        size: vec2D(1.5, 3),
        movable: true,
        collider: collider,
        mass: 1500,
        maxGrip: 2,
        wheelBase: 2.4,
        spriteManager: new SpriteManager({
            imageSrc: 'src/assets/car2.png',
            cellSize: vec2D(32, 32),
            count: 48,
            columns: 7
        })
    });

    mainScene.addObject(car);
}


mainScene.addObject(playerCar);
mainScene.addObject(playerCar2);
mainScene.addObject(box2);
mainScene.addObject(box);


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
