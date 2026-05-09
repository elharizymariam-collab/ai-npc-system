import * as THREE from 'three';
import CharacterController from './characterController.js';
import AnimationStateMachine from './animationStateMachine.js';
import AIBrain from './aiBrain.js';
import SpeechSystem from './speechSystem.js';
import Memory from './memory.js';

class AINPCSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.characterController = null;
        this.animationStateMachine = null;
        this.aiBrain = null;
        this.speechSystem = null;
        this.memory = null;
        
        this.isActive = false;
        this.mouse = { x: 0, y: 0 };
        this.lastTime = performance.now();
        this.audioUnlocked = false;
    }

    async init() {
        console.log('🚀 بدء تشغيل Pooh...');
        this.setupThreeJS();
        await this.setupCharacter();
        this.setupEventListeners();
        this.animate();
    }

    setupThreeJS() {
        const canvas = document.getElementById('canvas');
        
        this.scene = new THREE.Scene();
        
        // ✅ خلفية مع معالجة أخطاء
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            './attachments/background.jpg', 
            (texture) => {
                this.scene.background = texture;
            },
            undefined,
            (error) => {
                console.log('⚠️ Background not found, using color');
                this.scene.background = new THREE.Color(0x1a0a2e);
            }
        );

        // ✅ الكاميرا: فوق وشايلة الروبوت
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 3.5, 12);   // من فوق
        this.camera.lookAt(0, 0, -2);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.scene.add(new THREE.AmbientLight(0x99aaff, 0.9));
        
        const light1 = new THREE.PointLight(0x00ffff, 8, 60);
        light1.position.set(-8, 15, 10);
        this.scene.add(light1);

        const light2 = new THREE.PointLight(0xff88ff, 8, 60);
        light2.position.set(9, 13, -8);
        this.scene.add(light2);
    }

    async setupCharacter() {
        console.log('🔄 جاري تحميل الروبوت...');
        
        this.characterController = new CharacterController(this.scene, this.camera);
        
        try {
            await this.characterController.loadModel('./models/avatar.glb');
            console.log('✅ المودل تم تحميله بنجاح');
        } catch (error) {
            console.error('❌ فشل تحميل المودل:', error);
            this.characterController.createPlaceholder();
        }

        this.memory = new Memory();
        this.animationStateMachine = new AnimationStateMachine(this.characterController);
        this.aiBrain = new AIBrain(this.animationStateMachine, this.memory, this);
        this.speechSystem = new SpeechSystem(this, this.aiBrain, this.memory);

        this.updateStateDisplay("💙 جاهز - اضغطي 'تحدث مع Pooh'");
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        const unlockAudio = () => {
            if (!this.audioUnlocked) {
                this.audioUnlocked = true;
                // ✅ طريقة أحسن لفك حظر الصوت
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const buffer = ctx.createBuffer(1, 1, 22050);
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    source.start(0);
                } catch(e) {}
                
                speechSynthesis.speak(new SpeechSynthesisUtterance(""));
                console.log("🔓 الصوت تم فك حظره");
            }
        };

        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('keydown', unlockAudio, { once: true });

        // ✅ زر ابدأ/إيقاف
        document.getElementById('start-btn').addEventListener('click', () => this.toggleSystem());
        
        // ✅ زر إعادة
        document.getElementById('reload-btn')?.addEventListener('click', () => location.reload());
        
        // ✅ زر عرض الدخول
        document.getElementById('intro-btn')?.addEventListener('click', () => {
            if (this.animationStateMachine) {
                this.animationStateMachine.setState('INTRO');
                this.updateStateDisplay("🎬 جاري العرض...");
            }
        });
        
        // ✅ زر محادثة جديدة
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (this.speechSystem) {
                this.speechSystem.resetConversation();
                this.updateStateDisplay("💙 محادثة جديدة!");
            }
        });
    }

    toggleSystem() {
        const btn = document.getElementById('start-btn');
        this.isActive = !this.isActive;

        if (this.isActive) {
            btn.textContent = '🛑 إيقاف';
            btn.classList.add('active');
            if (this.speechSystem) this.speechSystem.startListening();
            this.updateStateDisplay("👂 سامعك...");
        } else {
            btn.textContent = '🎤 تحدث مع Pooh';
            btn.classList.remove('active');
            if (this.speechSystem) this.speechSystem.stopListening();
            this.updateStateDisplay("💙 جاهز");
        }
    }

    onMouseMove(e) {
        if (!this.isActive) return;
        if (!this.renderer) return;
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateStateDisplay(text) {
        const el = document.getElementById('state-display');
        if (el) el.textContent = text;
    }

    update(deltaTime) {
        if (this.characterController) this.characterController.update(this.mouse, deltaTime, this.isActive);
        if (this.animationStateMachine) this.animationStateMachine.update(deltaTime);
        if (this.aiBrain) this.aiBrain.update(deltaTime);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = Math.min((performance.now() - this.lastTime) / 1000, 0.1);
        this.lastTime = performance.now();
        
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}

// ✅ initialization
const npcSystem = new AINPCSystem();
window.npcSystem = npcSystem;
npcSystem.init();