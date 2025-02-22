export class EngineSoundGenerator {
    private audioContext!: AudioContext;
    private masterGain!: GainNode;
    private engineOsc!: OscillatorNode;
    private engineLFO!: OscillatorNode;
    private modulationGain!: GainNode;
    private initialized: boolean = false;
    private analyser!: AnalyserNode;
    private canvas!: HTMLCanvasElement;
    private canvasCtx!: CanvasRenderingContext2D;
    private animationFrameId: number | null = null;

    constructor() {
        this.setupVisualization();
    }

    private setupVisualization() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 300;
        this.canvas.height = 150;
        this.canvas.style.position = 'fixed';
        this.canvas.style.bottom = '20px';
        this.canvas.style.right = '20px';
        this.canvas.style.backgroundColor = 'white';
        this.canvas.style.border = '1px solid #ccc';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.background = 'white';
        container.style.borderRadius = '8px';
        container.style.padding = '10px';
        container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

        const title = document.createElement('div');
        title.textContent = 'Engine Sound Waveform';
        title.style.marginBottom = '10px';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';

        container.appendChild(title);
        container.appendChild(this.canvas);
        document.body.appendChild(container);

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.canvasCtx = ctx;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext)();

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.masterGain = this.audioContext.createGain();
            this.engineOsc = this.audioContext.createOscillator();
            this.engineLFO = this.audioContext.createOscillator();
            this.modulationGain = this.audioContext.createGain();

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            this.engineOsc.frequency.setValueAtTime(200, 0);
            this.engineOsc.connect(this.masterGain);

            this.engineLFO.type = 'square';
            this.engineLFO.frequency.setValueAtTime(30, 0);
            this.modulationGain.gain.value = 20;
            this.engineLFO.connect(this.modulationGain);
            this.modulationGain.connect(this.engineOsc.frequency);

            this.masterGain.gain.value = 1;
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.engineOsc.start();
            this.engineLFO.start();

            this.initialized = true;

            this.startVisualization();

            this.audioContext.onstatechange = async () => {
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
            };

        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    private startVisualization() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.animationFrameId = requestAnimationFrame(draw);

            this.analyser.getByteTimeDomainData(dataArray);

            this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.canvasCtx.lineWidth = 2;
            this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            this.canvasCtx.beginPath();

            const sliceWidth = this.canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * this.canvas.height / 2;

                if (i === 0) {
                    this.canvasCtx.moveTo(x, y);
                } else {
                    this.canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
            this.canvasCtx.stroke();
        };

        draw();
    }

    async resume(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    updateEngine(speed: number, acceleration: number): void {
        if (!this.initialized || this.audioContext.state === 'suspended') return;

        const baseFreq = 150 + (speed * 250);
        const accelBonus = Math.max(0, acceleration) * 100;
        this.engineOsc.frequency.setValueAtTime(baseFreq + accelBonus, 0);

        this.modulationGain.gain.value = 30 - (speed * 10);

        const baseVolume = 0.1 + (speed * 0.8);
        const accelVolume = Math.max(0, acceleration) * .4;
        this.masterGain.gain.value = Math.min(1.3, baseVolume + accelVolume);
    }

    dispose(): void {
        if (!this.initialized) return;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }

        const container = this.canvas.parentElement;
        if (container) {
            document.body.removeChild(container);
        }

        this.engineOsc.stop();
        this.engineLFO.stop();
        this.masterGain.disconnect();
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.initialized = false;
    }
}
