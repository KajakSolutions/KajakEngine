import PhysicObject, {PhysicObjectOptions} from "./PhysicObject.ts";
import {vec2D} from "../utils/math.ts";

export type CarBodyObjectOptions = PhysicObjectOptions & {
    wheelSize?: number;
    axles: { front: number, rear: number };
}


export default class CarObject extends PhysicObject {
    private readonly _wheelBase: number;
    private readonly _wheelSize: number;
    private _axles: { front: number, rear: number };
    private _angularVelocity: number;
    private _speed: number;

    constructor(config: CarBodyObjectOptions) {
        super(
            {
                size: config.size || vec2D(0, 0),
                movable: config.movable || true ,
                position: config.position || vec2D(0, 0),
                collider: config.collider
            }
        );

        this._axles = config.axles || { front: 0, rear: 0 };

        this._wheelSize = config.wheelSize || 0;
        this._wheelBase = this._axles.rear - this._axles.front;
    }

    get wheelBase(): number {
        return this._wheelBase;
    }

    get wheelSize(): number {
        return this._wheelSize;
    }

    speedUp(delta: number): void {
        this._speed += delta;
    }

    turn(delta: number): void {
        this._angularVelocity *= 0.2;
        this.rotation += delta;
    }
}
