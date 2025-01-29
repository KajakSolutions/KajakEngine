import CarObject from "./CarObject.ts";
import {Vec2D} from "../types/math";
import {add, length, multiply, normalize, subtract, vec2D} from "../utils/math.ts";

export default interface AIStrategy {
    update(car: CarObject, playerCar: CarObject, waypoints: Vec2D[]): void;
}

// Helper functions for all strategies
class AIUtils {
    static getNextWaypoint(car: CarObject, waypoints: Vec2D[]): Vec2D {
        const currentWaypointIndex = car.lastCheckpoint + 1;
        return waypoints[currentWaypointIndex % waypoints.length];
    }

    static calculateSteeringAngle(car: CarObject, target: Vec2D): number {
        const toTarget = subtract(target, car.position);
        const forward = vec2D(Math.sin(car.rotation), Math.cos(car.rotation));
        const normalizedToTarget = normalize(toTarget);
        const dot = forward.x * normalizedToTarget.x + forward.y * normalizedToTarget.y;
        const cross = forward.x * normalizedToTarget.y - forward.y * normalizedToTarget.x;
        return Math.atan2(cross, dot);
    }

    static isApproachingTurn(car: CarObject, waypoints: Vec2D[], lookAheadDistance: number = 10): boolean {
        const currentWaypoint = this.getNextWaypoint(car, waypoints);
        const nextWaypointIndex = (car.lastCheckpoint + 2) % waypoints.length;
        const nextWaypoint = waypoints[nextWaypointIndex];

        const currentDirection = normalize(subtract(nextWaypoint, currentWaypoint));
        const nextDirection = normalize(subtract(waypoints[(nextWaypointIndex + 1) % waypoints.length], nextWaypoint));

        const dot = currentDirection.x * nextDirection.x + currentDirection.y * nextDirection.y;
        const distanceToWaypoint = length(subtract(currentWaypoint, car.position));

        return dot < 0.8 && distanceToWaypoint < lookAheadDistance;
    }

    static distanceToPlayer(car: CarObject, playerCar: CarObject): number {
        return length(subtract(car.position, playerCar.position));
    }
}

// Strategy 1: Straight Line Master
export class StraightLineMasterStrategy implements AIStrategy {
    // @ts-ignore
    update(car: CarObject, playerCar: CarObject, waypoints: Vec2D[]): void {
        const nextWaypoint = AIUtils.getNextWaypoint(car, waypoints);
        const steerAngle = AIUtils.calculateSteeringAngle(car, nextWaypoint);
        car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));

        // Full speed on straights, heavy braking on turns
        if (AIUtils.isApproachingTurn(car, waypoints, 15)) {
            car.setThrottle(20); // Heavy braking before turns
        } else {
            car.setThrottle(83.91); // Max speed on straights
        }
    }
}

// Strategy 2: Center Line Follower
export class CenterLineFollowerStrategy implements AIStrategy {
    private readonly CONSTANT_SPEED = 50;

    // @ts-ignore
    update(car: CarObject, playerCar: CarObject, waypoints: Vec2D[]): void {
        const nextWaypoint = AIUtils.getNextWaypoint(car, waypoints);
        const steerAngle = AIUtils.calculateSteeringAngle(car, nextWaypoint);
        car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));
        car.setThrottle(this.CONSTANT_SPEED);
    }
}

// Strategy 3: Aggressive Side Hitter
export class AggressiveSideHitterStrategy implements AIStrategy {
    update(car: CarObject, playerCar: CarObject, waypoints: Vec2D[]): void {
        const distanceToPlayer = AIUtils.distanceToPlayer(car, playerCar);

        if (distanceToPlayer < 10) {
            // Try to hit player from the side
            const targetPosition = add(playerCar.position,
                vec2D(Math.cos(playerCar.rotation + Math.PI/2) * 2,
                    Math.sin(playerCar.rotation + Math.PI/2) * 2));
            const steerAngle = AIUtils.calculateSteeringAngle(car, targetPosition);
            car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));
            car.setThrottle(83.91);
        } else {
            // Chase player at full speed
            const steerAngle = AIUtils.calculateSteeringAngle(car, playerCar.position);
            car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));

            if (AIUtils.isApproachingTurn(car, waypoints)) {
                car.setThrottle(30);
            } else {
                car.setThrottle(83.91);
            }
        }
    }
}

// Strategy 4: Road Blocker
export class RoadBlockerStrategy implements AIStrategy {
    private readonly BLOCKING_DISTANCE = 5;
    private readonly WAITING_THRESHOLD = 30;

    update(car: CarObject, playerCar: CarObject, waypoints: Vec2D[]): void {
        const distanceToPlayer = AIUtils.distanceToPlayer(car, playerCar);
        const isPlayerLastLap = playerCar.lastCheckpoint >= waypoints.length - 2;

        if (distanceToPlayer > this.WAITING_THRESHOLD && !isPlayerLastLap) {
            // Wait for player
            car.setThrottle(10);
            const nextWaypoint = AIUtils.getNextWaypoint(car, waypoints);
            const steerAngle = AIUtils.calculateSteeringAngle(car, nextWaypoint);
            car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));
        } else if (car.position.y > playerCar.position.y) {
            // Ahead of player, try to block
            const blockingPosition = add(playerCar.position,
                multiply(normalize(vec2D(Math.sin(playerCar.rotation), Math.cos(playerCar.rotation))),
                    this.BLOCKING_DISTANCE));
            const steerAngle = AIUtils.calculateSteeringAngle(car, blockingPosition);
            car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));
            car.setThrottle(30);
        } else {
            // Chase player
            const nextWaypoint = AIUtils.getNextWaypoint(car, waypoints);
            const steerAngle = AIUtils.calculateSteeringAngle(car, nextWaypoint);
            car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));
            car.setThrottle(83.91);
        }
    }
}

// AIController with strategy pattern
export class AIController {
    private car: CarObject;
    private strategy: AIStrategy;
    private playerCar: CarObject;
    private waypoints: Vec2D[] = [];

    constructor(car: CarObject, playerCar: CarObject, strategy: AIStrategy) {
        this.car = car;
        this.playerCar = playerCar;
        this.strategy = strategy;
    }

    setWaypoints(waypoints: Vec2D[]): void {
        this.waypoints = waypoints;
    }

    update(): void {
        this.strategy.update(this.car, this.playerCar, this.waypoints);
    }
}
