import {QuadTree} from "./objects/QuadTree.ts";
import {BoundingBox} from "./types/math";
import PhysicObject from "./objects/PhysicObject.ts";
import CarObject from "./objects/CarObject.ts";

export default class Scene {
    private _gameObjects: Map<number, PhysicObject> = new Map();
    private _quadTree: QuadTree;
    private nextId: number = 1;
    private scale = 40;

    constructor(worldBounds: BoundingBox) {
        this._quadTree = new QuadTree(worldBounds);
    }

    get gameObjects(): Map<number, PhysicObject> {
        return this._gameObjects;
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

        // Aktualizuj obiekty i sprawdź kolizje
        for (const obj of this._gameObjects.values()) {
            if (obj instanceof PhysicObject) {
                const boundingBox = obj.collider.getBoundingBox();
                const nearbyObjects = this._quadTree.query(boundingBox);

                for (const other of nearbyObjects) {
                    if (other !== obj && other instanceof PhysicObject) {
                        const collisionInfo = obj.collider.checkCollision(other.collider);
                        if (collisionInfo) {
                            obj.onCollision();
                            other.onCollision();
                        }
                    }
                }
            }
            obj.update(deltaTime);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (const obj of this._gameObjects.values()) {
            this.drawObject(ctx, obj);
        }
    }

    private drawObject(ctx: CanvasRenderingContext2D, obj: PhysicObject): void {
        ctx.save();
        ctx.translate(obj.position.x * this.scale, obj.position.y * this.scale);
        ctx.rotate(obj.rotation);

        if (obj instanceof CarObject) {
            // Rysuj samochód
            ctx.fillStyle = 'black';
            ctx.fillRect(-obj.size.x * this.scale, -obj.size.y * this.scale, obj.size.x * this.scale, obj.size.y * this.scale);

            // Rysuj koła
            ctx.fillStyle = 'black';
            const wheelWidth = obj.wheelSize.x;
            const wheelHeight = obj.wheelSize.y;
            // Przednie koła
            ctx.fillRect(-obj.size.x/2, -obj.size.y/2, wheelWidth, wheelHeight);
            ctx.fillRect(obj.size.x/2 - wheelWidth, -obj.size.y/2, wheelWidth, wheelHeight);
            // Tylne koła
            ctx.fillRect(-obj.size.x/2, obj.size.y/2 - wheelHeight, wheelWidth, wheelHeight);
            ctx.fillRect(obj.size.x/2 - wheelWidth, obj.size.y/2 - wheelHeight, wheelWidth, wheelHeight);
        } else {
            // Domyślne rysowanie dla innych obiektów
            ctx.fillStyle = 'gray';
            ctx.fillRect(-obj.size.x/2, -obj.size.y/2, obj.size.x, obj.size.y);
        }

        // Debug - rysowanie boundingboxa
        if (obj.collider) {
            const bb = obj.collider.getBoundingBox();
            ctx.strokeStyle = 'red';
            ctx.strokeRect(bb.x + obj.position.x / 2, bb.y + obj.position.y / 2, bb.width, bb.height);
        }

        ctx.restore();
    }
}
