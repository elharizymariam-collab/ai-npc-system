import AIBrain from './aiBrain.js';
import Memory from './memory.js';

export default class NPCSystem {
    constructor(characterController) {
        this.characterController = characterController;
        
        this.memory = new Memory();
        this.aiBrain = new AIBrain(characterController, this.memory, this);
        
        this.speechSystem = null;
        this.stateDisplay = null;
        this.magicCircle = null;
        this.focusMode = false;
        this.magicCircleActive = false;
        
        this.init();
    }

    init() {
        this.stateDisplay = document.getElementById('state-display');
        this.createMagicCircle();
    }

    createMagicCircle() {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        
        this.magicCircle = document.createElement('div');
        this.magicCircle.id = 'magic-circle';
        this.magicCircle.style.cssText = `
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 200px;
            border-radius: 50%;
            border: 3px solid #00ffff;
            opacity: 0;
            transition: all 0.5s;
            pointer-events: none;
            box-shadow: 0 0 30px #00ffff, inset 0 0 30px #00ffff;
        `;
        container.appendChild(this.magicCircle);
    }

    updateStateDisplay(text) {
        if (this.stateDisplay) {
            this.stateDisplay.textContent = text;
        }
    }

    toggleMagicCircle() {
        this.magicCircleActive = !this.magicCircleActive;
        
        if (this.magicCircleActive) {
            this.magicCircle.style.opacity = '1';
            this.magicCircle.style.animation = 'rotate 3s linear infinite';
        } else {
            this.magicCircle.style.opacity = '0';
            this.magicCircle.style.animation = 'none';
        }
    }

    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        
        if (this.focusMode) {
            this.updateStateDisplay('🎯 FOCUS MODE');
        } else {
            this.updateStateDisplay('💙 جاهز');
        }
    }

    update(mouse, deltaTime, isActive) {
        if (this.aiBrain) {
            this.aiBrain.update(deltaTime);
        }
    }
}