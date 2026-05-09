export default class AnimationStateMachine {
    constructor(characterController) {
        this.characterController = characterController;
        this.currentState = 'IDLE';
        this.stateTimers = {};
        this.sparkleTimer = 0;
    }

    update(deltaTime) {
        this.stateTimers[this.currentState] = (this.stateTimers[this.currentState] || 0) + deltaTime;
        this.updateStateBehaviors(deltaTime);
    }

    setState(newState) {
        if (newState === this.currentState) return;
        this.currentState = newState;
        this.stateTimers[newState] = 0;
        this.playStateAnimation(newState);
    }

    playStateAnimation(state) {
        if (!this.characterController?.animations) return;
        
        const animationMap = {
            'IDLE': 'Idle',
            'TALKING': 'Talk',
            'LISTENING': 'Idle',
            'HAPPY': 'Happy',
            'EXCITED': 'Dance',
            'INTRO': 'Dance',
        };
        
        const animName = animationMap[state];
        if (animName && this.characterController.animations[animName]) {
            this.characterController.playAnimation(animName);
        }
    }

    updateStateBehaviors(deltaTime) {
        if (!this.characterController) return;
        
        const isTalking = this.currentState === 'TALKING';
        
        if (this.currentState === 'IDLE') {
            this.characterController.updateFloating(deltaTime, false);
        }
        
        if (this.currentState === 'TALKING') {
            this.characterController.updateFloating(deltaTime, true); // حركة أقوى
        }
        
        if (this.currentState === 'EXCITED' || this.currentState === 'HAPPY' || this.currentState === 'INTRO') {
            this.characterController.updateFloating(deltaTime * 1.8, true);
            this.sparkleTimer += deltaTime;
            if (this.sparkleTimer > 0.1) {
                this.sparkleTimer = 0;
                this.characterController.showSparkles();
            }
        }
    }

    getCurrentState() {
        return this.currentState;
    }
}