import CarObject from "./objects/CarObject.ts";
import PolygonCollider from "./objects/Colliders/PolygonCollider.ts";
import {vec2D} from "./utils/math.ts";
import Scene from "./Scene.ts";
import KajakEngine from "./KajakEngine.ts";
import {AABBCollider} from "./objects/Colliders/AABBCollider.ts";
import TreeObject from "./objects/TreeObject.ts";

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);
const engine = new KajakEngine(canvas);

const worldBounds = { x: -canvas.width/2, y: -canvas.height/2, width: canvas.width, height: canvas.height };
const mainScene = new Scene(worldBounds);
engine.scenes.set(1, mainScene);
engine.setCurrentScene(1);

// @ts-ignore
const carAABBCollider = new AABBCollider(
    vec2D(-1.5, -1.5),
    vec2D(3, 3)
);

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
    wheelBase: 2.4
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
    wheelBase: 2.4
});

const TreeCollider = new PolygonCollider(
    vec2D(-5, 0),
    [
        vec2D(-2, -2),
        vec2D(2, -2),
        vec2D(2, 2),
        vec2D(-2, 2)
    ]
);

const tree = new TreeObject({
    position: vec2D(-5, -5),
    size: vec2D(2, 2),
    movable: false,
    collider: TreeCollider,
    mass: 1500
    }
)

const BoxCollider = new PolygonCollider(
    vec2D(0, 0),
    [
        vec2D(0, 4),
        vec2D(3, 1.2),
        vec2D(2.4, -3.2),
        vec2D(-2.4, -3.2),
        vec2D(-3.8, 1.2)
    ]
);

const box = new TreeObject({
        position: vec2D(0, 0),
        size: vec2D(2, 2),
        movable: false,
        collider: BoxCollider,
        mass: 1500
    }
)

mainScene.addObject(playerCar);
mainScene.addObject(playerCar2);
mainScene.addObject(tree);
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
