import Scene from "../Scene";
import {Vec2D} from "../types/math";
import CarObject from "./CarObject";
import Overlap from "./Overlap";
import {vec2D} from "../utils/math.ts";
import {PuddleObject} from "./PuddleObject.ts";

export enum WeatherType {
    CLEAR = "CLEAR",
    RAIN = "RAIN",
    SNOW = "SNOW"
}

export interface WeatherConfig {
    initialWeather?: WeatherType;
    minDuration?: number;
    maxDuration?: number;
    puddleSpawnPoints?: PuddleSpawnPoint[];
    intensity?: number;
    allowedWeatherTypes?: WeatherType[];
}

export interface PuddleSpawnPoint {
    position: Vec2D;
    size: Vec2D;
    type?: 'puddle' | 'ice';
}

interface WeatherParticle {
    position: Vec2D;
    velocity: Vec2D;
    size: number;
    alpha: number;
    active: boolean;
    lifetime: number;
    maxLifetime: number;
}

export class WeatherSystem {
    private scene: Scene;
    private currentWeather: WeatherType = WeatherType.CLEAR;
    private weatherTimer: number = 0;
    private weatherDuration: number = 0;
    private readonly minDuration: number;
    private readonly maxDuration: number;
    private readonly intensity: number = 0.7;

    private particles: WeatherParticle[] = [];
    private maxParticles: number = 500;
    private particlesActive: boolean = false;
    private spawnParticles: boolean = true;

    private puddles: PuddleObject[] = [];
    private puddleSpawnPoints: PuddleSpawnPoint[] = [];
    private activeSpawnPoints: Set<string> = new Set();
    private allowedWeatherTypes: WeatherType[] = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.SNOW];

    constructor(scene: Scene, config: WeatherConfig = {}) {
        this.scene = scene;
        this.currentWeather = config.initialWeather || WeatherType.CLEAR;
        this.minDuration = config.minDuration || 30000;
        this.maxDuration = config.maxDuration || 120000;
        this.intensity = config.intensity || 0.7;
        this.puddleSpawnPoints = config.puddleSpawnPoints || [];

        if (config.allowedWeatherTypes && config.allowedWeatherTypes.length > 0) {
            if (!config.allowedWeatherTypes.includes(WeatherType.CLEAR)) {
                this.allowedWeatherTypes = [WeatherType.CLEAR, ...config.allowedWeatherTypes];
            } else {
                this.allowedWeatherTypes = [...config.allowedWeatherTypes];
            }
        }

        this.initializeParticles();

        if (!config.initialWeather) {
            this.randomizeWeather();
        } else {
            this.setWeather(this.currentWeather);
        }
    }

    update(deltaTime: number): void {
        this.weatherTimer += deltaTime * 1000;

        if (this.weatherTimer >= this.weatherDuration) {
            this.randomizeWeather();
        }

        if (this.particlesActive) {
            this.updateParticles(deltaTime);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.particlesActive) return;

        ctx.save();

        for (const particle of this.particles) {
            if (!particle.active) continue;

            if (this.currentWeather === WeatherType.RAIN) {
                ctx.strokeStyle = `rgba(200, 220, 255, ${particle.alpha})`;
                ctx.lineWidth = particle.size * 0.2;
                ctx.beginPath();
                ctx.moveTo(particle.position.x, -particle.position.y);
                ctx.lineTo(
                    particle.position.x - particle.velocity.x * 0.1,
                    -(particle.position.y - particle.velocity.y * 0.1)
                );
                ctx.stroke();
            } else if (this.currentWeather === WeatherType.SNOW) {
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
                ctx.beginPath();
                ctx.arc(
                    particle.position.x,
                    -particle.position.y,
                    particle.size,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        ctx.restore();
    }

    private initializeParticles(): void {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle(false));
        }
    }

    private createParticle(activate: boolean = true): WeatherParticle {
        const worldWidth = this.scene.map.worldBounds ? this.scene.map.worldBounds.width : 128;
        const worldHeight = this.scene.map.worldBounds ? this.scene.map.worldBounds.height : 72;

        const particle: WeatherParticle = {
            position: vec2D(
                Math.random() * worldWidth - worldWidth / 2,
                Math.random() * worldHeight - worldHeight / 2
            ),
            velocity: vec2D(0, 0),
            size: 0,
            alpha: 0,
            active: false,
            lifetime: 0,
            maxLifetime: 0
        };

        if (activate) {
            this.activateParticle(particle);
        }

        return particle;
    }

    private activateParticle(particle: WeatherParticle): void {
        const worldWidth = this.scene.map.worldBounds ? this.scene.map.worldBounds.width : 128;
        const worldHeight = this.scene.map.worldBounds ? this.scene.map.worldBounds.height : 72;

        particle.active = true;
        particle.lifetime = 0;

        particle.position = vec2D(
            Math.random() * worldWidth - worldWidth / 2,
            worldHeight / 2
        );

        if (this.currentWeather === WeatherType.RAIN) {
            particle.velocity = vec2D(Math.random() * 2 - 1, -(35 + Math.random() * 20));
            particle.size = 0.5 + Math.random() * 0.5;
            particle.alpha = 0.6 + Math.random() * 0.4;
            particle.maxLifetime = 1000 + Math.random() * 500;
        } else if (this.currentWeather === WeatherType.SNOW) {
            particle.velocity = vec2D(Math.random() * 2 - 1, -(35 + Math.random() * 20));
            particle.size = 0.2 + Math.random() * 1.2;
            particle.alpha = 0.7 + Math.random() * 0.3;
            particle.maxLifetime = 2000 + Math.random() * 1000;
        }
    }

    private updateParticles(deltaTime: number): void {
        const worldHeight = this.scene.map.worldBounds ? this.scene.map.worldBounds.height : 720;

        if (this.spawnParticles) {
            const particlesToActivate = Math.floor((this.currentWeather === WeatherType.RAIN ? 10 : 5) * this.intensity);
            let activated = 0;

            for (let i = 0; i < this.particles.length && activated < particlesToActivate; i++) {
                if (!this.particles[i].active && Math.random() < 0.1) {
                    this.activateParticle(this.particles[i]);
                    activated++;
                }
            }
        }

        for (const particle of this.particles) {
            if (!particle.active) continue;

            particle.position.x += particle.velocity.x * deltaTime;
            particle.position.y += particle.velocity.y * deltaTime;

            particle.lifetime += deltaTime * 1000;

            if (
                particle.position.y < -worldHeight / 2 ||
                particle.lifetime > particle.maxLifetime
            ) {
                particle.active = false;
            }

            if (this.currentWeather === WeatherType.SNOW) {
                particle.velocity.x += (Math.random() * 2 - 1) * deltaTime;

                particle.velocity.x = Math.max(-2, Math.min(2, particle.velocity.x));
            }
        }

        if (!this.spawnParticles) {
            const activeCount = this.particles.filter(p => p.active).length;

            if (activeCount > 0 && activeCount % 50 === 0) {
            }

            if (activeCount === 0) {
                this.particlesActive = false;
            }
        }
    }

    private randomizeWeather(): void {
        const weatherOptions = this.allowedWeatherTypes;

        const filteredOptions = weatherOptions.filter(w => w !== this.currentWeather);

        if (filteredOptions.length === 0) {
            this.setWeather(WeatherType.CLEAR);
            return;
        }

        const newWeather = filteredOptions[Math.floor(Math.random() * filteredOptions.length)];

        this.weatherDuration = this.minDuration + Math.random() * (this.maxDuration - this.minDuration);
        this.weatherTimer = 0;

        console.log(`Weather changing to ${newWeather}, duration: ${this.weatherDuration/1000}s`);

        if (this.currentWeather !== WeatherType.CLEAR && newWeather === WeatherType.CLEAR) {
            this.spawnParticles = false;
        }

        this.setWeather(newWeather as WeatherType);
    }

    private setWeather(type: WeatherType): void {
        const previousWeather = this.currentWeather;
        this.currentWeather = type;

        if (previousWeather !== WeatherType.CLEAR && previousWeather !== type) {
            this.spawnParticles = false;
            this.particlesActive = true;
        }

        if (type === WeatherType.CLEAR) {
            this.removePuddles();
        } else {
            this.particlesActive = true;
            this.spawnParticles = true;

            if (type === WeatherType.RAIN) {
                this.createPuddles('puddle');
            } else if (type === WeatherType.SNOW) {
                this.createPuddles('ice');
            }
        }
    }

    public forceStopParticles(): void {
        this.spawnParticles = false;
        this.particlesActive = false;
        for (const particle of this.particles) {
            particle.active = false;
        }
    }

    private removePuddles(): void {
        for (const puddle of this.puddles) {
            if (puddle.id) {
                this.scene.removeObject(puddle.id);
            }
        }
        this.puddles = [];
        this.activeSpawnPoints.clear();
    }

    private createPuddles(type: 'puddle' | 'ice'): void {
        this.removePuddles();

        const availableSpawnPoints = this.puddleSpawnPoints.filter(
            point => (!point.type || point.type === type)
        );

        if (availableSpawnPoints.length === 0) return;

        const pointsToActivate = Math.ceil(availableSpawnPoints.length * 0.7);
        const selectedPoints = this.shuffleArray(availableSpawnPoints).slice(0, pointsToActivate);

        for (const point of selectedPoints) {
            this.createPuddle(point, type);
            this.activeSpawnPoints.add(this.getSpawnPointKey(point));
        }
    }

    private createPuddle(point: PuddleSpawnPoint, type: 'puddle' | 'ice'): void {
        const puddle = new PuddleObject({
            position: point.position,
            size: point.size,
            type,
            mass: 0
        });

        puddle.id = this.scene.addObject(puddle);
        this.puddles.push(puddle);

        this.setupPuddleCollisions(puddle);
    }

    private setupPuddleCollisions(puddle: PuddleObject): void {
        const cars = Array.from(this.scene.gameObjects.values())
            .filter(obj => obj instanceof CarObject) as CarObject[];

        for (const car of cars) {
            const overlap = new Overlap(
                car,
                puddle,
                (vehicle, puddleObj) => {
                    if (puddleObj instanceof PuddleObject && vehicle instanceof CarObject) {
                        puddleObj.applyEffect(vehicle);
                    }
                }
            );

            this.scene.overlapManager.addOverlap(overlap);
        }
    }

    getCurrentWeather(): WeatherType {
        return this.currentWeather;
    }

    forceWeather(type: WeatherType): void {
        if (!this.allowedWeatherTypes.includes(type)) {
            console.warn(`Weather type ${type} is not allowed for this map. Defaulting to CLEAR.`);
            type = WeatherType.CLEAR;
        }

        if (type === WeatherType.CLEAR) {
            this.spawnParticles = false;
        }

        this.weatherTimer = 0;
        this.weatherDuration = this.maxDuration;
        this.setWeather(type);
    }

    setAllowedWeatherTypes(types: WeatherType[]): void {
        if (!types.includes(WeatherType.CLEAR)) {
            this.allowedWeatherTypes = [WeatherType.CLEAR, ...types];
        } else {
            this.allowedWeatherTypes = [...types];
        }
    }

    private getSpawnPointKey(point: PuddleSpawnPoint): string {
        return `${point.position.x},${point.position.y}`;
    }

    private shuffleArray<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}
