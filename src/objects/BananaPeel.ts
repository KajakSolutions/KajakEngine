import PhysicObject, { PhysicObjectOptions } from "./PhysicObject";

import { vec2D } from "../utils/math";
import { AABBCollider } from "./Colliders/AABBCollider";
import SpriteManager from "./SpriteManager";
import CarObject from "./CarObject";

export interface BananaPeelOptions extends Omit<PhysicObjectOptions, "collider"> {
    lifespan?: number;
    ownerCarId?: number;
}

export default class BananaPeel extends PhysicObject {
    private _active: boolean = true;
    private readonly _lifespan: number | null;
    private readonly _spawnTime: number;
    private readonly _ownerCarId: number | null;
    private _animationFrame: number = 0;
    private _animationTimer: number = 0;
    private readonly ANIMATION_FRAME_DURATION: number = 200;

    constructor(options: BananaPeelOptions) {
        const collider = new AABBCollider(
            vec2D(-1, -1),
            options.size || vec2D(2, 2)
        );

        super({
            ...options,
            collider,
            movable: false,
            spriteManager: options.spriteManager || new SpriteManager({
                imageSrc: "game/banana.png",
                cellSize: vec2D(32, 32),
                count: 4,
                columns: 4
            }),
            mass: 1
        });

        this._lifespan = options.lifespan !== undefined ? options.lifespan : 20000;
        this._spawnTime = performance.now();
        this._ownerCarId = options.ownerCarId !== undefined ? options.ownerCarId : null;
    }

    get active(): boolean {
        return this._active;
    }

    get ownerCarId(): number | null {
        return this._ownerCarId;
    }

    deactivate(): void {
        this._active = false;
        this.spriteManager!.hidden = true;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        if (this._lifespan !== null && performance.now() - this._spawnTime > this._lifespan) {
            this.deactivate();
        }

        this._animationTimer += deltaTime * 1000;
        if (this._animationTimer >= this.ANIMATION_FRAME_DURATION) {
            this._animationFrame = (this._animationFrame + 1) % this.spriteManager!.count;
            this._animationTimer = 0;
        }
    }

    applySlipEffect(car: CarObject): void {
        if (!this._active || car.id === this._ownerCarId) return;

        car.applySlip();
        this.deactivate();
    }
}
