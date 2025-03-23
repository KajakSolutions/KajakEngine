import {Vec2D} from "../types/math"
import {add, dotProduct, length, multiply, normalize, subtract, vec2D,} from "../utils/math"
import {LineCollider} from "./Colliders/LineCollider"
import CarObject from "./CarObject"
import CheckpointObject from "./CheckpointObject"

export interface RaycastResult {
    distance: number
    point: Vec2D
    normal: Vec2D
}

export class CarAI {
    private readonly car: CarObject
    private _rays: LineCollider[] = []
    private readonly _rayLength: number = 40
    private readonly rayCount: number = 28
    private readonly raySpread: number = Math.PI / 2

    constructor(car: CarObject) {
        this.car = car
        this.initializeRays()
    }

    private initializeRays() {
        for (let i = 0; i < this.rayCount; i++) {
            this._rays.push(new LineCollider(vec2D(0, 0), vec2D(0, 0), 0.1))
        }
    }

    updateRays() {
        const carAngle = this.car.rotation
        const carPos = vec2D(this.car.position.x, -this.car.position.y)

        this._rays.forEach((ray, index) => {
            const angleStep = this.raySpread / (this.rayCount - 1)
            const rayAngle =
                carAngle + (-this.raySpread / 2 + angleStep * index)
            const direction = vec2D(Math.sin(rayAngle), -Math.cos(rayAngle))
            const endPoint = add(carPos, multiply(direction, this._rayLength))

            ray.start = carPos
            ray.end = endPoint
        })
    }

    get rays(): LineCollider[] {
        return this._rays
    }

    get rayLength(): number {
        return this._rayLength
    }

    getRaycastResults(scene: any): RaycastResult[] {
        const results: RaycastResult[] = []

        this._rays.forEach((ray) => {
            let closestHit: RaycastResult | null = null

            for (const obj of scene.gameObjects.values()) {
                if (obj === this.car || !obj.aiDetectable)
                    continue

                const collision = ray.checkCollision(obj.collider)
                if (collision && collision.contactPoints.length > 0) {
                    const point = collision.contactPoints[0]
                    const dist = length(subtract(point, ray.start))

                    if (!closestHit || dist < closestHit.distance) {
                        closestHit = {
                            distance: dist,
                            point: point,
                            normal: collision.mtv
                                ? normalize(collision.mtv)
                                : vec2D(0, 0),
                        }
                    }
                }
            }

            results.push(
                closestHit || {
                    distance: this._rayLength,
                    point: ray.end,
                    normal: vec2D(0, 0),
                }
            )
        })

        return results
    }
}

export enum AIBehaviorType {
    STRAIGHT_LINE_MASTER,
    STEADY_MIDDLE,
    AGGRESSIVE_CHASER,
    TACTICAL_BLOCKER,
}

interface RoadAnalysis {
    minDistance: number
    leftDistance: number
    rightDistance: number
    centerDistance: number
    hasTurnAhead: boolean
    bestPathDirection: number
}

export class CarAIController {
    private readonly car: CarObject
    private readonly ai: CarAI
    private readonly behaviorType: AIBehaviorType
    private readonly maxSpeed: number = 200
    private readonly stuckCheckInterval: number = 2000
    private lastCheckTime: number = 0
    private lastPosition: Vec2D
    private readonly CHECKPOINT_WEIGHT: number = 0.22
    private readonly PATH_WEIGHT: number = 1 - this.CHECKPOINT_WEIGHT

    constructor(car: CarObject, behaviorType: AIBehaviorType) {
        this.car = car
        this.ai = new CarAI(car)
        this.behaviorType = behaviorType
        this.lastPosition = { ...car.position }
    }

    private getNextCheckpoint(scene: any): CheckpointObject | null {
        const checkpoints = scene.raceManager.checkpoints
        const lastCheckpoint = scene.raceManager.getCarProgress(
            this.car.id
        ).lastCheckpoint

        if (checkpoints.length === 0) return null

        const nextIndex = (lastCheckpoint + 1) % checkpoints.length
        return checkpoints[nextIndex] || null
    }

    private analyzeRoad(raycastResults: RaycastResult[]): RoadAnalysis {
        const leftRays = raycastResults.slice(
            0,
            Math.floor(raycastResults.length / 3)
        )
        const centerRays = raycastResults.slice(
            Math.floor(raycastResults.length / 3),
            Math.floor((2 * raycastResults.length) / 3)
        )
        const rightRays = raycastResults.slice(
            Math.floor((2 * raycastResults.length) / 3)
        )

        const leftDistance =
            leftRays.reduce((sum, ray) => sum + ray.distance, 0) /
            leftRays.length
        const centerDistance =
            centerRays.reduce((sum, ray) => sum + ray.distance, 0) /
            centerRays.length
        const rightDistance =
            rightRays.reduce((sum, ray) => sum + ray.distance, 0) /
            rightRays.length
        const minDistance = Math.min(...raycastResults.map((r) => r.distance))

        let bestPathDirection = 0;
        if (leftDistance > centerDistance && leftDistance > rightDistance) {
            bestPathDirection = -1;
        } else if (rightDistance > centerDistance && rightDistance > leftDistance) {
            bestPathDirection = 1;
        }

        return {
            minDistance,
            leftDistance,
            rightDistance,
            centerDistance,
            hasTurnAhead: centerDistance < this.ai.rayLength * 0.8,
            bestPathDirection
        }
    }

    private calculateSteeringToTarget(
        target: Vec2D,
        roadAnalysis: RoadAnalysis
    ): number {
        const toTarget = subtract(target, this.car.position)
        let steerAngle = Math.atan2(toTarget.x, toTarget.y) - this.car.rotation

        while (steerAngle > Math.PI) steerAngle -= 2 * Math.PI
        while (steerAngle < -Math.PI) steerAngle += 2 * Math.PI

        const pathBasedSteering = this.calculatePathBasedSteering(roadAnalysis);

        const finalSteerAngle =
            (steerAngle * this.CHECKPOINT_WEIGHT) +
            (pathBasedSteering * this.PATH_WEIGHT);

        return Math.max(-Math.PI / 4, Math.min(Math.PI / 4, finalSteerAngle));
    }

    private calculatePathBasedSteering(roadAnalysis: RoadAnalysis): number {
        if (roadAnalysis.minDistance < this.ai.rayLength * 0.3) {
            if (roadAnalysis.leftDistance > roadAnalysis.rightDistance) {
                return -Math.PI / 6;
            } else {
                return Math.PI / 6;
            }
        }

        if (roadAnalysis.bestPathDirection !== 0) {
            return roadAnalysis.bestPathDirection * (Math.PI / 8);
        }

        return (roadAnalysis.rightDistance - roadAnalysis.leftDistance) * 0.03;
    }

    private handleStuckState(): void {
        const currentTime = performance.now()
        if (currentTime - this.lastCheckTime > this.stuckCheckInterval) {
            const distanceMoved = length(
                subtract(this.car.position, this.lastPosition)
            )

            if (distanceMoved < 1.0 && length(this.car.velocity) < 1) {
                console.log("Car stuck, resetting")
                this.car.velocity = vec2D(
                    Math.cos(this.car.rotation) * 5,
                    Math.sin(this.car.rotation) * 5
                )

                this.car.setSteerAngle((Math.random() * 2 - 1) * (Math.PI / 4));
            }

            this.lastPosition = { ...this.car.position }
            this.lastCheckTime = currentTime
        }
    }

    update(scene: any, playerCar: CarObject) {
        this.handleStuckState()
        this.ai.updateRays()

        const raycastResults = this.ai.getRaycastResults(scene)
        const nextCheckpoint = this.getNextCheckpoint(scene)
        if (!nextCheckpoint) return

        const roadAnalysis = this.analyzeRoad(raycastResults)

        switch (this.behaviorType) {
            case AIBehaviorType.STRAIGHT_LINE_MASTER:
                this.updateStraightLineMaster(nextCheckpoint, roadAnalysis)
                break
            case AIBehaviorType.STEADY_MIDDLE:
                this.updateSteadyMiddle(nextCheckpoint, roadAnalysis)
                break
            case AIBehaviorType.AGGRESSIVE_CHASER:
                this.updateAggressiveChaser(
                    nextCheckpoint,
                    roadAnalysis,
                    playerCar
                )
                break
            case AIBehaviorType.TACTICAL_BLOCKER:
                this.updateTacticalBlocker(
                    nextCheckpoint,
                    roadAnalysis,
                    playerCar,
                    scene
                )
                break
        }
    }

    private updateStraightLineMaster(
        checkpoint: CheckpointObject,
        roadAnalysis: RoadAnalysis
    ): void {
        const steerAngle = this.calculateSteeringToTarget(
            checkpoint.position,
            roadAnalysis
        )
        this.car.setSteerAngle(steerAngle)

        let throttlePercentage = 1.0;

        if (roadAnalysis.hasTurnAhead) {
            throttlePercentage = 0.3;
        } else if (roadAnalysis.minDistance < this.ai.rayLength * 0.5) {
            throttlePercentage = 0.5;
        }

        this.car.setThrottle(this.maxSpeed * throttlePercentage);

        if (!roadAnalysis.hasTurnAhead &&
            roadAnalysis.minDistance > this.ai.rayLength * 0.8 &&
            this.car.nitroAmount > 50) {
            this.car.activateNitro();
        }
    }

    private updateSteadyMiddle(
        checkpoint: CheckpointObject,
        roadAnalysis: RoadAnalysis
    ): void {
        const steerAngle = this.calculateSteeringToTarget(
            checkpoint.position,
            roadAnalysis
        )
        this.car.setSteerAngle(steerAngle)

        let throttlePercentage = 1 //0.6;

        if (roadAnalysis.hasTurnAhead) {
            throttlePercentage = 0.4;
        } else if (roadAnalysis.minDistance < this.ai.rayLength * 0.5) {
            throttlePercentage = 0.3;
        }

        this.car.setThrottle(this.maxSpeed * throttlePercentage);
    }

    private updateAggressiveChaser(
        checkpoint: CheckpointObject,
        roadAnalysis: RoadAnalysis,
        playerCar: CarObject
    ): void {
        const toPlayer = subtract(playerCar.position, this.car.position)
        const distanceToPlayer = length(toPlayer)

        let target = checkpoint.position;
        let targetWeight = 1.0;

        if (distanceToPlayer < 20) {
            targetWeight = Math.max(0, (20 - distanceToPlayer) / 20);
            target = {
                x: checkpoint.position.x * (1 - targetWeight) + playerCar.position.x * targetWeight,
                y: checkpoint.position.y * (1 - targetWeight) + playerCar.position.y * targetWeight
            };
        }

        const steerAngle = this.calculateSteeringToTarget(target, roadAnalysis)
        this.car.setSteerAngle(steerAngle)

        let throttlePercentage = 1 //0.7;

        if (distanceToPlayer < 15 && roadAnalysis.minDistance > this.ai.rayLength * 0.5) {
            throttlePercentage = 1.0;
        } else if (roadAnalysis.hasTurnAhead) {
            throttlePercentage = 0.5;
        } else if (roadAnalysis.minDistance < this.ai.rayLength * 0.3) {
            throttlePercentage = 0.4;
        }

        this.car.setThrottle(this.maxSpeed * throttlePercentage);

        const isPlayerAhead = dotProduct(
            toPlayer,
            vec2D(Math.cos(this.car.rotation), Math.sin(this.car.rotation))
        ) > 0;
        if (isPlayerAhead &&
            distanceToPlayer < 30 &&
            distanceToPlayer > 10 &&
            roadAnalysis.minDistance > this.ai.rayLength * 0.6 &&
            this.car.nitroAmount > 30) {
            this.car.activateNitro();
        }
    }

    private updateTacticalBlocker(
        checkpoint: CheckpointObject,
        roadAnalysis: RoadAnalysis,
        playerCar: CarObject,
        scene: any
    ): void {
        const toPlayer = subtract(playerCar.position, this.car.position)
        const distanceToPlayer = length(toPlayer)
        const playerProgress = scene.raceManager.getCarProgress(
            playerCar.playerId
        )
        const isPlayerLastLap =
            playerProgress &&
            playerProgress.currentLap >= scene.raceManager.config.totalLaps - 1
        const isPlayerBehind =
            dotProduct(
                toPlayer,
                vec2D(Math.cos(this.car.rotation), Math.sin(this.car.rotation))
            ) < 0

        let steerAngle;
        let throttlePercentage;

        if (distanceToPlayer > 30 && !isPlayerLastLap) {
            steerAngle = this.calculateSteeringToTarget(
                checkpoint.position,
                roadAnalysis
            )
            throttlePercentage = 0.2;
        } else if (isPlayerBehind && distanceToPlayer < 15) {
            steerAngle = (Math.sin(performance.now() / 1000) * Math.PI) / 8;
            throttlePercentage = 0.4;
        } else {
            steerAngle = this.calculateSteeringToTarget(
                checkpoint.position,
                roadAnalysis
            )
            throttlePercentage = 1 //0.8;

            if (roadAnalysis.hasTurnAhead) {
                throttlePercentage = 0.6;
            } else if (roadAnalysis.minDistance < this.ai.rayLength * 0.4) {
                throttlePercentage = 0.5;
            }
        }

        this.car.setSteerAngle(steerAngle);
        this.car.setThrottle(this.maxSpeed * throttlePercentage);
    }

    getAI(): CarAI {
        return this.ai
    }
}
