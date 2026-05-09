export default class SpeechSystem {
    constructor(npcSystem, aiBrain, memory) {
        this.npcSystem = npcSystem;
        this.aiBrain = aiBrain;
        this.memory = memory;
        this.recognition = null;
        this.isSpeaking = false;
        this.isListening = false;
        this.lipSyncInterval = null;
        
        this.AI_URL = "http://localhost:3000/api/chat";
        this.TTS_URL = "http://localhost:8000";

        this.lipPhase = 0;
        this.isLipActive = false;

        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = "ar-EG";

        this.recognition.onresult = (event) => {
            if (this.isSpeaking) return;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    let text = event.results[i][0].transcript.trim();
                    console.log("🎤 Heard:", text);
                    this.handleSpeechInput(text);
                }
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error === "not-allowed") {
                this.npcSystem.updateStateDisplay("❌ السماح بالمايكروفون مطلوب");
            } else if (event.error !== "no-speech") {
                console.warn("Speech Error:", event.error);
            }
        };

        this.recognition.onend = () => {
            if (this.isListening && !this.isSpeaking) {
                setTimeout(() => this.restartListening(), 400);
            }
        };
    }

    // ✅ دالة تنظيف الرد
    cleanResponse(text) {
        if (!text) return '';
        
        return text
            .replace(/^أهلاً\s*أهلاً\s*/gi, '')
            .replace(/^أهلاً\s*وسهلاً\s*/gi, '')
            .replace(/^مرحبا\s*/gi, '')
            .replace(/^أهلا\s*/gi, '')
            .replace(/^أنا\s*Eilik\s*/gi, '')
            .replace(/^أنا\s*Pooh\s*/gi, '')
            .replace(/^Eilik\s*/gi, '')
            .replace(/^Pooh\s*/gi, '')
            .replace(/^\*\*.*?\*\*\s*/gi, '')
            .replace(/^\*.*?\*\s*/gi, '')
            .trim();
    }

    async handleSpeechInput(userText) {
        if (this.isSpeaking) return;
        
        this.isSpeaking = true;
        this.npcSystem.updateStateDisplay("💙 بيفكر...");

        if (this.aiBrain) {
            this.aiBrain.reactToTalk();
        }

        this.setExpression(userText);
        this.memory.addUserInput(userText);

        // ✅ فحص الأوامر أولاً
        const commandResponse = this.checkCommands(userText);
        
        if (commandResponse) {
            console.log("⚡ أمر:", commandResponse.text);
            this.setExpression(commandResponse.expression);
            await this.speak(commandResponse.text);
        } else {
            // رد عادي من AI
            const response = await this.getAIResponse(userText);
            
            // ✅ تنظيف الرد قبل الطباعة والتخزين
            const cleanResponse = this.cleanResponse(response);
            
            console.log("🤖 Eilik:", cleanResponse);
            
            this.memory.addAIResponse(cleanResponse);
            this.setExpression(cleanResponse);
            
            await this.speak(cleanResponse);
        }
    }

    checkCommands(text) {
        const lower = text.toLowerCase();
        const controller = this.npcSystem?.characterController;
        if (!controller) return null;

        if (lower.includes('ارفع') && (lower.includes('يد') || lower.includes('ايدك') || lower.includes('ايدي'))) {
            controller.raiseHand();
            return { text: 'تفضل! ✋', expression: 'happy' };
        }
        
        if (lower.includes('خفض') && (lower.includes('يد') || lower.includes('ايدك') || lower.includes('ايدي'))) {
            controller.lowerHand();
            return { text: 'تمام! 👍', expression: 'normal' };
        }
        
        if (lower.includes('غمض') || lower.includes('سكت')) {
            controller.wink('left');
            setTimeout(() => controller.openEye(), 1500);
            return { text: '😑', expression: 'normal' };
        }
        
        if (lower.includes('افتح') || lower.includes('شوف') || lower.includes('باين')) {
            controller.openEye();
            return { text: '👀', expression: 'surprised' };
        }
        
        if (lower.includes('لف') || lower.includes('دور') || lower.includes('دوران') || lower.includes('اسكت')) {
            controller.spinAround();
            return { text: '🌀', expression: 'happy' };
        }
        
        return null;
    }

    setExpression(text) {
        if (!this.npcSystem?.characterController) return;
        
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes("مبسوط") || lowerText.includes("فرحان") || 
            lowerText.includes("حلو") || lowerText.includes("❤️") || lowerText.includes("🌀") || lowerText.includes("✋")) {
            this.npcSystem.characterController.setExpression('happy');
        }
        else if (lowerText.includes("زعلان") || lowerText.includes("حزين")) {
            this.npcSystem.characterController.setExpression('sad');
        }
        else if (lowerText.includes("إيه") || lowerText.includes("؟") || lowerText.includes("👀")) {
            this.npcSystem.characterController.setExpression('surprised');
        }
        else {
            this.npcSystem.characterController.setExpression('normal');
        }
    }

    async getAIResponse(userInput) {
        try {
            const history = this.memory.getRecentHistory(10);
            
            const res = await fetch(this.AI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: userInput,
                    history: history
                })
            });

            if (res.ok) {
                const data = await res.json();
                return data.response || "قوللي إيه بالظبط؟";
            }
        } catch (e) {
            console.error("❌ Error:", e);
        }
        return "ممكن تعيدي السؤال؟";
    }

    async speak(text) {
        if (!text) return this.finishSpeaking();

        this.npcSystem.updateStateDisplay("💙 Eilik بيتكلم...");
        
        this.startLipSync();

        try {
            const res = await fetch(this.TTS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    text: text,
                    speed: 1.1,
                    pitch: 1.05
                })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    this.stopLipSync();
                    this.finishSpeaking();
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    this.stopLipSync();
                    this.fallbackSpeak(text);
                };

                await audio.play();
                return;
            }
        } catch (e) {
            console.warn("⚠️ TTS failed");
        }

        this.fallbackSpeak(text);
    }

    startLipSync() {
        this.isLipActive = true;
        this.lipPhase = 0;
        
        if (this.lipSyncInterval) clearInterval(this.lipSyncInterval);
        
        this.lipSyncInterval = setInterval(() => {
            if (!this.npcSystem?.characterController) return;
            
            this.lipPhase += 0.15;
            
            const baseIntensity = Math.sin(this.lipPhase) * 0.5 + 0.5;
            const fastIntensity = Math.sin(this.lipPhase * 3) * 0.2;
            const intensity = baseIntensity + fastIntensity;
            
            this.npcSystem.characterController.setLipSync(intensity);
            
        }, 30);
    }

    stopLipSync() {
        this.isLipActive = false;
        
        if (this.lipSyncInterval) {
            clearInterval(this.lipSyncInterval);
            this.lipSyncInterval = null;
        }
        
        if (this.npcSystem?.characterController) {
            this.npcSystem.characterController.setLipSync(0);
        }
    }

    fallbackSpeak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ar-SA";
        utterance.rate = 1.0;
        utterance.pitch = 0.9;

        utterance.onend = () => {
            this.stopLipSync();
            this.finishSpeaking();
        };
        utterance.onerror = () => {
            this.stopLipSync();
            this.finishSpeaking();
        };
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }

    finishSpeaking() {
        this.stopLipSync();
        this.npcSystem.updateStateDisplay("💙 جاهز");
        
        if (this.aiBrain) this.aiBrain.finishTalking();
        
        if (this.npcSystem?.characterController) {
            this.npcSystem.characterController.setExpression('normal');
        }
        
        this.isSpeaking = false;

        if (this.isListening) {
            setTimeout(() => this.restartListening(), 300);
        }
    }

    startListening() {
        this.isListening = true;
        this.restartListening();
    }

    restartListening() {
        if (!this.recognition || !this.isListening || this.isSpeaking) return;
        
        try {
            if (this.recognition.running) {
                this.recognition.stop();
            }
            
            setTimeout(() => {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.warn("⚠️ Already running:", e.message);
                }
            }, 200);
        } catch (e) {
            console.warn("⚠️ Restart error:", e.message);
        }
    }

    stopListening() {
        this.isListening = false;
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn("⚠️ Stop error:", e.message);
            }
        }
        
        speechSynthesis.cancel();
    }

    resetConversation() {
        this.memory.clear();
    }
}