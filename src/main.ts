import {CarObject, CheckpointObject, KajakEngine, Overlap, Scene,} from "./index";
import {MapLoader} from "./MapLoader.ts";
import {soundManager} from "./SoundManager.ts";
import {TrackSurfaceSegment} from "./objects/TrackSurfaceSegment.ts";
import {NitroManager} from "./objects/NitroManager.ts";
import {ObstacleManager} from "./objects/ObstacleManager.ts";
import {ItemManager} from "./objects/ItemManager.ts";
import {WeatherSystem, WeatherType} from "./objects/WeatherSystem.ts";

class Game {
    private engine: KajakEngine;
    private currentScene: Scene | null = null;
    private debugState: boolean = false;
    private audioInitialized: boolean = false;
    private nitroManager: NitroManager | null = null;
    private obstacleManager: ObstacleManager | null = null;
    private itemManager: ItemManager | null = null;

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
        this.setupItemUI();
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

    private setupItemUI(): void {
        const itemDisplay = document.createElement("div");
        itemDisplay.id = "item-display";
        itemDisplay.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        display: flex;
        align-items: center;
    `;

        const bananaIcon = document.createElement("div");
        bananaIcon.innerHTML = "🍌";
        bananaIcon.style.fontSize = "24px";
        bananaIcon.style.marginRight = "10px";

        const bananaCount = document.createElement("div");
        bananaCount.id = "banana-count";
        bananaCount.style.fontSize = "20px";
        bananaCount.innerText = "0/3";

        itemDisplay.appendChild(bananaIcon);
        itemDisplay.appendChild(bananaCount);
        document.body.appendChild(itemDisplay);

        setInterval(() => {
            const playerCar = this.findPlayerCar();
            if (playerCar) {
                const bananaCount = document.getElementById("banana-count");
                if (bananaCount) {
                    bananaCount.innerText = `${playerCar.bananaPeels}/${playerCar.maxBananaPeels}`;
                }
            }
        }, 100);
    }

    private setupUI(): void {
        const nitroDisplay = document.createElement("div");
        nitroDisplay.id = "nitro-display";
        nitroDisplay.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 200px;
        height: 20px;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 10px;
    `;
        document.body.appendChild(nitroDisplay);

        const nitroBar = document.createElement("div");
        nitroBar.id = "nitro-bar";
        nitroBar.style.cssText = `
        height: 100%;
        width: 0%;
        background-color: blue;
        border-radius: 10px;
        transition: width 0.3s;
    `;
        nitroDisplay.appendChild(nitroBar);

        setInterval(() => {
            const playerCar = this.findPlayerCar();
            if (playerCar) {
                const percentage = (playerCar.nitroAmount / playerCar.maxNitro) * 100;
                nitroBar.style.width = `${percentage}%`;
                nitroBar.style.backgroundColor = playerCar.nitroActive ? 'red' : 'blue';
            }
        }, 50);

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

    private setupWeather(): void {
        if (this.currentScene && !this.currentScene.weatherSystem) {
            const puddleSpawnPoints = [
                {
                    position: { x: -30, y: -10 },
                    size: { x: 5, y: 4 },
                    type: 'puddle' as const
                },
                {
                    position: { x: 15, y: 15 },
                    size: { x: 6, y: 3 },
                    type: 'puddle' as const
                },
                {
                    position: { x: 40, y: -20 },
                    size: { x: 4, y: 4 },
                    type: 'ice' as const
                },
                {
                    position: { x: -20, y: 30 },
                    size: { x: 7, y: 3 },
                    type: 'ice' as const
                },
                {
                    position: { x: 0, y: -30 },
                    size: { x: 5, y: 5 },
                    type: 'puddle' as const
                }
            ];

            const weatherTypes = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.SNOW];
            const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

            console.log(`Initializing weather system with ${randomWeather} weather`);

            const weatherSystem = new WeatherSystem(this.currentScene, {
                initialWeather: WeatherType.CLEAR,
                minDuration: 3000,
                maxDuration: 20000,
                intensity: 0.8,
                puddleSpawnPoints: puddleSpawnPoints,
                allowedWeatherTypes: [WeatherType.CLEAR, WeatherType.RAIN]
            });

            this.currentScene.setWeatherSystem(weatherSystem);
        }
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
            case " ":
                playerCar.activateNitro();
                break;
            case "b":
                this.dropBananaPeel();
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

    private dropBananaPeel(): void {
        if (!this.currentScene || !this.obstacleManager) return;

        const playerCar = this.findPlayerCar();
        if (!playerCar) return;

        if (playerCar.useBananaPeel()) {
            const carAngle = playerCar.rotation;
            const dropDistance = -3;
            const dropX = playerCar.position.x - Math.sin(carAngle) * dropDistance;
            const dropY = playerCar.position.y - Math.cos(carAngle) * dropDistance;

            this.obstacleManager.createObstacle('bananaPeel', { x: dropX, y: dropY }, playerCar.id);
        }
    }

    private setupCollisions(scene: Scene): void {
        const cars = Array.from(scene.gameObjects.values())
            .filter(obj => obj instanceof CarObject) as CarObject[];

        const checkpoints = Array.from(scene.gameObjects.values())
            .filter(obj => obj instanceof CheckpointObject) as CheckpointObject[];

        const barriers = Array.from(scene.gameObjects.values())
            .filter(obj => !(obj instanceof CarObject) && !(obj instanceof CheckpointObject) && !(obj instanceof TrackSurfaceSegment));

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
            const response = await fetch(mapPath);
            const config = await response.json();

            this.currentScene = await MapLoader.loadMap(mapPath);
            this.engine.scenes.set(1, this.currentScene);
            this.engine.setCurrentScene(1);

            if (this.currentScene) {
                this.setupCollisions(this.currentScene);

                this.setupWeather();

                this.obstacleManager = new ObstacleManager(this.currentScene, {
                    maxActiveObstacles: 15,
                    bananaPeelLifespan: 30000
                });

                const itemSpawnPoints = config.itemSpawns ? config.itemSpawns.map((spawn: { position: any; respawnTime: any; itemTypes: any; spawnChance: undefined; }) => ({
                    position: spawn.position,
                    respawnTime: spawn.respawnTime || 15000,
                    itemTypes: spawn.itemTypes || ['bananaPeel'],
                    spawnChance: spawn.spawnChance !== undefined ? spawn.spawnChance : 1.0
                })) : [];

                this.itemManager = new ItemManager(this.currentScene, {
                    maxItems: 8,
                    itemRespawnTime: 15000,
                    spawnInterval: 10000,
                    spawnPoints: itemSpawnPoints
                });

                this.itemManager.startItemSpawning();
            }

            if (config.nitroSpawns) {
                this.nitroManager = new NitroManager(this.currentScene);
                this.nitroManager.initialize(config.nitroSpawns);
            }
        } catch (error) {
            console.error("Error loading map:", error);
            throw error;
        }
    }

    public start(): void {
        this.engine.start();

        setInterval(() => {
            if (this.obstacleManager) {
                this.obstacleManager.update();
            }
        }, 1000);
    }
}

async function initGame() {
    const game = new Game();
    await game.loadMap("src/assets/race-track02.json");
}

initGame().catch(error => {
    console.error("Failed to initialize game:", error);
});
