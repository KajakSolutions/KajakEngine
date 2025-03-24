import { Vec2D } from "../types/math"
import PhysicObject, { PhysicObjectOptions } from "./PhysicObject.ts"
import { add, dotProduct, length, subtract, vec2D } from "../utils/math.ts"
import { ColliderInfo } from "./Colliders/Collider.ts"
import {CarSoundSystem} from "./Sounds/CarSoundSystem.ts";
import {TrackSurfaceManager} from "./TrackSurfaceManager.ts";

export interface CarObjectOptions extends PhysicObjectOptions {
    maxGrip?: number;
    wheelBase?: number;
    frontAxleToCg?: number;
    rearAxleToCg?: number;
    wheelSize?: Vec2D;
    drag?: number;
    resistance?: number;
    isPlayer?: boolean;
    id: number;
    surfaceManager?: TrackSurfaceManager;
    maxNitro?: number;
    nitroStrength?: number;
    bananaPeels?: number;
    maxBananaPeels?: number;
}

export default class CarObject extends PhysicObject {
    public steerAngle: number = 0
    private throttle: number = 0
    private brake: number = 0
    private angularVelocity: number = 0

    private readonly _isPlayer: boolean = false
    private readonly _playerId: number
    private readonly surfaceManager?: TrackSurfaceManager;
    private readonly _soundSystem: CarSoundSystem;

    // nitro stuff
    private _nitroAmount: number = 0;
    private _maxNitro: number;
    private _nitroStrength: number;
    private _nitroActive: boolean = false;
    private _nitroEffectTimer: number = 0;
    private readonly NITRO_EFFECT_DURATION: number = 3000;

    // physics stuff
    private readonly inertia: number
    private maxGrip: number
    private readonly resistance: number = 30
    private readonly drag: number
    private readonly gravity: number = 9.81
    private readonly _frontAxleToCg: number
    private readonly _rearAxleToCg: number
    private readonly wheelBase: number
    private readonly caFront: number = -5
    private readonly caRear: number = -5.2
    private readonly driveTrain: number = 0
    private readonly _wheelSize: Vec2D
    public readonly restitution: number = 0.3
    public readonly collisionDamping: number = 0.9

    private _slipping: boolean = false;
    private _slipSteerMultiplier: number = 1.0;

    private _bananaPeels: number;
    private readonly _maxBananaPeels: number;

    constructor({
        resistance = 20,
        drag = 1,
        maxGrip = 0,
        wheelBase = .4,
        frontAxleToCg,
        rearAxleToCg,
        wheelSize = vec2D(0.3, 0.7),
        maxNitro = 100,
        nitroStrength = 2.5,
        bananaPeels = 0,
        maxBananaPeels = 3,
        ...options
    }: CarObjectOptions) {
        super(options)

        this.maxGrip = maxGrip
        this.inertia = options.mass / 2

        this._maxNitro = maxNitro;
        this._nitroStrength = nitroStrength;

        this.drag = drag
        this.resistance = resistance
        this.wheelBase = wheelBase
        this._frontAxleToCg = frontAxleToCg || this.wheelBase / 2
        this._rearAxleToCg = rearAxleToCg || this.wheelBase / 2
        this._wheelSize = wheelSize
        this._isPlayer = options.isPlayer || false
        this._playerId = options.id

        this._bananaPeels = bananaPeels || 0;
        this._maxBananaPeels = maxBananaPeels || 3;

        this.surfaceManager = options.surfaceManager;

        this._soundSystem = new CarSoundSystem(this);
        this._soundSystem.initialize().catch(console.error);
    }

    get wheelSize(): Vec2D {
        return this._wheelSize
    }

    get frontAxleToCg(): number {
        return this._frontAxleToCg
    }

    get rearAxleToCg(): number {
        return this._rearAxleToCg
    }

    get isPlayer(): boolean {
        return this._isPlayer
    }

    get playerId(): number {
        return this._playerId
    }

    get soundSystem(): CarSoundSystem {
        return this._soundSystem;
    }

    get nitroAmount(): number {
        return this._nitroAmount;
    }

    get nitroActive(): boolean {
        return this._nitroActive;
    }

    get maxNitro(): number {
        return this._maxNitro;
    }

    get isSlipping(): boolean {
        return this._slipping;
    }

    get bananaPeels(): number {
        return this._bananaPeels;
    }

    get maxBananaPeels(): number {
        return this._maxBananaPeels;
    }

    update(deltaTime: number): void {
        this._soundSystem.update();

        this._updateNitro(deltaTime)
        const nitroMultiplier = this._nitroActive ? this._nitroStrength : 1.0;

        const angle = this.rotation
        const cosAngle = Math.cos(angle)
        const sinAngle = Math.sin(angle)

        const surfaceProps = this.surfaceManager
            ? this.surfaceManager.getSurfacePropertiesAt(this.position)
            : { gripMultiplier: 1.0, dragMultiplier: 1.0 };

        const localVelocity = {
            forward: this.velocity.x * sinAngle + this.velocity.y * cosAngle,
            right: this.velocity.x * cosAngle - this.velocity.y * sinAngle,
        };

        const weight = this.mass * this.gravity
        const rearNormal = (this._rearAxleToCg / this.wheelBase) * weight
        const frontNormal = (this._frontAxleToCg / this.wheelBase) * weight

        let frontSlipAngle = 0
        let rearSlipAngle = 0
        const speed = Math.abs(localVelocity.forward)

        if (speed !== 0) {
            frontSlipAngle =
                Math.atan2(
                    localVelocity.right +
                    this.angularVelocity * this._frontAxleToCg,
                    speed
                ) -
                this.steerAngle * this._slipSteerMultiplier * (localVelocity.forward < 0 ? -1 : 1)

            rearSlipAngle = Math.atan2(
                localVelocity.right - this.angularVelocity * this._rearAxleToCg,
                speed
            )
        }

        const frontLateralForce =
            Math.max(
                -this.maxGrip,
                Math.min(this.maxGrip, this.caFront * frontSlipAngle)
            ) * frontNormal * surfaceProps.gripMultiplier;

        const rearLateralForce =
            Math.max(
                -this.maxGrip,
                Math.min(this.maxGrip, this.caRear * rearSlipAngle)
            ) * rearNormal * surfaceProps.gripMultiplier;

        const driveRatio = 0.5 * this.driveTrain
        const tractionForce =
            100 *
            (this.throttle *
                (1 - driveRatio + driveRatio * Math.cos(this.steerAngle)) -
                this.brake * (localVelocity.forward < 0 ? -1 : 1)) * nitroMultiplier

        const turnForce =
            100 * this.throttle * driveRatio * Math.sin(this.steerAngle)

        const resistanceForce = -(
            this.resistance * localVelocity.forward +
            this.drag * localVelocity.forward * Math.abs(localVelocity.forward)
        ) * surfaceProps.dragMultiplier;

        const lateralResistance = -(
            this.resistance * localVelocity.right +
            this.drag * localVelocity.right * Math.abs(localVelocity.right)
        ) * surfaceProps.dragMultiplier;

        const accelerationForward =
            (tractionForce + resistanceForce) / this.mass
        const accelerationRight =
            (turnForce +
                lateralResistance +
                (rearLateralForce +
                    frontLateralForce * Math.cos(this.steerAngle))) /
            this.mass

        this.velocity.x +=
            (accelerationForward * sinAngle + accelerationRight * cosAngle) *
            deltaTime
        this.velocity.y +=
            (accelerationForward * cosAngle - accelerationRight * sinAngle) *
            deltaTime

        this.position = vec2D(
            this.position.x + this.velocity.x * deltaTime,
            this.position.y + this.velocity.y * deltaTime
        )

        const torque =
            (-rearLateralForce * this._rearAxleToCg +
                frontLateralForce * this._frontAxleToCg) /
            this.inertia

        this.angularVelocity += torque * deltaTime
        this.rotation += this.angularVelocity * deltaTime
    }

    private _updateNitro(deltaTime: number): void {
        if (this._nitroActive) {
            const elapsedNitroTime = performance.now() - this._nitroEffectTimer;

            if (elapsedNitroTime >= this.NITRO_EFFECT_DURATION || this._nitroAmount <= 0) {
                this._nitroActive = false;
            } else {
                const nitroConsumptionRate = this._maxNitro / this.NITRO_EFFECT_DURATION;
                this._nitroAmount = Math.max(0, this._nitroAmount - nitroConsumptionRate * deltaTime * 1000);
            }
        }
    }

    applySlip(): void {
        const currentSpeed = length(this.velocity);

        const spinDirection = Math.random() > 0.5 ? 1 : -1;

        const rotationPower = currentSpeed * 10;
        this.angularVelocity = spinDirection * rotationPower;

        const slowdownFactor = 0.5;
        this.velocity.x *= slowdownFactor;
        this.velocity.y *= slowdownFactor;
    }

    collectBananaPeel(): boolean {
        if (this._bananaPeels < this._maxBananaPeels) {
            this._bananaPeels++;
            return true;
        }
        return false;
    }

    useBananaPeel(): boolean {
        if (this._bananaPeels > 0) {
            this._bananaPeels--;
            return true;
        }
        return false;
    }

    setSteerAngle(angle: number): void {
        this.steerAngle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, angle))
    }

    setThrottle(value: number): void {
        this.throttle = value
    }

    setBrake(value: number): void {
        this.brake = value
    }

    onCollision(other: PhysicObject, collisionInfo: ColliderInfo): void {
        const relativeVelocity = subtract(this.velocity, other.velocity)

        const normal = collisionInfo.mtv
            ? vec2D(collisionInfo.mtv.x, collisionInfo.mtv.y)
            : vec2D(0, 0)

        const normalLength = length(normal)
        const unitNormal =
            normalLength > 0
                ? vec2D(normal.x / normalLength, normal.y / normalLength)
                : vec2D(0, 0)

        const e = this.restitution

        const j =
            (-(1 + e) * dotProduct(relativeVelocity, unitNormal)) /
            (1 / this.mass + 1 / other.mass)

        const impulse = vec2D(unitNormal.x * j, unitNormal.y * j)

        const collisionPoint = vec2D(0, 0)
        const r = subtract(collisionPoint, this.position)

        const torqueScalar = r.x * impulse.y - r.y * impulse.x

        if (this.movable) {
            this.velocity = add(
                this.velocity,
                vec2D(impulse.x / this.mass, impulse.y / this.mass)
            )

            this.angularVelocity += (torqueScalar / this.inertia) * 0.01
        }

        if (other.movable) {
            other.velocity = subtract(
                other.velocity,
                vec2D(impulse.x / other.mass, impulse.y / other.mass)
            )
        }

        if (collisionInfo.mtv) {
            const correctionFactor = 0.1
            const separation = vec2D(
                collisionInfo.mtv.x * correctionFactor,
                collisionInfo.mtv.y * correctionFactor
            )

            if (this.movable) {
                this.position = add(
                    this.position,
                    vec2D(-separation.x, separation.y)
                )
            }

            if (other.movable) {
                other.position = add(other.position, separation)
            }
        }
    }

    refillNitro(amount: number = this._maxNitro): void {
        this._nitroAmount = Math.min(this._maxNitro, this._nitroAmount + amount);
    }

    activateNitro(): boolean {
        console.log("activateNitro");
        if (this._nitroAmount > 0 && !this._nitroActive) {
            this._nitroActive = true;
            this._nitroEffectTimer = performance.now();

            if (this._soundSystem) {
                this._soundSystem.playNitroSound();
            }

            return true;
        }
        return false;
    }
}
