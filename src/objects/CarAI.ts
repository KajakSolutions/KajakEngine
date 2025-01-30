import { Vec2D } from "../types/math";
import { vec2D, length, normalize, multiply, add } from "../utils/math";
import { LineCollider } from "./Colliders/LineCollider";
import CarObject from "./CarObject";

export interface RaycastResult {
    distance: number;
    point: Vec2D;
    normal: Vec2D;
}

export class CarAI {
    private car: CarObject;
    private _rays: LineCollider[] = [];
    private readonly rayLength: number = 40;
    private readonly rayCount: number = 28;
    private readonly raySpread: number = Math.PI / 2;

    constructor(car: CarObject) {
        this.car = car;
        this.initializeRays();
    }

    private initializeRays() {
        const angleStep = this.raySpread / (this.rayCount - 1);
        const startAngle = -this.raySpread / 2;

        for (let i = 0; i < this.rayCount; i++) {
            const angle = startAngle + angleStep * i;
            this._rays.push(new LineCollider(vec2D(0, 0), vec2D(0, 0), 0.1));
        }
    }

    updateRays() {
        const carAngle = this.car.rotation;
        const carPos = vec2D(this.car.position.x, -this.car.position.y);

        this._rays.forEach((ray, index) => {
            const angleStep = this.raySpread / (this.rayCount - 1);
            const rayAngle = carAngle + (-this.raySpread / 2 + angleStep * index);

            const direction = vec2D(
                Math.sin(rayAngle),
                -Math.cos(rayAngle)
            );

            const endPoint = add(carPos, multiply(direction, this.rayLength));

            ray._start = carPos;
            ray._end = endPoint;
        });
    }


    get rays(): LineCollider[] {
        return this._rays;
    }

    getRaycastResults(scene: any): RaycastResult[] {
        const results: RaycastResult[] = [];

        this._rays.forEach(ray => {
            let closestHit: RaycastResult | null = null;

            for (const obj of scene.gameObjects.values()) {
                if (obj === this.car) continue;

                const collision = ray.checkCollision(obj.collider);
                if (collision && collision.contactPoints.length > 0) {
                    const point = collision.contactPoints[0];
                    const dist = length(vec2D(
                        point.x - ray._start.x,
                        point.y - ray._start.y
                    ));

                    if (!closestHit || dist < closestHit.distance) {
                        closestHit = {
                            distance: dist,
                            point: point,
                            normal: collision.mtv ? normalize(collision.mtv) : vec2D(0, 0)
                        };
                    }
                }
            }

            if (closestHit) {
                results.push(closestHit);
            } else {
                results.push({
                    distance: this.rayLength,
                    point: ray._end,
                    normal: vec2D(0, 0)
                });
            }
        });

        return results;
    }
}

export enum AIBehaviorType {
    STRAIGHT_LINE_MASTER,
    STEADY_MIDDLE,
    AGGRESSIVE_CHASER,
    TACTICAL_BLOCKER
}

export class CarAIController {
    private car: CarObject;
    private ai: CarAI;
    private behaviorType: AIBehaviorType;
    private targetSpeed: number = 0;
    private maxSpeed: number = 83.91;
    private waitingForPlayer: boolean = false;

    constructor(car: CarObject, behaviorType: AIBehaviorType) {
        this.car = car;
        this.ai = new CarAI(car);
        this.behaviorType = behaviorType;
    }

    update(scene: any, playerCar: CarObject) {
        this.ai.updateRays();
        const raycastResults = this.ai.getRaycastResults(scene);

        switch (this.behaviorType) {
            case AIBehaviorType.STRAIGHT_LINE_MASTER:
                this.updateStraightLineMaster(raycastResults);
                break;
            case AIBehaviorType.STEADY_MIDDLE:
                this.updateSteadyMiddle(raycastResults);
                break;
            case AIBehaviorType.AGGRESSIVE_CHASER:
                this.updateAggressiveChaser(raycastResults, playerCar);
                break;
            case AIBehaviorType.TACTICAL_BLOCKER:
                this.updateTacticalBlocker(raycastResults, playerCar, scene);
                break;
        }
    }

    private updateStraightLineMaster(raycastResults: RaycastResult[]) {
        const centerRay = raycastResults[Math.floor(raycastResults.length / 2)];
        const isTurningAhead = raycastResults.some(r => r.distance < this.ai.rayLength * 0.8);

        if (isTurningAhead) {
            this.car.setThrottle(this.maxSpeed * 0.3);
            this.adjustSteeringFromRays(raycastResults);
        } else {
            this.car.setThrottle(this.maxSpeed);
            this.car.setSteerAngle(0);
        }
    }

    getAI(): CarAI {
        return this.ai;
    }

    private updateSteadyMiddle(raycastResults: RaycastResult[]) {
        this.car.setThrottle(this.maxSpeed * 0.6);

        const leftRay = raycastResults[0];
        const rightRay = raycastResults[raycastResults.length - 1];

        const steerAmount = (rightRay.distance - leftRay.distance) * 0.1;
        this.car.setSteerAngle(steerAmount * Math.PI / 4);
    }

    private updateAggressiveChaser(raycastResults: RaycastResult[], playerCar: CarObject) {
        const toPlayer = vec2D(
            playerCar.position.x - this.car.position.x,
            playerCar.position.y - this.car.position.y
        );

        this.car.setThrottle(this.maxSpeed);

        const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
        const steerAngle = angleToPlayer - this.car.rotation;
        this.car.setSteerAngle(Math.min(Math.PI/4, Math.max(-Math.PI/4, steerAngle)));
    }

    private updateTacticalBlocker(raycastResults: RaycastResult[], playerCar: CarObject, scene: any) {
        const distanceToPlayer = length(vec2D(
            playerCar.position.x - this.car.position.x,
            playerCar.position.y - this.car.position.y
        ));

        const isPlayerLastLap = false //playerCar.lastCheckpoint >= scene.checkpoints.length - 2;

        if (distanceToPlayer > 30 && !isPlayerLastLap) {
            this.waitingForPlayer = true;
            this.car.setThrottle(this.maxSpeed * 0.2);
        } else if (distanceToPlayer < 10) {
            this.waitingForPlayer = false;
            this.car.setThrottle(this.maxSpeed * 0.5);
            const predictedPlayerPos = add(playerCar.position, multiply(playerCar.velocity, 0.5));
            const toPlayer = vec2D(
                predictedPlayerPos.x - this.car.position.x,
                predictedPlayerPos.y - this.car.position.y
            );
            const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
            this.car.setSteerAngle(angleToPlayer - this.car.rotation);
        } else {
            this.waitingForPlayer = false;
            this.car.setThrottle(this.maxSpeed);
            this.adjustSteeringFromRays(raycastResults);
        }
    }

    private adjustSteeringFromRays(raycastResults: RaycastResult[]) {
        const leftRays = raycastResults.slice(0, Math.floor(raycastResults.length / 2));
        const rightRays = raycastResults.slice(Math.floor(raycastResults.length / 2) + 1);

        const avgLeftDist = leftRays.reduce((sum, r) => sum + r.distance, 0) / leftRays.length;
        const avgRightDist = rightRays.reduce((sum, r) => sum + r.distance, 0) / rightRays.length;

        const steerAmount = (avgRightDist - avgLeftDist) * 0.05;
        this.car.setSteerAngle(steerAmount * Math.PI / 4);
    }
}
