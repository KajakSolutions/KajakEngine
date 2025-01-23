import {QuadTree} from "./objects/QuadTree.ts";
import {BoundingBox} from "./types/math";
import PhysicObject from "./objects/PhysicObject.ts";
import CarObject from "./objects/CarObject.ts";
import {vec2D} from "./utils/math.ts";
import {AABBCollider} from "./objects/Colliders/AABBCollider.ts";
import CircleCollider from "./objects/Colliders/CircleCollider.ts";
import PolygonCollider from "./objects/Colliders/PolygonCollider.ts";
import MapObject from "./objects/MapObject.ts";

export default class Scene {
    private _gameObjects: Map<number, PhysicObject> = new Map();
    private _quadTree: QuadTree;
    private nextId: number = 1;
    private scale: number = 10;
    private _map = new MapObject({backgroundSrc: 'src/assets/map.png', traceFragments: []});

    constructor(worldBounds: BoundingBox) {
        this._quadTree = new QuadTree(worldBounds);
    }

    get gameObjects(): Map<number, PhysicObject> {
        return this._gameObjects;
    }

    get map(): MapObject {
        return this._map;
    }

    addObject(object: PhysicObject): number {
        const id = this.nextId++;
        this._gameObjects.set(id, object);
        return id;
    }

    removeObject(id: number): void {
        this._gameObjects.delete(id);
    }

    update(deltaTime: number): void {
        this._quadTree.clear();
        for (const obj of this._gameObjects.values()) {
            if (obj.collider) {
                this._quadTree.insert(obj);
            }
        }

        for (const obj of this._gameObjects.values()) {
            if (obj instanceof PhysicObject) {
                const boundingBox = obj.collider.getBoundingBox();
                const nearbyObjects = this._quadTree.query(boundingBox);

                for (const other of nearbyObjects) {
                    if (other !== obj && other instanceof PhysicObject) {
                        obj.collider.updatePosition(vec2D(obj.position.x, -obj.position.y), obj.rotation);
                        const collisionInfo = obj.collider.checkCollision(other.collider);
                        if (collisionInfo) {
                            obj.onCollision(other, collisionInfo);
                            // other.onCollision(obj, collisionInfo);
                        }
                    }
                }
            }
            obj.update(deltaTime);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();
        ctx.translate(window.innerWidth/2, window.innerHeight/2);
        ctx.scale(this.scale, this.scale);

        for (const obj of this._gameObjects.values()) {
            this.drawObject(ctx, obj);
        }

        ctx.restore();
    }

    private drawObject(ctx: CanvasRenderingContext2D, obj: PhysicObject): void {
        if (obj instanceof CarObject) {
            ctx.save();
            ctx.translate(obj.position.x,- obj.position.y);
            ctx.rotate(obj.rotation);

            ctx.fillStyle = 'blue';
            ctx.fillRect(
                -obj.size.x/2,
                -obj.size.y/2,
                obj.size.x,
                obj.size.y/2
            );

            ctx.fillStyle = 'black';
            ctx.fillRect(
                -obj.size.x/2,
                0,
                obj.size.x,
                obj.size.y/2
            );

           ctx.fillStyle = 'red';
            this.drawWheel(ctx, -obj.size.x/2, obj.frontAxleToCg, 0, obj);
            this.drawWheel(ctx, obj.size.x/2, obj.frontAxleToCg,  0, obj);
            this.drawWheel(ctx, -obj.size.x/2, -obj.rearAxleToCg, obj.steerAngle, obj);
            this.drawWheel(ctx, obj.size.x/2, -obj.rearAxleToCg,  obj.steerAngle, obj);
            ctx.restore();
        }

        if (obj.collider) this.drawCollider(ctx, obj);
    }

    // @ts-ignore
    private drawWheel(ctx, x, y, angle, car) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillRect(
            -car.wheelSize.x/2,
            -car.wheelSize.y/2,
            car.wheelSize.x,
            car.wheelSize.y
        );
        ctx.restore();
    }

    private drawCollider(ctx: CanvasRenderingContext2D, obj: PhysicObject): void {
        const bb = obj.collider.getBoundingBox();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 0.1;
        ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);

        if(obj.collider instanceof PolygonCollider){
            // @ts-ignore
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 0.05;
            ctx.beginPath();
            // @ts-ignore
            ctx.moveTo(obj.collider.vertices[0].x + obj.position.x, obj.collider.vertices[0].y - obj.position.y);
            // @ts-ignore
            ctx.lineTo(obj.collider.vertices[1].x + obj.position.x, obj.collider.vertices[1].y - obj.position.y);
            // @ts-ignore
            ctx.lineTo(obj.collider.vertices[2].x + obj.position.x, obj.collider.vertices[2].y - obj.position.y);
            // @ts-ignore
            ctx.lineTo(obj.collider.vertices[3].x + obj.position.x, obj.collider.vertices[3].y - obj.position.y);
            ctx.closePath();
            ctx.stroke();
        } else if (obj.collider instanceof AABBCollider) {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 0.05;
            ctx.strokeRect(obj.collider.position.x, obj.collider.position.y, obj.collider.size.x, obj.collider.size.y);
        } else if (obj.collider instanceof CircleCollider) {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 0.05;
            ctx.beginPath();
            ctx.arc(obj.collider.position.x, obj.collider.position.y, obj.collider.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
}
