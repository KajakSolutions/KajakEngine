global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 0);
};

global.performance = {
    now: () => Date.now(),
};

class AudioMock {
    constructor() {
        this.src = '';
        this.volume = 1;
    }

    play() {
        return Promise.resolve();
    }

    pause() {}
    load() {}
}

global.Audio = AudioMock;

class CanvasRenderingContext2DMock {
    beginPath() {}
    moveTo() {}
    lineTo() {}
    stroke() {}
    fill() {}
    arc() {}
    save() {}
    restore() {}
    translate() {}
    rotate() {}
    scale() {}
    clearRect() {}
}

class CanvasMock {
    getContext() {
        return new CanvasRenderingContext2DMock();
    }
}

global.HTMLCanvasElement = CanvasMock;
