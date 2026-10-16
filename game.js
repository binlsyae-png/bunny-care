// Bunny Care - Game State & Interactions Engine (Wide Layout & Rich Behaviors)

class BunnyCareGame {
    constructor() {
        this.STORAGE_KEY = 'bunny_care_save_v2';
        this.coins = 150;
        this.bunnies = [];
        this.currentBunnyId = null;
        this.unlockedBreeds = ['snow_white'];
        this.inventory = {
            foods: { carrot: 5, hay: 3, strawberry: 2, clover: 1 },
            accessories: [],
            themes: ['default'],
            decor: { bed: true, plant: true, rug: true }
        };
        this.roomTheme = 'default';
        this.walkState = {
            active: false,
            place: 'garden',
            progress: 0,
            interval: null,
            timer: null
        };

        this.petCount = 0;
        this.isFeeding = false;
        this.selectedMatePartner = null;

        this.init();
    }

    init() {
        this.loadGame();

        // 토끼가 한 마리도 없으면 기본 아기 토끼 생성
        if (this.bunnies.length === 0) {
            const firstBunny = new Bunny({
                name: '모찌',
                stage: 'baby',
                breedId: 'snow_white',
                gender: 'female',
                hunger: 80,
                mood: 90,
                energy: 85
            });
            this.bunnies.push(firstBunny);
            this.currentBunnyId = firstBunny.id;
            this.unlockedBreeds.push('snow_white');
            this.saveGame();
        }

        // 유효한 currentBunnyId 확인
        if (!this.getCurrentBunny()) {
            this.currentBunnyId = this.bunnies[0].id;
        }

        this.setupEventListeners();
        this.startTickLoop();
        this.startRandomBehaviorLoop();
        this.renderAll();

        // 최초 1회 환영 토스트
        setTimeout(() => {
            this.showToast(`🐰 귀여운 ${this.getCurrentBunny().name}이(가) 당신을 반겨요!`);
        }, 600);
    }

    getCurrentBunny() {
        return this.bunnies.find(b => b.id === this.currentBunnyId) || this.bunnies[0];
    }

    // 로컬 스토리지 저장 및 불러오기 (친밀도 필드 완전 제거)
    saveGame() {
        try {
            const data = {
                coins: this.coins,
                currentBunnyId: this.currentBunnyId,
                unlockedBreeds: Array.from(new Set(this.unlockedBreeds)),
                inventory: this.inventory,
                roomTheme: this.roomTheme,
                bunnies: this.bunnies.map(b => ({
                    id: b.id,
                    name: b.name,
                    gender: b.gender,
                    stage: b.stage,
                    ageMinutes: b.ageMinutes,
                    breedId: b.breedId,
                    pattern: b.pattern,
                    eyeColor: b.eyeColor,
                    accessory: b.accessory,
                    hunger: b.hunger,
                    mood: b.mood,
                    health: b.health,
                    energy: b.energy,
                    exp: b.exp,
                    isPregnant: b.isPregnant,
                    pregnancyTimer: b.pregnancyTimer,
                    fatherName: b.fatherName,
                    motherName: b.motherName,
                    generation: b.generation,
                    childrenCount: b.childrenCount,
                    matePartnerBreed: b.matePartnerBreed,
                    matePartnerName: b.matePartnerName,
                    matePartnerPattern: b.matePartnerPattern
                }))
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    loadGame() {
        try {
            let raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) {
                // 이전 세이브 키 호환 시도
                raw = localStorage.getItem('bunny_care_save_v1');
            }
            if (!raw) return;
            const data = JSON.parse(raw);
            this.coins = data.coins !== undefined ? data.coins : 150;
            this.currentBunnyId = data.currentBunnyId;
            this.unlockedBreeds = data.unlockedBreeds || ['snow_white'];
            this.inventory = data.inventory || this.inventory;
            this.roomTheme = data.roomTheme || 'default';
            if (data.bunnies && Array.isArray(data.bunnies)) {
                this.bunnies = data.bunnies.map(bData => new Bunny(bData));
            }
        } catch (e) {
            console.error('Load failed:', e);
        }
    }

    // 1초 단위 타이머 루프
    startTickLoop() {
        setInterval(() => {
            const currentBunny = this.getCurrentBunny();
            if (!currentBunny) return;

            this.bunnies.forEach(bunny => {
                const event = bunny.tick(1);
                if (event === 'give_birth') {
                    this.triggerBirthEvent(bunny);
                }
            });

            this.updateStatsUI();
            this.updateStatusBanner();
        }, 1000);

        setInterval(() => {
            this.saveGame();
        }, 5000);

        // 자율 방 안 깡총깡총 돌아다니기 루프 시작
        this.startWanderingLoop();
    }

    // ★ 토끼가 스스로 방 안을 깡총깡총 돌아다니는 자율 이동 루프
    startWanderingLoop() {
        const scheduleWander = () => {
            // 4.5초 ~ 8초 사이의 주기적 자율 이동
            const nextDelay = 4500 + Math.random() * 3500;
            setTimeout(() => {
                this.roamAroundRoom();
                scheduleWander();
            }, nextDelay);
        };
        scheduleWander();
    }

    // 방 바닥 특정 위치 또는 랜덤 좌표로 깡총깡총 이동
    moveBunnyToPercent(targetPercent, isUserCall = false) {
        const bunny = this.getCurrentBunny();
        const bunnyWrapper = document.getElementById('bunny-wrapper');
        if (!bunnyWrapper || bunny.animState !== 'idle' || this.isFeeding) return;

        const currentLeft = parseFloat(bunnyWrapper.style.left || '50');
        const movingRight = targetPercent >= currentLeft;

        // 방향 전환 (바라보는 방향으로 몸 회전)
        bunnyWrapper.style.transform = `translateX(-50%) scaleX(${movingRight ? 1 : -1})`;
        bunny.animState = 'jumping';
        this.renderBunnySVG();

        // 깡총 효과음
        window.sound.boing();

        // 이동 시작
        bunnyWrapper.style.left = `${targetPercent}%`;

        // ★ 함께 있는 아기 토끼들도 엄마를 쪼르르 쫓아 깡총 이동
        const babyContainer = document.getElementById('baby-bunnies-container');
        if (babyContainer) {
            const babyEls = babyContainer.children;
            const offsets = [-14, 15, -24, 25];
            for (let i = 0; i < babyEls.length; i++) {
                const bEl = babyEls[i];
                setTimeout(() => {
                    const babyTarget = Math.max(8, Math.min(90, targetPercent + (offsets[i % offsets.length])));
                    bEl.style.left = `${babyTarget}%`;
                    bEl.classList.add('anim-baby-hop');
                    setTimeout(() => bEl.classList.remove('anim-baby-hop'), 700);
                }, 160 + i * 140);
            }
        }

        if (isUserCall) {
            this.showSpeechBubble(`깡총깡총! 여기로 왔어요! 🥕`, 1800);
        }

        // 착지 후 동작
        setTimeout(() => {
            bunny.animState = 'idle';
            this.renderBunnySVG();

            // 착지 후 40% 확률로 냄새 맡기, 기지개, 귀 쫑긋, 또는 깜짝 애교
            const rand = Math.random();
            if (rand > 0.65) {
                const afterActions = ['sniffing', 'stretching', 'ear_wiggle'];
                const act = afterActions[Math.floor(Math.random() * afterActions.length)];
                bunny.animState = act;
                this.renderBunnySVG();
                if (act === 'sniffing') window.sound.sniff();
                else if (act === 'stretching') window.sound.rustle();

                setTimeout(() => {
                    if (bunny.animState === act) {
                        bunny.animState = 'idle';
                        this.renderBunnySVG();
                    }
                }, 1300);
            } else if (rand < 0.25 && bunny.mood > 70) {
                // 가끔 착지 후 깜짝 애교!
                this.triggerAegyo();
            }
        }, 1300);
    }

    roamAroundRoom() {
        // 18% ~ 74% 사이의 새로운 좌표로 자율 이동
        const targetPercent = Math.floor(18 + Math.random() * 56);
        this.moveBunnyToPercent(targetPercent, false);
    }

    // ★ 토끼 애교 부리기 (발라당 Flop, 뱅키 Binky, 코콕 Boop, 두발서기 Periscope)
    triggerAegyo(type = null) {
        const bunny = this.getCurrentBunny();
        if (this.isFeeding) return;

        const aegyoList = [
            {
                anim: 'aegyo_flop',
                msg: `💕 ${bunny.name}이(가) 기분이 너무 좋아 옆으로 발라당 누워 배를 보여줘요!`,
                sound: () => window.sound.toothPurr(),
                duration: 1900
            },
            {
                anim: 'aegyo_binky',
                msg: `🎈 ${bunny.name}이(가) 행복 만점으로 공중에서 몸을 비틀며 신나게 뱅키 점프를 뛰었어요!`,
                sound: () => window.sound.boing(),
                duration: 1400
            },
            {
                anim: 'aegyo_boop',
                msg: `💋 ${bunny.name}이(가) 화면 앞으로 성큼성큼 다가와 코를 콕 들이대며 뽀뽀했어요!`,
                sound: () => window.sound.purr(),
                duration: 1700
            },
            {
                anim: 'aegyo_periscope',
                msg: `🐰 ${bunny.name}이(가) 두 발로 쫑긋 서서 앞발을 모으고 간식을 조르며 애교를 부려요!`,
                sound: () => window.sound.purr(),
                duration: 1700
            }
        ];

        let selected = aegyoList.find(a => a.anim === type);
        if (!selected) {
            selected = aegyoList[Math.floor(Math.random() * aegyoList.length)];
        }

        bunny.animState = selected.anim;
        bunny.mood = Math.min(100, bunny.mood + 15);
        this.renderBunnySVG();

        if (selected.sound) selected.sound();

        // 하트 파티클 연속 3개 발생
        const rect = document.getElementById('bunny-wrapper')?.getBoundingClientRect();
        if (rect) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.spawnHeartParticle(rect.left + rect.width / 2 + (Math.random() - 0.5) * 60, rect.top + rect.height / 2);
                }, i * 180);
            }
        }

        this.showSpeechBubble(selected.msg, 2800);
        this.showToast(selected.msg);
        this.updateStatsUI();

        setTimeout(() => {
            if (bunny.animState === selected.anim) {
                bunny.animState = 'idle';
                this.renderBunnySVG();
            }
        }, selected.duration);
    }

    // ★ 1. 자율 랜덤 행동 루프 (8~16초마다 다양한 토끼 행동과 자연스러운 소리)
    startRandomBehaviorLoop() {
        const scheduleNext = () => {
            const nextDelay = 8000 + Math.random() * 8000;
            setTimeout(() => {
                this.triggerRandomIdleBehavior();
                scheduleNext();
            }, nextDelay);
        };
        scheduleNext();
    }

    triggerRandomIdleBehavior() {
        const bunny = this.getCurrentBunny();
        // 이미 다른 인터랙션 중이거나 수면 중이면 건너뜀
        if (bunny.animState !== 'idle' || this.isFeeding) return;

        // 기분이 최고조면 가끔 자율 애교 발동!
        if (bunny.mood > 75 && Math.random() > 0.5) {
            this.triggerAegyo();
            return;
        }

        const behaviors = [
            { anim: 'sniffing', sound: () => window.sound.sniff(), msg: `${bunny.name}이(가) 코를 씰룩거리며 주변 냄새를 킁킁 맡아요.` },
            { anim: 'grooming', sound: null, msg: `${bunny.name}이(가) 앞발로 귀와 얼굴을 열심히 닦고 있어요! 🫧` },
            { anim: 'stretching', sound: () => window.sound.rustle(), msg: `${bunny.name}이(가) 시원하게 기지개를 쭉 켜요.` },
            { anim: 'shaking', sound: () => window.sound.rustle(), msg: `${bunny.name}이(가) 복슬복슬한 몸을 부르르 털었어요!` },
            { anim: 'ear_wiggle', sound: null, msg: `${bunny.name}이(가) 소리가 나는 쪽으로 귀를 쫑긋거려요. 🐰` }
        ];

        const choice = behaviors[Math.floor(Math.random() * behaviors.length)];
        bunny.animState = choice.anim;
        this.renderBunnySVG();

        if (choice.sound && Math.random() > 0.3) {
            choice.sound();
        }

        this.showSpeechBubble(choice.msg, 2200);

        setTimeout(() => {
            if (bunny.animState === choice.anim) {
                bunny.animState = 'idle';
                this.renderBunnySVG();
            }
        }, 1500);
    }

    // 이벤트 리스너 연결
    setupEventListeners() {
        // 사운드 토글
        const soundBtn = document.getElementById('btn-sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const isMuted = window.sound.toggleMute();
                soundBtn.textContent = isMuted ? '🔇' : '🔊';
                this.showToast(isMuted ? '사운드가 꺼졌습니다.' : '사운드가 켜졌습니다. 🔊');
            });
        }

        // 이름 수정
        const editNameBtn = document.getElementById('btn-edit-name');
        if (editNameBtn) {
            editNameBtn.addEventListener('click', () => {
                const bunny = this.getCurrentBunny();
                const newName = prompt('토끼의 새 이름을 입력해 주세요 (1~8글자):', bunny.name);
                if (newName && newName.trim().length > 0) {
                    bunny.name = newName.trim().substring(0, 8);
                    this.renderProfile();
                    this.saveGame();
                    window.sound.pop();
                    this.showToast(`토끼 이름이 '${bunny.name}'(으)로 변경되었어요! ✨`);
                }
            });
        }

        // 토끼 클릭/터치 (쓰다듬기)
        const bunnyWrapper = document.getElementById('bunny-wrapper');
        if (bunnyWrapper) {
            bunnyWrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePetAction(e);
            });
            bunnyWrapper.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                this.handlePetAction(touch);
            }, { passive: true });
        }

        // 방 바닥(러그) 클릭 시 토끼 부르기 (깡총깡총 유도)
        const stageRoom = document.getElementById('stage-room');
        if (stageRoom) {
            stageRoom.addEventListener('click', (e) => {
                // 먹이 주기 중이거나 모달 창이 열려있으면 제외
                if (this.isFeeding || document.querySelector('.modal-overlay.active')) return;
                const rect = stageRoom.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = Math.max(15, Math.min(85, Math.round((clickX / rect.width) * 100)));
                this.moveBunnyToPercent(percent, true);
            });
        }

        // 액션 버튼
        document.getElementById('action-feed')?.addEventListener('click', () => {
            this.handleFeedAction('carrot');
        });
        document.getElementById('action-pet')?.addEventListener('click', (e) => {
            const rect = bunnyWrapper.getBoundingClientRect();
            this.handlePetAction({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
        });
        document.getElementById('action-play')?.addEventListener('click', () => this.handlePlayAction());
        document.getElementById('action-sleep')?.addEventListener('click', () => this.handleSleepAction());

        // ★ 애교 보기 버튼
        document.getElementById('action-aegyo')?.addEventListener('click', () => this.triggerAegyo());

        // 짝짓기 & 데이트 버튼 (친밀도 제한 없음!)
        document.getElementById('btn-open-mate')?.addEventListener('click', () => this.openMateModal());

        // 먹이 퀵바 및 보관함 클릭
        document.querySelectorAll('.food-item-btn, .food-stock-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const food = btn.dataset.food;
                this.handleFeedAction(food);
            });
        });

        // 하단 모달 내비게이션
        document.getElementById('nav-walk')?.addEventListener('click', () => this.openModal('modal-walk'));
        document.getElementById('nav-family')?.addEventListener('click', () => this.openModal('modal-family'));
        document.getElementById('nav-dex')?.addEventListener('click', () => this.openModal('modal-dex'));
        document.getElementById('nav-shop')?.addEventListener('click', () => this.openModal('modal-shop'));

        // 모달 닫기
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
                window.sound.pop();
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeAllModals();
            });
        });

        // 산책 장소 선택
        document.querySelectorAll('.walk-place-card').forEach(card => {
            card.addEventListener('click', () => {
                const place = card.dataset.place;
                this.startWalkAdventure(place);
            });
        });

        // 상점 탭 전환
        document.querySelectorAll('.shop-tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.shop-tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderShop(tab.dataset.tab);
                window.sound.pop();
            });
        });

        // 데이트 씬에서 '지금 바로 짝짓기' 버튼 클릭
        document.getElementById('btn-start-mating-now')?.addEventListener('click', () => {
            if (this.selectedMatePartner) {
                this.executeMatingNow(this.getCurrentBunny(), this.selectedMatePartner);
            }
        });
    }

    // 모달 관리
    openModal(modalId) {
        window.sound.pop();
        this.closeAllModals();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            if (modalId === 'modal-family') this.renderFamilyHub();
            if (modalId === 'modal-dex') this.renderDex();
            if (modalId === 'modal-shop') this.renderShop('foods');
            if (modalId === 'modal-walk') this.resetWalkSelectScreen();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        if (this.walkState.active) {
            this.endWalkAdventure(false);
        }
    }

    // ★ 1. 쓰다듬기 (연속 클릭에 따른 다양한 분기 반응과 소리)
    handlePetAction(event) {
        const bunny = this.getCurrentBunny();
        this.petCount++;

        // 소리 다양화: 이갈기 골골송 또는 부드러운 멜로디
        if (this.petCount % 2 === 0) {
            window.sound.toothPurr();
        } else {
            window.sound.purr();
        }

        // 파티클 생성
        this.spawnHeartParticle(event.clientX, event.clientY);

        // 토끼 애니메이션
        this.triggerBunnyAnimation('petting', 1200);

        const res = bunny.pet(this.petCount);
        this.coins += 2;
        this.updateStatsUI();
        this.updateCoinUI();
        this.showSpeechBubble(res.message);

        if (res.growth) {
            this.handleGrowthEvent(bunny, res.growth);
        }
        this.saveGame();
    }

    // 하트 파티클 소환
    spawnHeartParticle(clientX, clientY) {
        const stage = document.getElementById('stage-room');
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        
        const x = clientX !== undefined ? (clientX - rect.left) : (rect.width / 2);
        const y = clientY !== undefined ? (clientY - rect.top) : (rect.height / 2);

        const hearts = ['💖', '💕', '✨', '🌸', '🐰', '💗'];
        const chosenHeart = hearts[Math.floor(Math.random() * hearts.length)];

        const particle = document.createElement('div');
        particle.className = 'floating-heart';
        particle.textContent = chosenHeart;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 70}px`);

        stage.appendChild(particle);
        setTimeout(() => particle.remove(), 1100);
    }

    // ★ 2. 먹이를 실제로 보이게 만들기 (손이 먹이를 들고 다가가서 갉아먹는 시각화)
    handleFeedAction(foodType = 'carrot') {
        if (this.isFeeding) return;

        const bunny = this.getCurrentBunny();
        const count = this.inventory.foods[foodType] || 0;

        if (count <= 0) {
            this.showToast('해당 먹이가 부족해요! 상점이나 산책에서 구해 보세요. 🛒');
            window.sound.pop();
            return;
        }

        this.inventory.foods[foodType]--;
        this.updateStockUI();
        this.isFeeding = true;

        // 먹이별 SVG 생성
        const foodSVGs = {
            carrot: `
            <svg viewBox="0 0 60 70" width="55" height="65">
                <!-- 초록 잎사귀 -->
                <path d="M28,20 Q20,2 14,8 Q20,16 27,22" fill="#4CAF50"/>
                <path d="M30,20 Q32,0 36,4 Q34,14 31,22" fill="#66BB6A"/>
                <path d="M32,20 Q42,6 46,12 Q38,18 33,22" fill="#81C784"/>
                <!-- 주황 당근 몸통 -->
                <path d="M22,22 Q30,19 38,22 Q36,48 30,68 Q24,48 22,22 Z" fill="#FF6B35" stroke="#E65100" stroke-width="2"/>
                <line x1="25" y1="32" x2="33" y2="34" stroke="#E65100" stroke-width="2" stroke-linecap="round"/>
                <line x1="26" y1="44" x2="34" y2="46" stroke="#E65100" stroke-width="2" stroke-linecap="round"/>
                <line x1="28" y1="56" x2="32" y2="57" stroke="#E65100" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            hay: `
            <svg viewBox="0 0 60 70" width="55" height="65">
                <!-- 건초 다발 -->
                <path d="M15,55 Q25,25 20,8" stroke="#DDA15E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                <path d="M22,58 Q28,28 32,5" stroke="#BC6C25" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M30,60 Q34,30 42,10" stroke="#E9C46A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                <path d="M36,56 Q38,32 48,15" stroke="#DDA15E" stroke-width="3" fill="none" stroke-linecap="round"/>
                <!-- 묶음 끈 -->
                <ellipse cx="30" cy="42" rx="16" ry="6" fill="#8C5205" opacity="0.8"/>
            </svg>`,
            strawberry: `
            <svg viewBox="0 0 60 70" width="55" height="65">
                <!-- 딸기 꼭지 -->
                <polygon points="30,20 22,12 25,20 18,22 26,24 30,22 34,24 42,22 35,20 38,12" fill="#4CAF50"/>
                <!-- 딸기 열매 -->
                <path d="M16,24 C14,40 26,62 30,65 C34,62 46,40 44,24 C40,18 20,18 16,24 Z" fill="#E63946" stroke="#C1121F" stroke-width="2"/>
                <!-- 씨앗 -->
                <circle cx="24" cy="30" r="1.5" fill="#FFE382"/>
                <circle cx="34" cy="32" r="1.5" fill="#FFE382"/>
                <circle cx="28" cy="42" r="1.5" fill="#FFE382"/>
                <circle cx="32" cy="52" r="1.5" fill="#FFE382"/>
            </svg>`,
            clover: `
            <svg viewBox="0 0 60 70" width="55" height="65">
                <!-- 클로버 줄기 -->
                <path d="M30,35 Q30,58 38,65" stroke="#2D6A4F" stroke-width="3" fill="none" stroke-linecap="round"/>
                <!-- 4개 잎 -->
                <circle cx="22" cy="24" r="10" fill="#52B788"/>
                <circle cx="38" cy="24" r="10" fill="#40916C"/>
                <circle cx="22" cy="38" r="10" fill="#40916C"/>
                <circle cx="38" cy="38" r="10" fill="#52B788"/>
                <circle cx="30" cy="31" r="5" fill="#74C69D"/>
            </svg>`
        };

        const layer = document.getElementById('feeding-interaction-layer');
        const hand = document.getElementById('feeding-hand');
        const heldFood = document.getElementById('feeding-held-food');

        if (!layer || !hand || !heldFood) return;

        // 먹이 주입
        heldFood.className = 'feeding-held-food';
        heldFood.innerHTML = foodSVGs[foodType] || foodSVGs.carrot;
        layer.style.display = 'block';

        // 1단계: 손이 먹이를 들고 토끼 입 앞으로 슥 다가감
        setTimeout(() => {
            hand.classList.add('feeding-active');
        }, 50);

        // 2단계: 토끼가 입을 오물거리며 고개를 숙이고 먹기 시작
        setTimeout(() => {
            bunny.animState = 'eating';
            this.renderBunnySVG();

            // 사운드: 당근은 crunch, 나머지는 nibble
            if (foodType === 'carrot') {
                window.sound.crunch();
            } else {
                window.sound.nibble();
            }

            // 먹이가 조금씩 베어물리며 축소 (bite-1)
            heldFood.classList.add('bite-1');
            this.spawnCrumbs(foodType);
        }, 650);

        // 3단계: 두 번째 베어물기 (bite-2)
        setTimeout(() => {
            if (foodType === 'carrot') window.sound.crunch();
            else window.sound.nibble();
            heldFood.classList.remove('bite-1');
            heldFood.classList.add('bite-2');
            this.spawnCrumbs(foodType);
        }, 1250);

        // 4단계: 마지막 조각까지 맛있게 냠냠 (bite-3 -> bite-done)
        setTimeout(() => {
            heldFood.classList.remove('bite-2');
            heldFood.classList.add('bite-3');
            this.spawnCrumbs(foodType);
        }, 1800);

        // 5단계: 다 먹음! 손 퇴장 및 토끼 만족
        setTimeout(() => {
            heldFood.classList.add('bite-done');
            hand.classList.remove('feeding-active');

            const res = bunny.feed(foodType);
            this.updateStatsUI();

            bunny.animState = 'happy';
            this.renderBunnySVG();
            window.sound.purr();
            this.showSpeechBubble(res.message);

            if (res.growth) {
                this.handleGrowthEvent(bunny, res.growth);
            }
            this.saveGame();
        }, 2200);

        // 6단계: 레이어 정리 및 원복
        setTimeout(() => {
            layer.style.display = 'none';
            heldFood.className = 'feeding-held-food';
            this.isFeeding = false;
            bunny.animState = 'idle';
            this.renderBunnySVG();
        }, 2800);
    }

    // 먹이 갉아먹을 때 부스러기 파티클
    spawnCrumbs(foodType) {
        const container = document.getElementById('food-crumbs');
        if (!container) return;

        const colors = {
            carrot: '#FF7F50',
            hay: '#DDA15E',
            strawberry: '#E63946',
            clover: '#52B788'
        };
        const color = colors[foodType] || '#FF7F50';

        for (let i = 0; i < 4; i++) {
            const p = document.createElement('div');
            p.className = 'crumb-particle';
            p.style.backgroundColor = color;
            p.style.left = `calc(50% + ${(Math.random() - 0.5) * 50}px)`;
            p.style.bottom = `120px`;
            p.style.setProperty('--cx', `${(Math.random() - 0.5) * 40}px`);
            container.appendChild(p);
            setTimeout(() => p.remove(), 700);
        }
    }

    // 장난감으로 놀아주기
    handlePlayAction() {
        const bunny = this.getCurrentBunny();
        const res = bunny.play('ball');
        if (!res.success) {
            window.sound.pop();
            this.showToast(res.message);
            return;
        }

        window.sound.jingle();
        window.sound.boing();
        this.triggerBunnyAnimation('jumping', 1300);

        this.coins += 5;
        this.updateStatsUI();
        this.updateCoinUI();
        this.showSpeechBubble(res.message);

        if (res.growth) {
            this.handleGrowthEvent(bunny, res.growth);
        }
        this.saveGame();
    }

    // 낮잠 / 휴식
    handleSleepAction() {
        const bunny = this.getCurrentBunny();
        window.sound.purr();
        this.triggerBunnyAnimation('sleeping', 2600);
        const res = bunny.rest();
        this.updateStatsUI();
        this.showSpeechBubble(res.message);
        this.saveGame();
    }

    // 애니메이션 트리거
    triggerBunnyAnimation(animName, duration = 1500) {
        const bunny = this.getCurrentBunny();
        bunny.animState = animName;
        this.renderBunnySVG();

        clearTimeout(this.animTimer);
        this.animTimer = setTimeout(() => {
            bunny.animState = 'idle';
            this.renderBunnySVG();
        }, duration);
    }

    // 말풍선 대화 표시
    showSpeechBubble(text, duration = 3000) {
        const bubble = document.getElementById('bunny-speech-bubble');
        if (!bubble) return;
        bubble.textContent = text;
        bubble.classList.add('active');

        clearTimeout(this.bubbleTimer);
        this.bubbleTimer = setTimeout(() => {
            bubble.classList.remove('active');
        }, duration);
    }

    // 토끼 성장 진화 이벤트
    handleGrowthEvent(bunny, eventType) {
        window.sound.fanfare();
        const stageName = bunny.stage === 'junior' ? '어린 토끼' : '성체 토끼';
        this.showToast(`🎉 축하합니다! ${bunny.name}이(가) ${stageName}(으)로 훌륭하게 성장했어요! ✨`);
        this.renderProfile();
        this.renderBunnySVG();
        this.saveGame();
    }

    // 토스트 팝업
    showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    // ★ 3. 친밀도 제한 없는 데이트와 짝짓기 (언제든 데이트 -> 꽃밭 씬 -> 즉시 짝짓기)
    openMateModal() {
        window.sound.pop();
        const currentBunny = this.getCurrentBunny();

        // 성장 단계 검사
        if (currentBunny.stage !== 'adult') {
            this.showToast(`아직 아기/어린이 토끼예요! 성체 토끼로 성장하면 짝짓기와 데이트를 할 수 있어요. 🥕`);
            return;
        }
        if (currentBunny.isPregnant) {
            this.showToast('현재 아기 토끼를 임신 중이에요! 곧 출산해요. 🍼');
            return;
        }

        const container = document.getElementById('mate-candidates-container');
        if (!container) return;
        container.innerHTML = '';

        // 1. 우리 가족 내 다른 성체 토끼들
        const familyPartners = this.bunnies.filter(b => b.id !== currentBunny.id && b.stage === 'adult');
        familyPartners.forEach(partner => {
            const card = document.createElement('div');
            card.className = 'mate-candidate-card';
            card.innerHTML = `
                <div style="width: 55px; height: 55px;">${generateBunnySVG(partner)}</div>
                <div style="flex: 1;">
                    <strong>${partner.name} (${partner.getBreed().name})</strong>
                    <div style="font-size: 0.75rem; color: #888;">성별: ${partner.gender === 'female' ? '암컷 ♀' : '수컷 ♂'} | 가족 토끼</div>
                </div>
                <button class="pill-btn" style="background: #FF477E; color: white;">데이트하기 💖</button>
            `;
            card.addEventListener('click', () => this.startDatingScene(currentBunny, partner));
            container.appendChild(card);
        });

        // 2. 마을의 멋진 토끼들 (초대 데이트 - 항상 언제든 가능!)
        const villageBunnies = [
            { name: '로미오 (마을 토끼)', breedId: 'pink_blush', pattern: 'heart', gender: currentBunny.gender === 'female' ? 'male' : 'female' },
            { name: '캐러멜 (마을 토끼)', breedId: 'dutch_cookie', pattern: 'spots', gender: currentBunny.gender === 'female' ? 'male' : 'female' },
            { name: '스타 (마을 토끼)', breedId: 'golden_honey', pattern: 'star', gender: currentBunny.gender === 'female' ? 'male' : 'female' }
        ];

        villageBunnies.forEach(vb => {
            const tempBunny = new Bunny({ name: vb.name, breedId: vb.breedId, pattern: vb.pattern, stage: 'adult', gender: vb.gender });
            const card = document.createElement('div');
            card.className = 'mate-candidate-card';
            card.innerHTML = `
                <div style="width: 55px; height: 55px;">${generateBunnySVG(tempBunny)}</div>
                <div style="flex: 1;">
                    <strong>${vb.name}</strong>
                    <div style="font-size: 0.75rem; color: #888;">품종: ${tempBunny.getBreed().name} | 마을 이웃</div>
                </div>
                <button class="pill-btn" style="background: #FF7597; color: white;">설레는 데이트 💌</button>
            `;
            card.addEventListener('click', () => this.startDatingScene(currentBunny, tempBunny));
            container.appendChild(card);
        });

        this.openModal('modal-mate');
    }

    // 설레는 꽃밭 데이트 인터랙티브 연출 씬
    startDatingScene(bunny1, partner) {
        this.selectedMatePartner = partner;
        window.sound.love();
        this.closeAllModals();

        const modal = document.getElementById('modal-date-scene');
        const leftBox = document.getElementById('date-bunny-left');
        const rightBox = document.getElementById('date-bunny-right');
        const dialogue = document.getElementById('date-dialogue-box');

        if (!modal || !leftBox || !rightBox) return;

        leftBox.innerHTML = generateBunnySVG(bunny1);
        rightBox.innerHTML = generateBunnySVG(partner);

        dialogue.textContent = `🌸 ${bunny1.name}와(과) ${partner.name}이(가) 꽃잎 흩날리는 정원에서 함께 뛰놀고 있어요! 💕`;

        modal.classList.add('active');

        // 1초 뒤 코 맞대기 대사
        setTimeout(() => {
            dialogue.textContent = `두 토끼가 서로 냄새를 킁킁 맡으며 마음을 열었어요! 이제 바로 짝짓기가 가능합니다. ✨`;
        }, 1500);
    }

    // 짝짓기 바로 실행 (친밀도 조건 완전 없음!)
    executeMatingNow(bunny1, partner) {
        const res = bunny1.mateWith(partner);
        if (!res.success) {
            this.showToast(res.message);
            return;
        }

        window.sound.fanfare();
        this.closeAllModals();
        this.showToast(`💖 짝짓기 성공! 아기 토끼를 임신했습니다! 얼마 후 출산해요. 🍼`);
        this.renderBunnySVG();
        this.updateStatusBanner();
        this.saveGame();
    }

    // 즉시 출산 보기 (테스트 및 빠른 진행용)
    speedUpPregnancy() {
        const bunny = this.getCurrentBunny();
        if (!bunny.isPregnant) return;
        bunny.pregnancyTimer = 1;
        this.showToast('배가 갑자기 빠르게 불러왔어요! 곧 아기가 태어납니다! ✨');
    }

    // 출산 이벤트 발생 (1~4마리 아기 탄생 & 부모 유전)
    triggerBirthEvent(motherBunny) {
        window.sound.fanfare();
        const babies = motherBunny.giveBirth();

        babies.forEach(baby => {
            if (!this.unlockedBreeds.includes(baby.breedId)) {
                this.unlockedBreeds.push(baby.breedId);
            }
        });

        const modal = document.getElementById('modal-birth');
        const container = document.getElementById('birth-babies-container');
        if (!modal || !container) return;

        container.innerHTML = '';
        babies.forEach((baby, idx) => {
            const card = document.createElement('div');
            card.className = 'baby-naming-card';
            card.innerHTML = `
                <div class="baby-naming-preview">${generateBunnySVG(baby)}</div>
                <span style="font-size: 0.75rem; font-weight: 700; color: #FF477E; margin-top: 4px;">
                    ${baby.gender === 'female' ? '공주 ♀' : '왕자 ♂'} (${baby.getBreed().name})
                </span>
                <input type="text" class="baby-name-input" id="baby-input-${idx}" value="아기토끼${idx + 1}" maxlength="8" />
            `;
            container.appendChild(card);
        });

        const confirmBtn = document.getElementById('btn-confirm-birth');
        confirmBtn.onclick = () => {
            window.sound.pop();
            babies.forEach((baby, idx) => {
                const input = document.getElementById(`baby-input-${idx}`);
                if (input && input.value.trim()) {
                    baby.name = input.value.trim().substring(0, 8);
                }
                this.bunnies.push(baby);
            });

            this.closeAllModals();
            this.renderProfile();
            this.renderBunnySVG();
            this.renderBabyBunniesInRoom();
            this.updateStatusBanner();
            this.saveGame();
            this.showToast(`🎉 ${babies.length}마리의 사랑스러운 아기 토끼가 엄마 곁에 나타났어요! 🍼`);
        };

        this.openModal('modal-birth');
    }

    // 산책 시스템 (Walk Adventure)
    resetWalkSelectScreen() {
        document.getElementById('walk-select-view').style.display = 'block';
        document.getElementById('walk-adventure-view').style.display = 'none';
    }

    startWalkAdventure(place) {
        const bunny = this.getCurrentBunny();
        if (bunny.energy < 20) {
            this.showToast('에너지가 부족해서 산책을 갈 수 없어요! 낮잠을 재워 주세요. 💤');
            return;
        }

        bunny.energy = Math.max(0, bunny.energy - 20);
        this.walkState = {
            active: true,
            place: place,
            progress: 0,
            foundItems: []
        };

        window.sound.boing();
        document.getElementById('walk-select-view').style.display = 'none';
        const advView = document.getElementById('walk-adventure-view');
        advView.style.display = 'block';

        const placeNames = { garden: '비밀 벚꽃 정원 🌸', meadow: '알록달록 무지개 꽃밭 🌼', forest: '신비로운 요정의 숲 🌲' };
        document.getElementById('walk-hud-place').textContent = placeNames[place] || place;

        const scroller = document.getElementById('walk-bg-scroller');
        scroller.className = `walk-bg-scroller walk-${place}-bg`;

        const runner = document.getElementById('walk-bunny-runner');
        runner.innerHTML = generateBunnySVG(bunny, { animState: 'jumping' });

        this.updateWalkHUD();

        clearInterval(this.walkState.interval);
        this.walkState.interval = setInterval(() => {
            this.walkState.progress += 8;
            this.updateWalkHUD();

            if (Math.random() > 0.45 && !document.querySelector('.walk-item-spawn')) {
                this.spawnWalkItem();
            }

            if (this.walkState.progress >= 100) {
                this.finishWalkAdventure();
            }
        }, 1000);
    }

    spawnWalkItem() {
        const screen = document.getElementById('walk-adventure-screen');
        if (!screen || document.querySelector('.walk-item-spawn')) return;

        const items = [
            { type: 'coin', icon: '💰', name: '반짝이는 금화', value: 45 },
            { type: 'clover', icon: '🍀', name: '행운의 네잎클로버', food: 'clover' },
            { type: 'strawberry', icon: '🍓', name: '달콤한 야생 딸기', food: 'strawberry' },
            { type: 'gift', icon: '🎁', name: '요정의 선물 상자', value: 75 }
        ];
        const item = items[Math.floor(Math.random() * items.length)];

        const elem = document.createElement('div');
        elem.className = 'walk-item-spawn';
        elem.textContent = item.icon;
        elem.title = '클릭해서 획득하세요!';

        elem.addEventListener('click', () => {
            window.sound.coin();
            if (item.value) {
                this.coins += item.value;
                this.updateCoinUI();
                this.showToast(`산책 중 ${item.name}을(를) 발견하여 코인 ${item.value}개를 얻었어요! 🪙`);
            }
            if (item.food) {
                this.inventory.foods[item.food] = (this.inventory.foods[item.food] || 0) + 1;
                this.updateStockUI();
                this.showToast(`산책 중 싱싱한 ${item.name}을(를) 1개 얻었어요! 🌿`);
            }
            elem.remove();
        });

        screen.appendChild(elem);
        setTimeout(() => elem.remove(), 4000);
    }

    updateWalkHUD() {
        const hudProg = document.getElementById('walk-hud-prog');
        if (hudProg) {
            hudProg.textContent = `${Math.min(100, Math.floor(this.walkState.progress))}%`;
        }
    }

    finishWalkAdventure() {
        clearInterval(this.walkState.interval);
        this.walkState.active = false;

        const bunny = this.getCurrentBunny();
        bunny.mood = 100;
        bunny.addExp(45);

        this.coins += 40;
        this.updateCoinUI();
        this.updateStatsUI();
        window.sound.fanfare();

        this.showToast(`산책 완주 성공! 코인 +40, 기분 100%, 성장 경험치를 얻었습니다! 💖`);
        setTimeout(() => {
            this.resetWalkSelectScreen();
            this.closeAllModals();
        }, 1500);
    }

    endWalkAdventure(cancelled = true) {
        clearInterval(this.walkState.interval);
        this.walkState.active = false;
        if (cancelled) {
            this.resetWalkSelectScreen();
        }
    }

    // 가족 목록 렌더링
    renderFamilyHub() {
        const list = document.getElementById('family-bunnies-list');
        if (!list) return;
        list.innerHTML = '';

        this.bunnies.forEach(bunny => {
            const isActive = bunny.id === this.currentBunnyId;
            const card = document.createElement('div');
            card.className = `family-card ${isActive ? 'active-bunny' : ''}`;

            const parentInfo = (bunny.fatherName || bunny.motherName)
                ? `부모: ${bunny.fatherName || '?'} & ${bunny.motherName || '?'}`
                : '1세대 시조 토끼';

            card.innerHTML = `
                <div class="family-bunny-mini">
                    <div style="width: 55px; height: 55px;">${generateBunnySVG(bunny)}</div>
                </div>
                <div class="family-info">
                    <h4>
                        ${bunny.name} 
                        <span class="gender-badge ${bunny.gender}">${bunny.gender === 'female' ? '♀' : '♂'}</span>
                        ${isActive ? '<span style="font-size: 0.7rem; color: #FF477E; background: #FFE5EC; padding: 2px 6px; border-radius: 8px;">돌보는 중</span>' : ''}
                    </h4>
                    <div class="family-details">
                        단계: <strong>${bunny.stage === 'baby' ? '아기' : (bunny.stage === 'junior' ? '어린이' : '성체')}</strong> | 품종: ${bunny.getBreed().name}<br/>
                        ${parentInfo} | 자식: ${bunny.childrenCount || 0}마리
                    </div>
                </div>
                <div class="family-actions">
                    ${!isActive ? `<button class="pill-btn switch-btn">선택</button>` : ''}
                </div>
            `;

            const switchBtn = card.querySelector('.switch-btn');
            if (switchBtn) {
                switchBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.currentBunnyId = bunny.id;
                    this.renderAll();
                    this.renderFamilyHub();
                    this.showToast(`이제 ${bunny.name}을(를) 돌봅니다! 🐰`);
                    window.sound.pop();
                });
            }

            list.appendChild(card);
        });
    }

    // 도감 렌더링
    renderDex() {
        const grid = document.getElementById('dex-grid');
        if (!grid) return;
        grid.innerHTML = '';

        Object.values(BUNNY_BREEDS).forEach(breed => {
            const isUnlocked = this.unlockedBreeds.includes(breed.id);
            const dummyBunny = new Bunny({ breedId: breed.id, stage: 'adult' });

            const card = document.createElement('div');
            card.className = `dex-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            card.innerHTML = `
                <div class="dex-card-preview">
                    ${generateBunnySVG(dummyBunny)}
                </div>
                <div class="dex-name">${isUnlocked ? breed.name : '???'}</div>
                <div class="dex-rarity rarity-${breed.rarity}">${breed.rarity}</div>
                <div class="dex-desc">${isUnlocked ? breed.description : '산책이나 번식을 통해 발견해 보세요!'}</div>
            `;
            grid.appendChild(card);
        });
    }

    // 상점 렌더링
    renderShop(tab = 'foods') {
        const grid = document.getElementById('shop-items-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const shopCatalog = {
            foods: [
                { id: 'carrot', name: '아삭 당근 3개', price: 20, icon: '🥕', desc: '배고픔 +25, 건강 +10', category: 'food', giveItem: 'carrot', qty: 3 },
                { id: 'hay', name: '알파파 건초 2개', price: 30, icon: '🌾', desc: '배고픔 +35, 건강 +18', category: 'food', giveItem: 'hay', qty: 2 },
                { id: 'strawberry', name: '달콤 딸기 2개', price: 50, icon: '🍓', desc: '기분 +35, 행복 듬뿍', category: 'food', giveItem: 'strawberry', qty: 2 },
                { id: 'clover', name: '네잎클로버 2개', price: 60, icon: '🍀', desc: '행운 만점, 경험치 대폭 상승', category: 'food', giveItem: 'clover', qty: 2 }
            ],
            acc: [
                { id: 'ribbon', name: '러블리 핑크 리본', price: 80, icon: '🎀', desc: '토끼 귀 옆에 달아주는 깜찍한 리본', category: 'acc' },
                { id: 'flower', name: '알록달록 꽃 화관', price: 100, icon: '🌸', desc: '정원의 꽃을 엮어 만든 향기로운 화관', category: 'acc' },
                { id: 'carrot_pin', name: '당근 머리핀', price: 70, icon: '🥕', desc: '상큼 발랄한 당근 모양 헤어핀', category: 'acc' },
                { id: 'crown', name: '미니 골드 왕관', price: 150, icon: '👑', desc: '고귀하고 품격 있는 황금 미니 크라운', category: 'acc' },
                { id: 'glasses', name: '핑크 앤틱 안경', price: 90, icon: '👓', desc: '똑똑하고 귀여운 학구파 토끼 안경', category: 'acc' }
            ],
            decor: [
                { id: 'theme_garden', name: '초록 숲 테마 룸', price: 120, icon: '🌿', desc: '싱그러운 숲속 피크닉 분위기', category: 'theme', themeKey: 'garden' },
                { id: 'theme_strawberry', name: '딸기 퐁당 테마 룸', price: 120, icon: '🍰', desc: '달콤한 핑크빛 딸기 베리 룸', category: 'theme', themeKey: 'strawberry' },
                { id: 'theme_lavender', name: '라벤더 꿈 테마 룸', price: 120, icon: '🔮', desc: '신비롭고 은은한 보랏빛 방', category: 'theme', themeKey: 'lavender' }
            ]
        };

        const items = shopCatalog[tab] || shopCatalog.foods;
        const currentBunny = this.getCurrentBunny();

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-item-card';

            let isOwned = false;
            let isEquipped = false;

            if (item.category === 'acc') {
                isOwned = this.inventory.accessories.includes(item.id);
                isEquipped = currentBunny.accessory === item.id;
            } else if (item.category === 'theme') {
                isOwned = this.inventory.themes.includes(item.themeKey);
                isEquipped = this.roomTheme === item.themeKey;
            }

            let btnHtml = '';
            if (isEquipped) {
                btnHtml = `<button class="buy-btn" style="background:#52B788;" disabled>착용 중 ✅</button>`;
            } else if (isOwned) {
                btnHtml = `<button class="buy-btn equip-btn" style="background:#4EA8DE;">적용하기 ✨</button>`;
            } else {
                btnHtml = `<button class="buy-btn buy-now-btn" ${this.coins < item.price ? 'disabled' : ''}>구매하기</button>`;
            }

            card.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-title">${item.name}</div>
                <div class="shop-item-desc">${item.desc}</div>
                <div class="shop-item-price">🪙 ${item.price} 코인</div>
                ${btnHtml}
            `;

            const buyBtn = card.querySelector('.buy-now-btn');
            if (buyBtn) {
                buyBtn.addEventListener('click', () => this.buyShopItem(item, tab));
            }

            const equipBtn = card.querySelector('.equip-btn');
            if (equipBtn) {
                equipBtn.addEventListener('click', () => {
                    if (item.category === 'acc') {
                        currentBunny.accessory = item.id;
                        this.renderBunnySVG();
                        this.showToast(`${item.name}을(를) 착용했어요! 귀여움 폭발! 💕`);
                    } else if (item.category === 'theme') {
                        this.roomTheme = item.themeKey;
                        this.updateRoomTheme();
                        this.showToast(`방 분위기가 새롭게 바뀌었어요! 🏡`);
                    }
                    window.sound.pop();
                    this.saveGame();
                    this.renderShop(tab);
                });
            }

            grid.appendChild(card);
        });
    }

    buyShopItem(item, currentTab) {
        if (this.coins < item.price) {
            this.showToast('코인이 부족해요! 산책이나 토끼를 돌보아 코인을 모아보세요. 🪙');
            return;
        }

        this.coins -= item.price;
        window.sound.coin();

        if (item.category === 'food') {
            this.inventory.foods[item.giveItem] = (this.inventory.foods[item.giveItem] || 0) + item.qty;
            this.updateStockUI();
            this.showToast(`${item.name}을(를) 구매했습니다! 🥕`);
        } else if (item.category === 'acc') {
            if (!this.inventory.accessories.includes(item.id)) {
                this.inventory.accessories.push(item.id);
            }
            this.getCurrentBunny().accessory = item.id;
            this.renderBunnySVG();
            this.showToast(`${item.name}을(를) 구매하고 즉시 착용했어요! 🎀`);
        } else if (item.category === 'theme') {
            if (!this.inventory.themes.includes(item.themeKey)) {
                this.inventory.themes.push(item.themeKey);
            }
            this.roomTheme = item.themeKey;
            this.updateRoomTheme();
            this.showToast(`${item.name}을(를) 구매하여 방을 꾸몄습니다! 🎨`);
        }

        this.updateCoinUI();
        this.saveGame();
        this.renderShop(currentTab);
    }

    updateRoomTheme() {
        const room = document.getElementById('stage-room');
        if (!room) return;
        room.classList.remove('theme-garden', 'theme-strawberry', 'theme-lavender');
        if (this.roomTheme && this.roomTheme !== 'default') {
            room.classList.add(`theme-${this.roomTheme}`);
        }
    }

    // UI 전체 렌더링
    renderAll() {
        this.renderProfile();
        this.renderBunnySVG();
        this.renderBabyBunniesInRoom();
        this.updateStatsUI();
        this.updateStockUI();
        this.updateCoinUI();
        this.updateStatusBanner();
        this.updateRoomTheme();
    }

    renderProfile() {
        const bunny = this.getCurrentBunny();
        const nameEl = document.getElementById('bunny-display-name');
        const stageEl = document.getElementById('bunny-stage-badge');
        const genderEl = document.getElementById('bunny-gender-badge');

        if (nameEl) nameEl.textContent = bunny.name;
        if (stageEl) {
            stageEl.className = `stage-badge stage-${bunny.stage}`;
            stageEl.textContent = bunny.stage === 'baby' ? '🐣 아기 토끼' : (bunny.stage === 'junior' ? '🐇 어린이 토끼' : '👑 성체 토끼');
        }
        if (genderEl) {
            genderEl.className = `gender-badge ${bunny.gender}`;
            genderEl.textContent = bunny.gender === 'female' ? '♀ 공주' : '♂ 왕자';
        }
    }

    renderBunnySVG() {
        const wrapper = document.getElementById('bunny-wrapper');
        if (!wrapper) return;
        const bunny = this.getCurrentBunny();
        wrapper.innerHTML = generateBunnySVG(bunny, { animState: bunny.animState });
    }

    // ★ 출산으로 생긴 아기 토끼들을 엄마 곁에 작고 귀엽게 함께 렌더링 & 각자 독립 자율 행동
    renderBabyBunniesInRoom() {
        const container = document.getElementById('baby-bunnies-container');
        if (!container) return;
        container.innerHTML = '';

        const currentBunny = this.getCurrentBunny();
        if (!currentBunny) return;

        // 현재 토끼의 자식이거나, 가족 목록 중 아기 토끼들
        let babies = this.bunnies.filter(b => b.id !== currentBunny.id && b.stage === 'baby' && (b.motherName === currentBunny.name || b.fatherName === currentBunny.name));
        
        // 부모 이름이 명시적으로 같지 않더라도 현재 가족에 아기 토끼들이 있으면 엄마 곁에 함께 배치
        if (babies.length === 0) {
            babies = this.bunnies.filter(b => b.id !== currentBunny.id && b.stage === 'baby');
        }

        if (babies.length === 0) return;

        const parentWrapper = document.getElementById('bunny-wrapper');
        const parentLeft = parseFloat(parentWrapper?.style.left || '50');
        const offsets = [-14, 15, -24, 25];

        babies.slice(0, 4).forEach((baby, idx) => {
            const babyEl = document.createElement('div');
            const targetLeft = Math.max(8, Math.min(90, parentLeft + (offsets[idx % offsets.length])));
            babyEl.style.left = `${targetLeft}%`;
            babyEl.className = 'baby-bunny-wrapper-item state-idle';
            babyEl.innerHTML = generateBabyBunnySVG(baby, idx, babies.length);

            // 아기 토끼 클릭 시 앙증맞은 반응
            babyEl.addEventListener('click', (e) => {
                e.stopPropagation();
                window.sound.pop();
                const rect = babyEl.getBoundingClientRect();
                this.spawnHeartParticle(rect.left + rect.width / 2, rect.top + rect.height / 2);
                this.showSpeechBubble(`🍼 ${baby.name}이(가) 신나게 꼬물거리며 애교를 부려요! 💕`, 2200);
                this.showToast(`👶 아기 토끼 '${baby.name}'을(를) 다정하게 쓰다듬어 주었어요!`);
            });

            container.appendChild(babyEl);

            // ★ 각 아기 토끼마다 독립된 자율 행동 스케줄러 시작
            this.scheduleBabyAutonomousAction(babyEl, idx);
        });
    }

    // 아기 토끼 개별 자율 행동 스케줄러 (깡총깡총 뛰기, 천천히 걷기, 주변 살피기, 코 킁킁, 따라다니기)
    scheduleBabyAutonomousAction(babyEl, babyIdx) {
        if (!babyEl || !babyEl.isConnected) return;

        // 아기마다 2.0초 ~ 4.8초 사이의 독립적인 무작위 주기
        const nextDelay = 2000 + Math.random() * 2800;
        setTimeout(() => {
            if (!babyEl || !babyEl.isConnected) return;
            this.performRandomBabyAction(babyEl, babyIdx);
            this.scheduleBabyAutonomousAction(babyEl, babyIdx);
        }, nextDelay);
    }

    performRandomBabyAction(babyEl, babyIdx) {
        if (!babyEl || !babyEl.isConnected || this.isFeeding) return;

        // 5가지 다양한 무작위 행동 선택
        const actions = ['hop', 'walk', 'look', 'sniff', 'follow'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        const parentWrapper = document.getElementById('bunny-wrapper');
        const parentLeft = parseFloat(parentWrapper?.style.left || '50');
        const currentLeft = parseFloat(babyEl.style.left || parentLeft);

        babyEl.classList.remove('state-hop', 'state-walk', 'state-look', 'state-sniff', 'state-idle');

        if (action === 'hop') {
            // 1. 깡총깡총 뛰기: 주변으로 통통 튀며 이동
            const dir = Math.random() > 0.5 ? 1 : -1;
            const dist = 7 + Math.random() * 14;
            const targetLeft = Math.max(8, Math.min(92, currentLeft + (dir * dist)));

            babyEl.style.transform = `scaleX(${dir > 0 ? 1 : -1})`;
            babyEl.classList.add('state-hop');
            babyEl.style.left = `${targetLeft}%`;

            setTimeout(() => {
                if (babyEl.isConnected) {
                    babyEl.classList.remove('state-hop');
                    babyEl.classList.add('state-idle');
                }
            }, 700);
        } else if (action === 'walk') {
            // 2. 아장아장 천천히 걷기
            const dir = Math.random() > 0.5 ? 1 : -1;
            const dist = 4 + Math.random() * 7;
            const targetLeft = Math.max(8, Math.min(92, currentLeft + (dir * dist)));

            babyEl.style.transform = `scaleX(${dir > 0 ? 1 : -1})`;
            babyEl.classList.add('state-walk');
            babyEl.style.left = `${targetLeft}%`;

            setTimeout(() => {
                if (babyEl.isConnected) {
                    babyEl.classList.remove('state-walk');
                    babyEl.classList.add('state-idle');
                }
            }, 1200);
        } else if (action === 'look') {
            // 3. 멈춰서 귀 쫑긋거리며 주변 살펴보기
            babyEl.classList.add('state-look');
            setTimeout(() => {
                if (babyEl.isConnected) {
                    babyEl.classList.remove('state-look');
                    babyEl.classList.add('state-idle');
                }
            }, 1600);
        } else if (action === 'sniff') {
            // 4. 코 씰룩거리며 바닥 킁킁 냄새 맡기
            babyEl.classList.add('state-sniff');
            setTimeout(() => {
                if (babyEl.isConnected) {
                    babyEl.classList.remove('state-sniff');
                    babyEl.classList.add('state-idle');
                }
            }, 1200);
        } else if (action === 'follow') {
            // 5. 엄마 토끼나 형제 뒤를 쪼르르 쫓아가기
            const offsets = [-14, 15, -22, 24];
            const targetLeft = Math.max(8, Math.min(90, parentLeft + (offsets[babyIdx % offsets.length])));
            const dir = targetLeft >= currentLeft ? 1 : -1;

            babyEl.style.transform = `scaleX(${dir})`;
            babyEl.classList.add('state-hop');
            babyEl.style.left = `${targetLeft}%`;

            setTimeout(() => {
                if (babyEl.isConnected) {
                    babyEl.classList.remove('state-hop');
                    babyEl.classList.add('state-idle');
                }
            }, 750);
        }
    }

    // 4대 스탯 갱신 (친밀도 게이지 완전 제외)
    updateStatsUI() {
        const bunny = this.getCurrentBunny();
        if (!bunny) return;

        const updateBar = (id, val) => {
            const bar = document.getElementById(`bar-${id}`);
            const text = document.getElementById(`num-${id}`);
            const rounded = Math.round(val);
            if (bar) bar.style.width = `${rounded}%`;
            if (text) text.textContent = `${rounded}%`;
        };

        updateBar('hunger', bunny.hunger);
        updateBar('mood', bunny.mood);
        updateBar('health', bunny.health);
        updateBar('energy', bunny.energy);

        // 성장 경험치 바
        const expBar = document.getElementById('growth-bar-fill');
        const expText = document.getElementById('growth-text');
        if (expBar && expText) {
            const maxExp = bunny.getMaxExp();
            const pct = Math.min(100, Math.round((bunny.exp / maxExp) * 100));
            expBar.style.width = `${pct}%`;
            if (bunny.stage === 'adult') {
                expText.textContent = `성체 만렙 달성 👑`;
            } else {
                expText.textContent = `성장 중: ${pct}% (${bunny.exp}/${maxExp})`;
            }
        }
    }

    // 좌측 먹이 보관함 수량 갱신
    updateStockUI() {
        const foods = this.inventory.foods || {};
        const setStock = (id, count) => {
            const el = document.getElementById(`stock-${id}`);
            if (el) el.textContent = `${count}개`;
        };
        setStock('carrot', foods.carrot || 0);
        setStock('hay', foods.hay || 0);
        setStock('strawberry', foods.strawberry || 0);
        setStock('clover', foods.clover || 0);
    }

    updateCoinUI() {
        const el = document.getElementById('coin-display');
        if (el) el.textContent = this.coins;
    }

    updateStatusBanner() {
        const banner = document.getElementById('status-banner');
        if (!banner) return;
        const bunny = this.getCurrentBunny();

        if (bunny.isPregnant) {
            banner.style.display = 'flex';
            banner.className = 'status-banner pregnant-banner';
            banner.innerHTML = `
                <span>💖 아기 토끼 임신 중! (출산 예정: <strong>${Math.ceil(bunny.pregnancyTimer)}초</strong>)</span>
                <button class="status-banner-btn" id="btn-speed-birth">즉시 출산 🍼</button>
            `;
            const btn = document.getElementById('btn-speed-birth');
            if (btn) btn.onclick = () => this.speedUpPregnancy();
        } else if (bunny.hunger < 25) {
            banner.style.display = 'flex';
            banner.className = 'status-banner';
            banner.innerHTML = `
                <span>🥕 배가 많이 고파요! 먹이 보관함에서 밥을 주세요.</span>
                <button class="status-banner-btn" onclick="document.getElementById('action-feed').click()">밥 주기</button>
            `;
        } else if (bunny.energy < 20) {
            banner.style.display = 'flex';
            banner.className = 'status-banner';
            banner.innerHTML = `
                <span>💤 피곤해서 졸려하고 있어요. 낮잠을 재워 주세요.</span>
                <button class="status-banner-btn" onclick="document.getElementById('action-sleep').click()">낮잠 재우기</button>
            `;
        } else {
            banner.style.display = 'none';
        }
    }
}

// 게임 인스턴스 실행
window.addEventListener('DOMContentLoaded', () => {
    window.game = new BunnyCareGame();
});
