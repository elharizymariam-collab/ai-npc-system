export default class AIBrain {
    constructor(animationStateMachine, memory, npcSystem) {
        this.animationStateMachine = animationStateMachine;
        this.memory = memory;
        this.npcSystem = npcSystem;
        
        this.isTalking = false;
    }

    update(deltaTime) {
        // لا يتكلم لوحده أبداً
    }

    handleInteraction() {
        this.reactToClick();
    }

    reactToSpeech() {
        this.animationStateMachine.setState('LISTENING');
    }

    reactToClick() {
        this.animationStateMachine.setState('REACT');
        setTimeout(() => this.animationStateMachine.setState('IDLE'), 500);
    }

    reactToTalk() {
        this.isTalking = true;
        this.animationStateMachine.setState('TALKING');
    }

    finishTalking() {
        this.isTalking = false;
        this.animationStateMachine.setState('IDLE');
    }

    analyzeEmotion(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes("زعلان") || lowerText.includes("حزين") || lowerText.includes("تعبان")) {
            this.animationStateMachine.setState('SAD');
        } else if (lowerText.includes("مبسوط") || lowerText.includes("فرحان") || lowerText.includes("حلو")) {
            this.animationStateMachine.setState('HAPPY');
        } else if (lowerText.includes("مستغرب") || lowerText.includes("غريب") || lowerText.includes("واو")) {
            this.animationStateMachine.setState('EXCITED');
        }
    }
}