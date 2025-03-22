import { Vec2D } from "../types/math";
import PhysicObject, { PhysicObjectOptions } from "./PhysicObject";
import { vec2D } from "../utils/math";
import { AABBCollider } from "./Colliders/AABBCollider";

export interface MovingBarrierOptions extends Omit<PhysicObjectOptions, "collider"> {
    movementTime?: number;
    closedWaitTime?: number;
    openWaitTime?: number;
    movementDistance?: number;
    direction?: number;
}

export enum BarrierState {
    OPENING,
    OPEN,
    CLOSING,
    CLOSED
}

export default class MovingBarrier extends PhysicObject {
    private readonly _initialPosition: Vec2D;
    private readonly _movementTime: number;
    private readonly _closedWaitTime: number;
    private readonly _openWaitTime: number;
    private readonly _movementDistance: number;
    private readonly _direction: number;

    private _state: BarrierState = BarrierState.CLOSED;
    private _stateStartTime: number = 0;

    constructor(options: MovingBarrierOptions) {
        const collider = new AABBCollider(
            vec2D(-20, 1),
            options.size || vec2D(4, 1)
        );

        super({
            ...options,
            collider,
            movable: false,
            mass: 100000
        });

        this._initialPosition = { ...options.position };
        this._movementTime = options.movementTime || 2000;
        this._closedWaitTime = options.closedWaitTime || 3000;
        this._openWaitTime = options.openWaitTime || 3000;
        this._movementDistance = options.movementDistance || 2;
        this._direction = options.direction || -1;

        this._stateStartTime = performance.now();
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        const currentTime = performance.now();
        const elapsedTime = currentTime - this._stateStartTime;

        switch (this._state) {
            case BarrierState.CLOSED:
                if (elapsedTime >= this._closedWaitTime) {
                    this._state = BarrierState.OPENING;
                    this._stateStartTime = currentTime;
                }
                break;

            case BarrierState.OPENING:
                if (elapsedTime >= this._movementTime) {
                    this._state = BarrierState.OPEN;
                    this._stateStartTime = currentTime;

                    this.position = {
                        x: this._initialPosition.x + (this._movementDistance * this._direction),
                        y: this._initialPosition.y
                    };
                } else {
                    const progress = elapsedTime / this._movementTime;
                    this.position = {
                        x: this._initialPosition.x + (this._movementDistance * this._direction * progress),
                        y: this._initialPosition.y
                    };
                }
                break;

            case BarrierState.OPEN:
                if (elapsedTime >= this._openWaitTime) {
                    this._state = BarrierState.CLOSING;
                    this._stateStartTime = currentTime;
                }
                break;

            case BarrierState.CLOSING:
                if (elapsedTime >= this._movementTime) {
                    this._state = BarrierState.CLOSED;
                    this._stateStartTime = currentTime;

                    this.position = { ...this._initialPosition };
                } else {
                    const progress = elapsedTime / this._movementTime;
                    this.position = {
                        x: this._initialPosition.x + (this._movementDistance * this._direction * (1 - progress)),
                        y: this._initialPosition.y
                    };
                }
                break;
        }
    }

    get state(): BarrierState {
        return this._state;
    }

    get initialPosition(): Vec2D {
        return this._initialPosition;
    }

    reset(): void {
        this._state = BarrierState.CLOSED;
        this._stateStartTime = performance.now();
        this.position = { ...this._initialPosition };
    }
}
