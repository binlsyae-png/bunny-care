// Bunny Model, Genetics, and SVG Generator

// 털 색상 프리셋
const BUNNY_BREEDS = {
    'snow_white': {
        id: 'snow_white',
        name: '스노우 화이트',
        color: '#FFFFFF',
        innerEar: '#FFD1DC',
        shadow: '#E8E8EE',
        belly: '#FFFFFF',
        description: '눈처럼 새하얗고 순수한 솜사탕 같은 토끼',
        rarity: 'Common'
    },
    'cream_vanilla': {
        id: 'cream_vanilla',
        name: '크림 바닐라',
        color: '#FFF3DC',
        innerEar: '#FFC8C8',
        shadow: '#EEDCBE',
        belly: '#FFFFF2',
        description: '부드러운 바닐라 아이스크림 향기가 날 것 같은 토끼',
        rarity: 'Common'
    },
    'pink_blush': {
        id: 'pink_blush',
        name: '로즈 핑크',
        color: '#FFE2EA',
        innerEar: '#FFAEC0',
        shadow: '#F0C2CE',
        belly: '#FFF5F8',
        description: '달콤한 벚꽃 꽃잎을 닮은 사랑스러운 핑크 토끼',
        rarity: 'Rare'
    },
    'choco_chip': {
        id: 'choco_chip',
        name: '초코 칩',
        color: '#C8A287',
        innerEar: '#E4A596',
        shadow: '#A88267',
        belly: '#EFE0D4',
        description: '진하고 부드러운 밀크초콜릿 빛깔의 장난꾸러기 토끼',
        rarity: 'Uncommon'
    },
    'lavender_mist': {
        id: 'lavender_mist',
        name: '라벤더 미스트',
        color: '#E9E2F8',
        innerEar: '#D6C0F3',
        shadow: '#CEC0EA',
        belly: '#F7F3FF',
        description: '새벽안개 낀 라벤더 정원에서 찾아온 신비로운 토끼',
        rarity: 'Rare'
    },
    'golden_honey': {
        id: 'golden_honey',
        name: '골든 허니',
        color: '#FFE494',
        innerEar: '#FFB899',
        shadow: '#E4C26E',
        belly: '#FFF8DD',
        description: '따사로운 햇살과 달콤한 꿀을 머금은 황금빛 토끼',
        rarity: 'Epic'
    },
    'dutch_cookie': {
        id: 'dutch_cookie',
        name: '쿠키 더치',
        color: '#8C6239',
        innerEar: '#E29578',
        shadow: '#6A431D',
        belly: '#FFFFFF',
        description: '얼굴과 몸에 하얀 띠를 두른 클래식 더치 토끼',
        rarity: 'Uncommon'
    },
    'mint_cloud': {
        id: 'mint_cloud',
        name: '민트 클라우드',
        color: '#D8F3DC',
        innerEar: '#95D5B2',
        shadow: '#B7E4C7',
        belly: '#F1FAEE',
        description: '상쾌한 숲의 기운을 담은 아주 특별한 민트빛 토끼',
        rarity: 'Legendary'
    }
};

// 무늬 종류
const BUNNY_PATTERNS = {
    'none': { name: '단색', id: 'none' },
    'spots': { name: '점박이', id: 'spots' },
    'heart': { name: '이마 하트', id: 'heart' },
    'star': { name: '이마 별자리', id: 'star' }
};

class Bunny {
    constructor(data = {}) {
        this.id = data.id || 'bunny_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        this.name = data.name || '토토';
        this.gender = data.gender || (Math.random() > 0.5 ? 'female' : 'male'); // 'female' | 'male'
        this.stage = data.stage || 'baby'; // 'baby' | 'junior' | 'adult'
        this.ageMinutes = data.ageMinutes || 0; // 활동 시간 (분 단위)
        this.breedId = data.breedId || 'snow_white';
        this.pattern = data.pattern || 'none';
        this.eyeColor = data.eyeColor || (this.breedId === 'pink_blush' ? '#E91E63' : '#4A3B32');
        this.accessory = data.accessory || null; // 'ribbon', 'flower', 'carrot_pin', 'crown', 'glasses'
        
        // 상태 수치 (0 ~ 100)
        this.hunger = data.hunger !== undefined ? data.hunger : 80;     // 배고픔 (높을수록 배부름)
        this.mood = data.mood !== undefined ? data.mood : 90;         // 기분 (높을수록 행복)
        this.health = data.health !== undefined ? data.health : 100;    // 건강
        this.energy = data.energy !== undefined ? data.energy : 85;     // 에너지
        this.exp = data.exp || 0; // 성장 경험치

        // 번식 & 가족 관계
        this.isPregnant = data.isPregnant || false;
        this.pregnancyTimer = data.pregnancyTimer || 0; // 임신 잔여 초 (기본 약 75초)
        this.fatherName = data.fatherName || null;
        this.motherName = data.motherName || null;
        this.generation = data.generation || 1;
        this.childrenCount = data.childrenCount || 0;
        
        // 애니메이션 상태 (다양한 행동 지원)
        // 'idle', 'eating', 'happy', 'sleeping', 'jumping', 'petting', 'grooming', 'sniffing', 'stretching', 'shaking', 'ear_wiggle'
        this.animState = 'idle';
    }

    getBreed() {
        return BUNNY_BREEDS[this.breedId] || BUNNY_BREEDS['snow_white'];
    }

    // 단계별 성장 필요 경험치
    getMaxExp() {
        if (this.stage === 'baby') return 100;
        if (this.stage === 'junior') return 250;
        return 500; // 성체 만렙
    }

    addExp(amount) {
        this.exp += amount;
        const max = this.getMaxExp();
        if (this.stage === 'baby' && this.exp >= max) {
            this.stage = 'junior';
            this.exp = 0;
            return 'grown_junior';
        } else if (this.stage === 'junior' && this.exp >= max) {
            this.stage = 'adult';
            this.exp = 0;
            return 'grown_adult';
        }
        return false;
    }

    // 시간 흐름에 따른 자연 소모 (1초마다 호출)
    tick(seconds = 1) {
        this.ageMinutes += seconds / 60;

        // 자연 감소
        this.hunger = Math.max(0, this.hunger - (0.15 * seconds));
        this.energy = Math.max(0, this.energy - (0.1 * seconds));

        // 배고픔이나 에너지가 너무 낮으면 기분과 건강 감소
        if (this.hunger < 25) {
            this.mood = Math.max(0, this.mood - (0.2 * seconds));
            this.health = Math.max(10, this.health - (0.15 * seconds));
        }
        if (this.energy < 20) {
            this.mood = Math.max(0, this.mood - (0.1 * seconds));
        }

        // 상태가 좋으면 건강 서서히 회복
        if (this.hunger > 60 && this.mood > 60 && this.health < 100) {
            this.health = Math.min(100, this.health + (0.1 * seconds));
        }

        // 임신 진행
        if (this.isPregnant) {
            this.pregnancyTimer = Math.max(0, this.pregnancyTimer - seconds);
            if (this.pregnancyTimer <= 0) {
                return 'give_birth';
            }
        }

        return null;
    }

    // 먹이 주기 (친밀도 제한 없음)
    feed(foodType = 'carrot') {
        const foodMap = {
            'carrot': { hunger: 25, mood: 12, exp: 15, msg: '아삭아삭 당근을 맛있게 먹었어요!' },
            'hay': { hunger: 35, health: 18, mood: 8, exp: 12, msg: '향긋한 건초를 우물우물 씹어 먹었어요.' },
            'strawberry': { hunger: 20, mood: 35, exp: 20, msg: '달콤한 딸기에 눈이 번쩍 뜨였어요! ✨' },
            'clover': { hunger: 15, mood: 25, health: 12, exp: 15, msg: '싱싱한 네잎클로버를 먹고 행복해해요!' }
        };
        const f = foodMap[foodType] || foodMap.carrot;
        this.hunger = Math.min(100, this.hunger + (f.hunger || 0));
        this.mood = Math.min(100, this.mood + (f.mood || 0));
        this.health = Math.min(100, this.health + (f.health || 0));
        const growth = this.addExp(f.exp || 10);
        return { message: f.msg, growth };
    }

    // 쓰다듬기 (다양한 반응 메시지)
    pet(variation = 0) {
        this.mood = Math.min(100, this.mood + 8);
        const growth = this.addExp(5);
        
        const petMsgs = [
            `${this.name}이(가) 기분 좋게 눈을 지그시 감으며 볼을 부벼요! 💕`,
            `${this.name}이(가) 귀를 살짝 뒤로 눕히며 편안하게 몸을 낮춰요. 🌸`,
            `${this.name}이(가) 이를 가볍게 딱딱 부딪히며 행복해해요! ✨`,
            `${this.name}이(가) 고개를 갸웃거리며 더 만져달라고 손을 툭 쳐요. 🥰`
        ];
        const msg = petMsgs[variation % petMsgs.length];

        return {
            message: msg,
            growth
        };
    }

    // 장난감으로 놀기
    play(toyType = 'ball') {
        if (this.energy < 15) {
            return { success: false, message: `${this.name}이(가) 너무 지쳐서 졸려해요. 낮잠이 필요해요! 💤` };
        }
        this.energy = Math.max(0, this.energy - 18);
        this.mood = Math.min(100, this.mood + 25);
        this.hunger = Math.max(0, this.hunger - 10);
        const growth = this.addExp(25);
        return {
            success: true,
            message: `방울 장난감을 깡총깡총 굴리며 신나게 놀았어요! 🎈`,
            growth
        };
    }

    // 휴식 / 낮잠
    rest() {
        this.energy = Math.min(100, this.energy + 40);
        this.health = Math.min(100, this.health + 10);
        this.mood = Math.min(100, this.mood + 10);
        return {
            message: `포근한 침대에서 새근새근 낮잠을 자고 활력을 되찾았어요! 🌙`
        };
    }

    // 짝짓기 (친밀도 제한 완전 배제! 성체이고 임신 중이 아니면 언제든 가능)
    mateWith(partner) {
        if (this.stage !== 'adult') {
            return { success: false, message: `${this.name}이(가) 아직 어려요! 성체 토끼가 되어야 번식할 수 있어요.` };
        }
        if (partner.stage !== 'adult') {
            return { success: false, message: `${partner.name}이(가) 아직 성체가 아니에요.` };
        }
        if (this.isPregnant) {
            return { success: false, message: '현재 아기 토끼를 임신 중이에요! 곧 출산해요.' };
        }
        if (partner.isPregnant) {
            return { success: false, message: '상대 토끼가 이미 임신 중이에요!' };
        }

        // 임신 시작 (친밀도 체크 없음!)
        this.isPregnant = true;
        this.pregnancyTimer = 60; // 60초 카운트다운
        this.matePartnerId = partner.id;
        this.matePartnerBreed = partner.breedId;
        this.matePartnerName = partner.name;
        this.matePartnerPattern = partner.pattern;

        return {
            success: true,
            message: `두 토끼가 코를 맞대며 사랑에 빠졌어요! 얼마 후 귀여운 아기 토끼가 태어날 거예요! 💖`
        };
    }

    // 유전으로 새끼 생성 (1~4마리)
    giveBirth() {
        this.isPregnant = false;
        this.pregnancyTimer = 0;
        this.childrenCount = (this.childrenCount || 0) + 1;

        // 1~4마리 (가장 흔하게 2~3마리)
        const rand = Math.random();
        let numBabies = 1;
        if (rand > 0.85) numBabies = 4;
        else if (rand > 0.45) numBabies = 3;
        else if (rand > 0.15) numBabies = 2;

        const babies = [];
        const partnerBreed = this.matePartnerBreed || 'cream_vanilla';
        const partnerPattern = this.matePartnerPattern || 'none';
        const partnerName = this.matePartnerName || '마을 토끼';

        for (let i = 0; i < numBabies; i++) {
            // 유전 확률: 부모 1 42%, 부모 2 42%, 돌연변이 희귀 16%
            let babyBreed = this.breedId;
            const breedRoll = Math.random();
            if (breedRoll < 0.42) {
                babyBreed = this.breedId;
            } else if (breedRoll < 0.84) {
                babyBreed = partnerBreed;
            } else {
                // 희귀/돌연변이 풀
                const rarePool = ['pink_blush', 'golden_honey', 'lavender_mist', 'dutch_cookie', 'mint_cloud'];
                babyBreed = rarePool[Math.floor(Math.random() * rarePool.length)];
            }

            // 무늬 유전
            let babyPattern = 'none';
            const patternRoll = Math.random();
            if (patternRoll < 0.4) babyPattern = this.pattern;
            else if (patternRoll < 0.8) babyPattern = partnerPattern;
            else {
                const patterns = ['spots', 'heart', 'star'];
                babyPattern = patterns[Math.floor(Math.random() * patterns.length)];
            }

            const baby = new Bunny({
                name: `아기_${Math.floor(Math.random() * 900 + 100)}`,
                gender: Math.random() > 0.5 ? 'female' : 'male',
                stage: 'baby',
                breedId: babyBreed,
                pattern: babyPattern,
                fatherName: this.gender === 'male' ? this.name : partnerName,
                motherName: this.gender === 'female' ? this.name : partnerName,
                generation: (this.generation || 1) + 1,
                hunger: 90,
                mood: 100,
                affection: 30
            });
            babies.push(baby);
        }

        return babies;
    }
}

// 실제 토끼 사진 기반 고화질 포토리얼리스틱 렌더러
function generateBunnySVG(bunny, options = {}) {
    const breed = bunny.getBreed();
    const stage = bunny.stage;
    const animState = options.animState || bunny.animState || 'idle';
    const isPregnant = bunny.isPregnant;

    // 품종별 실제 털색 필터 설정 (과도한 밝기 제거, 자연스럽고 포근한 실사 털색 틴팅)
    const breedFilters = {
        'snow_white': 'contrast(1.04) brightness(0.98)',
        'cream_vanilla': 'sepia(0.22) saturate(1.25) brightness(0.96)',
        'pink_blush': 'sepia(0.15) hue-rotate(325deg) saturate(1.28) brightness(0.97)',
        'choco_chip': 'sepia(0.65) saturate(1.5) brightness(0.72) contrast(1.15)',
        'lavender_mist': 'hue-rotate(240deg) saturate(1.15) brightness(0.96)',
        'golden_honey': 'sepia(0.4) saturate(1.8) hue-rotate(15deg) brightness(0.98)',
        'dutch_cookie': 'sepia(0.7) contrast(1.22) brightness(0.7) saturate(1.3)',
        'mint_cloud': 'hue-rotate(105deg) saturate(1.1) brightness(0.97)'
    };
    const currentFilter = breedFilters[bunny.breedId] || 'none';

    // 단계별 스케일 및 위치 비율
    let scaleVal = 1.0;
    let translateY = 0;
    if (stage === 'baby') {
        scaleVal = 0.84;
        translateY = 18;
    } else if (stage === 'junior') {
        scaleVal = 0.94;
        translateY = 8;
    } else {
        scaleVal = 1.06;
        translateY = -5;
    }

    // 악세서리 (실제 토끼 귀/머리 위치에 정밀 매핑)
    let accessorySVG = '';
    if (bunny.accessory === 'ribbon') {
        accessorySVG = `
        <!-- 분홍 리본 -->
        <g class="bunny-acc bunny-ribbon" transform="translate(192, 70) scale(0.95) rotate(15)">
            <ellipse cx="-16" cy="0" rx="16" ry="11" fill="#FF5E7E" transform="rotate(-20 -16 0)" />
            <ellipse cx="16" cy="0" rx="16" ry="11" fill="#FF5E7E" transform="rotate(20 16 0)" />
            <circle cx="0" cy="0" r="7.5" fill="#FFE2EA" stroke="#FF5E7E" stroke-width="2.5" />
            <path d="M-6,6 Q-12,24 -18,28 Q-8,22 -2,10" fill="#E63946" />
            <path d="M6,6 Q12,24 18,28 Q8,22 2,10" fill="#E63946" />
        </g>`;
    } else if (bunny.accessory === 'flower') {
        accessorySVG = `
        <!-- 꽃 화관 -->
        <g class="bunny-acc bunny-flower" transform="translate(150, 48) scale(0.9)">
            <circle cx="-25" cy="5" r="10" fill="#FFF0F5" stroke="#FFAAA6" stroke-width="2"/>
            <circle cx="-25" cy="5" r="4.5" fill="#FFD166"/>
            <circle cx="0" cy="-2" r="13" fill="#FFD8BE" stroke="#F4A261" stroke-width="2"/>
            <circle cx="0" cy="-2" r="5.5" fill="#E76F51"/>
            <circle cx="25" cy="5" r="10" fill="#E8F5E9" stroke="#81C784" stroke-width="2"/>
            <circle cx="25" cy="5" r="4.5" fill="#FFF176"/>
            <path d="M-12,12 Q-18,18 -10,22 Q-6,18 -12,12" fill="#66BB6A" />
            <path d="M12,12 Q18,18 10,22 Q6,18 12,12" fill="#66BB6A" />
        </g>`;
    } else if (bunny.accessory === 'carrot_pin') {
        accessorySVG = `
        <!-- 당근 머리핀 -->
        <g class="bunny-acc bunny-carrot" transform="translate(196, 68) scale(0.9) rotate(25)">
            <path d="M0,0 Q-9,14 0,30 Q9,14 0,0" fill="#FF7F50" stroke="#E65100" stroke-width="1.8"/>
            <path d="M-2,7 L2,9 M-2,16 L3,18 M-1,23 L2,24" stroke="#E65100" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M0,0 Q-5,-11 -11,-9 Q-5,-4 0,0" fill="#4CAF50"/>
            <path d="M0,0 Q0,-14 5,-14 Q2,-5 0,0" fill="#66BB6A"/>
        </g>`;
    } else if (bunny.accessory === 'crown') {
        accessorySVG = `
        <!-- 미니 골드 왕관 -->
        <g class="bunny-acc bunny-crown" transform="translate(150, 32) scale(0.95)">
            <polygon points="-24,18 -28,-6 -12,8 0,-14 12,8 28,-6 24,18" fill="#FFD166" stroke="#E5A93C" stroke-width="2.5" stroke-linejoin="round"/>
            <circle cx="-28" cy="-6" r="3.5" fill="#EF476F"/>
            <circle cx="0" cy="-14" r="4" fill="#06D6A0"/>
            <circle cx="28" cy="-6" r="3.5" fill="#118AB2"/>
            <circle cx="0" cy="10" r="3" fill="#FFE29A"/>
        </g>`;
    } else if (bunny.accessory === 'glasses') {
        accessorySVG = `
        <!-- 핑크 앤틱 안경 -->
        <g class="bunny-acc bunny-glasses" transform="translate(150, 118) scale(0.92)">
            <circle cx="-28" cy="0" r="15" fill="none" stroke="#FF6B8B" stroke-width="3.5"/>
            <circle cx="28" cy="0" r="15" fill="none" stroke="#FF6B8B" stroke-width="3.5"/>
            <path d="M-13,-2 Q0,-7 13,-2" fill="none" stroke="#FF6B8B" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="-43" y1="-2" x2="-60" y2="-6" stroke="#FF6B8B" stroke-width="3" stroke-linecap="round"/>
            <line x1="43" y1="-2" x2="60" y2="-6" stroke="#FF6B8B" stroke-width="3" stroke-linecap="round"/>
        </g>`;
    }

    // 이마 무늬
    let patternSVG = '';
    if (bunny.pattern === 'heart') {
        patternSVG = `
        <g transform="translate(150, 105) scale(0.9)">
            <path d="M0,-8 C-5,-16 -16,-10 -14,0 C-12,8 0,16 0,16 C0,16 12,8 14,0 C16,-10 5,-16 0,-8 Z" fill="#FF6B8B" opacity="0.85"/>
        </g>`;
    } else if (bunny.pattern === 'star') {
        patternSVG = `
        <g transform="translate(150, 102) scale(0.85)">
            <polygon points="0,-12 3.5,-3.5 12,-3.5 5,2 7.5,10 0,5 -7.5,10 -5,2 -12,-3.5 -3.5,-3.5" fill="#FFD166" opacity="0.9"/>
        </g>`;
    } else if (bunny.pattern === 'spots') {
        patternSVG = `
        <g opacity="0.75">
            <ellipse cx="178" cy="190" rx="14" ry="10" fill="#8C6239" opacity="0.7" transform="rotate(15 178 190)"/>
            <circle cx="120" cy="180" r="10" fill="#8C6239" opacity="0.6"/>
        </g>`;
    }

    // 임신 중 하트 펄스 뱃지
    let pregnantBadge = '';
    if (isPregnant) {
        pregnantBadge = `
        <g class="bunny-pregnant-pulse" transform="translate(150, 230)">
            <circle cx="0" cy="0" r="16" fill="#FF477E" opacity="0.92" filter="drop-shadow(0 2px 5px rgba(255, 71, 126, 0.5))" />
            <path d="M0,5 C-1,2 -8,0 -8,-5 C-8,-9 -3,-11 0,-8 C3,-11 8,-9 8,-5 C8,0 -1,2 0,5 Z" fill="#FFFFFF" transform="scale(0.95) translate(0, 1)"/>
        </g>`;
    }

    // 표정 이펙트 (자연스러운 홍조와 윙크)
    let expressionOverlay = '';
    if (animState === 'aegyo_flop') {
        expressionOverlay = `
        <g class="bunny-aegyo-eyes">
            <ellipse cx="112" cy="126" rx="14" ry="8" fill="#FF477E" opacity="0.45" filter="blur(2px)"/>
            <ellipse cx="188" cy="126" rx="14" ry="8" fill="#FF477E" opacity="0.45" filter="blur(2px)"/>
            <text x="142" y="86" font-size="22">💖</text>
        </g>`;
    } else if (animState === 'aegyo_boop') {
        expressionOverlay = `
        <g class="bunny-aegyo-boop">
            <text x="136" y="85" font-size="24">💋</text>
        </g>`;
    } else if (animState === 'happy' || animState === 'petting' || animState === 'aegyo_binky') {
        expressionOverlay = `
        <g class="bunny-happy-eyes">
            <ellipse cx="112" cy="128" rx="14" ry="8" fill="#FF6B8B" opacity="0.45" filter="blur(2px)"/>
            <ellipse cx="188" cy="128" rx="14" ry="8" fill="#FF6B8B" opacity="0.45" filter="blur(2px)"/>
        </g>`;
    } else if (animState === 'sleeping') {
        expressionOverlay = `
        <g class="bunny-sleeping-eyes">
            <text x="195" y="85" font-family="'Nunito', sans-serif" font-weight="800" font-size="18" fill="#8E7C85" opacity="0.85">Zzz</text>
        </g>`;
    }

    // ★ 100% 완전 투명 알파 채널 실사 토끼 PNG 직접 사용 (새 고유 파일명으로 캐시 원천 방지)
    const imgSrc = 'assets/bunny_pure_transparent_v4.png';

    return `
    <div class="bunny-photoreal-wrapper anim-${animState} stage-${stage}" style="transform: scale(${scaleVal}) translateY(${translateY}px);">
        <!-- 바닥 실제 접촉 그림자 (Contact Shadow & Ambient Shadow) -->
        <div class="bunny-real-ground-shadow"></div>

        <!-- 순수 투명 토끼 본체 (사각형 테두리 및 배경 100% 완전 제거) -->
        <div class="bunny-real-image-box" style="filter: ${currentFilter};">
            <img src="${imgSrc}" alt="${bunny.name}" class="bunny-real-photo" draggable="false" />
        </div>

        <!-- 오버레이 SVG (악세서리, 무늬, 표정, 임신 뱃지) -->
        <svg viewBox="0 0 300 320" class="bunny-overlay-svg" xmlns="http://www.w3.org/2000/svg">
            ${patternSVG}
            ${expressionOverlay}
            ${pregnantBadge}
            ${accessorySVG}
        </svg>
    </div>
    `;
}

// ★ 출산으로 태어난 작고 귀여운 아기 토끼 렌더러 (엄마 토끼 크기의 약 절반, 독립 행동 지원)
function generateBabyBunnySVG(baby, index = 0, totalBabies = 1) {
    const breedFilters = {
        'snow_white': 'none',
        'cream_vanilla': 'sepia(0.2) saturate(1.2) brightness(0.96)',
        'pink_blush': 'sepia(0.12) hue-rotate(325deg) saturate(1.2) brightness(0.97)',
        'choco_chip': 'sepia(0.6) saturate(1.4) brightness(0.72) contrast(1.1)',
        'lavender_mist': 'hue-rotate(240deg) saturate(1.1) brightness(0.96)',
        'golden_honey': 'sepia(0.35) saturate(1.7) hue-rotate(15deg) brightness(0.98)',
        'dutch_cookie': 'sepia(0.65) contrast(1.2) brightness(0.7) saturate(1.2)',
        'mint_cloud': 'hue-rotate(105deg) saturate(1.05) brightness(0.97)'
    };
    const currentFilter = breedFilters[baby.breedId] || 'none';
    const imgSrc = 'assets/bunny_pure_transparent_v4.png';

    return `
    <div class="baby-bunny-body" title="👶 ${baby.name} (아기 토끼)">
        <!-- 아기 바닥 자연스러운 접촉 그림자 -->
        <div class="baby-bunny-shadow"></div>

        <!-- 아기 토끼 본체 (초미니 크기 & 순수 실루엣 투명 PNG) -->
        <div class="baby-bunny-image-box" style="filter: ${currentFilter};">
            <img src="${imgSrc}" alt="${baby.name}" class="bunny-real-photo" draggable="false" />
        </div>

        <!-- 아기 토끼 은은한 핑크 볼터치 오버레이 -->
        <svg viewBox="0 0 300 320" class="baby-overlay-svg" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="112" cy="130" rx="14" ry="8" fill="#FF7597" opacity="0.45" filter="blur(2px)"/>
            <ellipse cx="188" cy="130" rx="14" ry="8" fill="#FF7597" opacity="0.45" filter="blur(2px)"/>
            <text x="140" y="80" font-size="22">🍼</text>
        </svg>

        <!-- 아기 이름표 태그 -->
        <div class="baby-bunny-nametag">${baby.name}</div>
    </div>
    `;
}

window.Bunny = Bunny;
window.BUNNY_BREEDS = BUNNY_BREEDS;
window.BUNNY_PATTERNS = BUNNY_PATTERNS;
window.generateBunnySVG = generateBunnySVG;
window.generateBabyBunnySVG = generateBabyBunnySVG;
