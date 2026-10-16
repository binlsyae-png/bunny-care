// Realistic and Cute Web Audio API Sound Synthesizer for Bunny Care Game
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (!this.initialized) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.initialized = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gain = 0.1, pitchDecay = true) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = type;
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(freq, now);
            if (pitchDecay) {
                osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);
            }

            gainNode.gain.setValueAtTime(gain, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // 뿅! (버튼 클릭 / 선택)
    pop() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 쓰다듬기 (하트 뿜뿜 멜로디)
    purr() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.12, 0.08, false);
            }, idx * 45);
        });
    }

    // 실제 토끼 치아 부비기(Tooth purring - 행복할 때 이를 사각사각 맞부딪히는 소리)
    toothPurr() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        [0, 60, 130, 200, 280].forEach(delay => {
            setTimeout(() => {
                this.playTone(1800 + Math.random() * 400, 'triangle', 0.03, 0.03, true);
            }, delay);
        });
    }

    // 킁킁거리기 (토끼 코 냄새 맡는 소리)
    sniff() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [0, 90, 170].forEach((delay, idx) => {
            setTimeout(() => {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(450 + idx * 80, t);
                osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);
                gain.gain.setValueAtTime(0.04, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.06);
            }, delay);
        });
    }

    // 발 구르기 (토끼 발 쿵! - Thumping)
    thump() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    // 당근 아삭아삭 씹는 소리 (Crisp Crunch)
    crunch() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const freqs = [650, 480, 720, 520];
        freqs.forEach((f, idx) => {
            setTimeout(() => {
                this.playTone(f, 'triangle', 0.05, 0.09, true);
            }, idx * 60);
        });
    }

    // 건초/풀 오물오물 씹는 소리 (Soft Nibble)
    nibble() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const freqs = [380, 320, 410, 340, 430];
        freqs.forEach((f, idx) => {
            setTimeout(() => {
                this.playTone(f, 'sine', 0.04, 0.06, true);
            }, idx * 55);
        });
    }

    // 털 털기 / 기지개 부스럭 소리 (Rustle)
    rustle() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playTone(250 + Math.random() * 200, 'sine', 0.04, 0.03, true);
            }, i * 40);
        }
    }

    // 깡총! (점프)
    boing() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.14);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 코인 획득 (띠링!)
    coin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // 놀아주기 (장난감 방울)
    jingle() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        [880, 1174, 1318, 1760].forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.1, 0.07, false);
            }, idx * 60);
        });
    }

    // 레벨업 / 탄생 축하 팡파레!
    fanfare() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const chords = [
            { f: 523.25, t: 0 },
            { f: 659.25, t: 120 },
            { f: 783.99, t: 240 },
            { f: 1046.50, t: 360 },
            { f: 1318.51, t: 540 }
        ];
        chords.forEach(item => {
            setTimeout(() => {
                this.playTone(item.f, 'triangle', 0.35, 0.15, false);
            }, item.t);
        });
    }

    // 사랑에 빠짐 / 짝짓기
    love() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        [440, 554.37, 659.25, 880].forEach((f, i) => {
            setTimeout(() => {
                this.playTone(f, 'sine', 0.25, 0.1, false);
            }, i * 90);
        });
    }
}

window.sound = new SoundEffects();
