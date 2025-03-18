import {
    KajakEngine,
    Scene,
    CarObject,
    Overlap, CheckpointObject,
} from "./index";
import {MapLoader} from "./MapLoader.ts";
import {soundManager} from "./SoundManager.ts";
import {TrackSurfaceSegment} from "./objects/TrackSurfaceSegment.ts";

class Game {
    private engine: KajakEngine;
    private currentScene: Scene | null = null;
    private debugState: boolean = false;
    private audioInitialized: boolean = false;

    constructor() {
        const canvas = document.createElement("canvas");
        document.querySelector('#app')!.appendChild(canvas);
        this.engine = new KajakEngine(canvas);

        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const startButton = document.createElement("button");
        startButton.innerText = "Click to Start Game";
        startButton.style.cssText = `
            padding: 20px 40px;
            font-size: 24px;
            cursor: pointer;
        `;

        overlay.appendChild(startButton);
        document.body.appendChild(overlay);

        startButton.onclick = async () => {
            await this.initializeAudio();
            overlay.remove();
            this.start();
        };

        this.setupUI();
        this.setupEventListeners();
    }

    private async initializeAudio(): Promise<void> {
        if (this.audioInitialized) return;

        if (this.currentScene) {
            for (const obj of this.currentScene.gameObjects.values()) {
                if (obj instanceof CarObject) {
                    const soundSystem = obj.soundSystem;
                    if (soundSystem) {
                        await soundSystem.initialize();
                    }
                }
            }
        }

        this.audioInitialized = true;
    }

    private setupUI(): void {
        const leaderboardContainer = document.createElement("div");
        leaderboardContainer.id = "leaderboard-container";
        document.body.appendChild(leaderboardContainer);

        const debugSwitch = document.createElement("button");
        debugSwitch.innerText = "Debug Switch";
        debugSwitch.id = "debug-switch";
        document.body.appendChild(debugSwitch);

        debugSwitch.onclick = () => {
            this.debugState = !this.debugState;
            this.engine.setDebugMode(this.debugState);
        };

        const volumeControls = document.createElement('div');
        volumeControls.innerHTML = `
        <div>
            <label>Master Volume: <input type="range" id="master-volume" min="0" max="100" value="100"></label>
            <label>Music Volume: <input type="range" id="music-volume" min="0" max="100" value="50"></label>
            <label>SFX Volume: <input type="range" id="sfx-volume" min="0" max="100" value="100"></label>
            <button id="mute-toggle">Mute</button>
        </div>
    `;
        document.body.appendChild(volumeControls);

        this.setupVolumeControls();
    }
    private setupVolumeControls(): void {
        document.getElementById('master-volume')?.addEventListener('input', (e) => {
            const volume = parseInt((e.target as HTMLInputElement).value) / 100;
            soundManager.setMasterVolume(volume);
        });

        document.getElementById('music-volume')?.addEventListener('input', (e) => {
            const volume = parseInt((e.target as HTMLInputElement).value) / 100;
            soundManager.setCategoryVolume('music', volume);
        });

        document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
            const volume = parseInt((e.target as HTMLInputElement).value) / 100;
            soundManager.setCategoryVolume('sfx', volume);
        });

        document.getElementById('mute-toggle')?.addEventListener('click', () => {
            if (soundManager.muted) {
                soundManager.unmute();
            } else {
                soundManager.mute();
            }
        });
    }


    private setupEventListeners(): void {
        document.addEventListener("keydown", async (e) => {
            if (!this.audioInitialized) {
                await this.initializeAudio();
            }
            this.handleKeyDown(e);
        });

        document.addEventListener("keyup", this.handleKeyUp.bind(this));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (!this.currentScene) return;

        const playerCar = this.findPlayerCar();
        if (!playerCar) return;

        switch (e.key) {
            case "ArrowUp":
                playerCar.setThrottle(183.91);
                break;
            case "ArrowDown":
                playerCar.setThrottle(-30);
                break;
            case "ArrowLeft":
                playerCar.setSteerAngle(-Math.PI / 2);
                break;
            case "ArrowRight":
                playerCar.setSteerAngle(Math.PI / 2);
                break;
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (!this.currentScene) return;

        const playerCar = this.findPlayerCar();
        if (!playerCar) return;

        switch (e.key) {
            case "ArrowUp":
            case "ArrowDown":
                playerCar.setThrottle(0);
                break;
            case "ArrowLeft":
            case "ArrowRight":
                playerCar.setSteerAngle(0);
                break;
        }
    }

    private findPlayerCar(): CarObject | null {
        if (!this.currentScene) return null;

        for (const obj of this.currentScene.gameObjects.values()) {
            if (obj instanceof CarObject && obj.isPlayer) {
                return obj;
            }
        }
        return null;
    }

    private setupCollisions(scene: Scene): void {
        const cars = Array.from(scene.gameObjects.values())
            .filter(obj => obj instanceof CarObject) as CarObject[];

        const checkpoints = Array.from(scene.gameObjects.values())
            .filter(obj => obj instanceof CheckpointObject) as CheckpointObject[];

        const barriers = Array.from(scene.gameObjects.values())
            .filter(obj => !(obj instanceof CarObject) && !(obj instanceof CheckpointObject) && !(obj instanceof TrackSurfaceSegment));

        // Car-to-car collisions
        for (let i = 0; i < cars.length; i++) {
            for (let j = i + 1; j < cars.length; j++) {
                const overlap = new Overlap(
                    cars[i],
                    cars[j],
                    (car1, car2, collisionInfo) => {
                        if (collisionInfo) {
                            car1.onCollision(car2, collisionInfo);
                        }
                    },
                    { customCollisionHandler: true }
                );
                scene.overlapManager.addOverlap(overlap);
            }
        }

        // Car-to-checkpoint collisions
        for (const car of cars) {
            for (const checkpoint of checkpoints) {
                const overlap = new Overlap(
                    car,
                    checkpoint,
                    (vehicle, checkpointObj) => {
                        if (checkpointObj instanceof CheckpointObject) {
                            if (vehicle instanceof CarObject && vehicle.isPlayer && checkpointObj.isActivated) {
                                checkpointObj.activate(vehicle);
                                checkpointObj.spriteManager!.hidden = true;
                            }
                        }
                    }
                );
                scene.overlapManager.addOverlap(overlap);
            }
        }

        // Car-to-barrier collisions
        for (const car of cars) {
            for (const barrier of barriers) {
                const overlap = new Overlap(
                    car,
                    barrier,
                    (vehicle, staticObj, collisionInfo) => {
                        if (collisionInfo) {
                            vehicle.onCollision(staticObj, collisionInfo);
                        }
                    },
                    { customCollisionHandler: true }
                );
                scene.overlapManager.addOverlap(overlap);
            }
        }
    }

    public async loadMap(mapPath: string): Promise<void> {
        try {
            this.currentScene = await MapLoader.loadMap(mapPath);
            this.engine.scenes.set(1, this.currentScene);
            this.engine.setCurrentScene(1);

            if (this.currentScene) {
                this.setupCollisions(this.currentScene);
            }
        } catch (error) {
            console.error("Error loading map:", error);
            throw error;
        }
    }

    public start(): void {
        this.engine.start();
    }
}

async function initGame() {
    const game = new Game();
    await game.loadMap("src/assets/race-track01.json");
}

initGame().catch(error => {
    console.error("Failed to initialize game:", error);
});
