export default class Memory {
    constructor() {
        this.shortTerm = [];
        this.maxShortTerm = 20;
    }

    addUserInput(text) {
        this.shortTerm.push({
            type: 'user',
            text: text,
            time: Date.now()
        });
        
        if (this.shortTerm.length > this.maxShortTerm) {
            this.shortTerm.shift();
        }
    }

    addAIResponse(text) {
        // ✅ تنظيف الرد من أي تعريف للبوت
        let cleanText = this.cleanResponse(text);
        
        this.shortTerm.push({
            type: 'ai',
            text: cleanText,
            time: Date.now()
        });
        
        if (this.shortTerm.length > this.maxShortTerm) {
            this.shortTerm.shift();
        }
    }

    // ✅ دالة التنظيف
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

    getRecentHistory(count = 10) {
        const recent = this.shortTerm.slice(-count);
        
        return recent.map(m => {
            if (m.type === 'user') {
                return `User: ${m.text}`;
            } else {
                return `Assistant: ${m.text}`;
            }
        }).join('\n');
    }

    clear() {
        this.shortTerm = [];
    }
}