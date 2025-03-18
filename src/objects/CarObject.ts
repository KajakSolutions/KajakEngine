import { Vec2D } from "../types/math"
import PhysicObject, { PhysicObjectOptions } from "./PhysicObject.ts"
import { add, dotProduct, length, subtract, vec2D } from "../utils/math.ts"
import { ColliderInfo } from "./Colliders/Collider.ts"

export interface CarObjectOptions extends PhysicObjectOptions {
    maxGrip?: number
    wheelBase?: number
    frontAxleToCg?: number
    rearAxleToCg?: number
    wheelSize?: Vec2D
    drag?: number
    resistance?: number
    isPlayer?: boolean
    id: number
}

export default class CarObject extends PhysicObject {
    public steerAngle: number = 0
    private throttle: number = 0
    private brake: number = 0
    private angularVelocity: number = 0

    private readonly _isPlayer: boolean = false
    private readonly _playerId: number

    // physics stuff
    private readonly inertia: number
    private readonly maxGrip: number
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

    constructor({
        resistance = 20,
        drag = 1,
        maxGrip = 0,
        wheelBase = .4,
        frontAxleToCg,
        rearAxleToCg,
        wheelSize = vec2D(0.3, 0.7),
        ...options
    }: CarObjectOptions) {
        super(options)

        this.maxGrip = maxGrip
        this.inertia = options.mass / 2

        this.drag = drag
        this.resistance = resistance
        this.wheelBase = wheelBase
        this._frontAxleToCg = frontAxleToCg || this.wheelBase / 2
        this._rearAxleToCg = rearAxleToCg || this.wheelBase / 2
        this._wheelSize = wheelSize
        this._isPlayer = options.isPlayer || false
        this._playerId = options.id
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

    update(deltaTime: number): void {
        const angle = this.rotation
        const cosAngle = Math.cos(angle)
        const sinAngle = Math.sin(angle)

        const localVelocity = {
            forward: this.velocity.x * sinAngle + this.velocity.y * cosAngle,
            right: this.velocity.x * cosAngle - this.velocity.y * sinAngle,
        }

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
                this.steerAngle * (localVelocity.forward < 0 ? -1 : 1)

            rearSlipAngle = Math.atan2(
                localVelocity.right - this.angularVelocity * this._rearAxleToCg,
                speed
            )
        }

        const frontLateralForce =
            Math.max(
                -this.maxGrip,
                Math.min(this.maxGrip, this.caFront * frontSlipAngle)
            ) * frontNormal

        const rearLateralForce =
            Math.max(
                -this.maxGrip,
                Math.min(this.maxGrip, this.caRear * rearSlipAngle)
            ) * rearNormal

        const driveRatio = 0.5 * this.driveTrain
        const tractionForce =
            100 *
            (this.throttle *
                (1 - driveRatio + driveRatio * Math.cos(this.steerAngle)) -
                this.brake * (localVelocity.forward < 0 ? -1 : 1))

        const turnForce =
            100 * this.throttle * driveRatio * Math.sin(this.steerAngle)

        const resistanceForce = -(
            this.resistance * localVelocity.forward +
            this.drag * localVelocity.forward * Math.abs(localVelocity.forward)
        )

        const lateralResistance = -(
            this.resistance * localVelocity.right +
            this.drag * localVelocity.right * Math.abs(localVelocity.right)
        )

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
}
