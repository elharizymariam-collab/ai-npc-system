import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class CharacterController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.model = null;
        this.lipSyncIntensity = 0;
        this.floatOffset = 0;
        this.screen = null;
        this.mouth = null;
        this.leftEye = null;
        this.rightEye = null;
        this.hand = null;
        this.arm = null;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.currentRotationX = 0;
        this.currentRotationY = 0;
        this.screenAnimTime = 0;
        this.isTalking = false;
        this.talkTime = 0;
        this.bodyBobTime = 0;
        this.eyeBlinkTime = 0;
        this.isBlinking = false;
        this.eyePulseTime = 0;
        this.isHandRaised = false;
        this.handRaiseProgress = 0;
        this.isSpinning = false;
        this.spinProgress = 0;
        this.originalRotationY = 0;
        this.isWinking = false;
        this.winkEye = null;
        
        // ✅ متغير حركة اليد مع الكلام
        this.handWaveTime = 0;
        this.handOriginalRotation = null;
        
        this.sparkleGeometry = null;
        this.sparkleMaterial = null;
        this.sparkleSystem = null;
        this.init();
    }

    init() {
        console.log('🎭 Character Controller جاهز');
        this.createSparkleSystem();
    }

    createSparkleSystem() {
        this.sparkleGeometry = new THREE.BufferGeometry();
        const sparkleCount = 35;
        const positions = new Float32Array(sparkleCount * 3);
        const colors = new Float32Array(sparkleCount * 3);
        for (let i = 0; i < sparkleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            colors[i*3] = 1; 
            colors[i*3+1] = 0.95; 
            colors[i*3+2] = 1;
        }
        this.sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.sparkleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.sparkleMaterial = new THREE.PointsMaterial({
            size: 0.09,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });
        this.sparkleSystem = new THREE.Points(this.sparkleGeometry, this.sparkleMaterial);
        this.scene.add(this.sparkleSystem);
    }

    // ✅ دالة Sparkles المطلوبة للـ Intro Button
    showSparkles() {
        if (!this.sparkleSystem || !this.sparkleMaterial) return;
        
        this.sparkleMaterial.opacity = 0.95;
        
        const positions = this.sparkleGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i]     = (Math.random() - 0.5) * 3;     // X
            positions[i + 1] = Math.random() * 2.5 + 0.5;    // Y (فوق الروبوت)
            positions[i + 2] = (Math.random() - 0.5) * 2.5;  // Z
        }
        
        this.sparkleGeometry.attributes.position.needsUpdate = true;

        // إخفاء تدريجي
        setTimeout(() => {
            if (this.sparkleMaterial) this.sparkleMaterial.opacity = 0.15;
        }, 1500);
    }

    async loadModel(path) {
        console.log('🔄 جاري تحميل المودل...');
        const loader = new GLTFLoader();
        return new Promise((resolve) => {
            loader.load(path,
                (gltf) => {
                    this.model = gltf.scene;
                    this.model.position.set(0, 0, 7);
                    this.model.scale.set(4.5, 4.5, 4.5);
                    this.model.rotation.y = Math.PI;
                    this.originalRotationY = Math.PI;
                    
                    this.findBodyParts();
                    this.scene.add(this.model);
                    this.createDigitalEyes();
                    
                    // ✅ حفظ الوضع الأصلي لليد
                    this.saveHandOriginalRotation();
                    
                    console.log('✅ المودل تم تحميله');
                    console.log('📍 اليد:', this.hand ? this.hand.name : 'مش موجودة');
                    resolve();
                },
                (progress) => {
                    console.log('📥 جاري التحميل:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
                },
                (error) => {
                    console.error('❌ فشل تحميل المودل:', error);
                    resolve();
                }
            );
        });
    }

    // ✅ حفظ الوضع الأصلي لليد
    saveHandOriginalRotation() {
        if (this.hand) {
            this.handOriginalRotation = {
                x: this.hand.rotation.x,
                y: this.hand.rotation.y,
                z: this.hand.rotation.z
            };
        }
    }

    findBodyParts() {
        if (!this.model) return;
        console.log("🔍 جميع الأجزاء في المودل:");
        
        this.model.traverse((child) => {
            const name = child.name.toLowerCase();
            const fullName = child.name;
            console.log(`   → ${fullName}`);

            if (name.includes('screen') || name.includes('display') || name.includes('face')) {
                this.screen = child;
            }
            if (name.includes('mouth') || name.includes('lip')) {
                this.mouth = child;
            }
            if (name.includes('hand') || name.includes('palm') || name.includes('wrist') || 
                name.includes('finger') || name.includes('thumb') || name.includes('arm')) {
                if (!this.hand) {
                    this.hand = child;
                    console.log('✋ اليد:', fullName);
                }
            }
            if (name.includes('forearm') || name.includes('upper_arm')) {
                if (!this.arm) {
                    this.arm = child;
                    console.log('💪 الذراع:', fullName);
                }
            }
        });
        
        if (!this.hand) {
            this.findHandInChildren(this.model);
        }
    }

    findHandInChildren(object) {
        object.traverse((child) => {
            const name = child.name.toLowerCase();
            if ((name.includes('hand') || name.includes('r_hand') || name.includes('l_hand') || 
                 name.includes('right') || name.includes('left')) && child.type === 'Group') {
                if (!this.hand) {
                    this.hand = child;
                    console.log('✋ اليد found:', child.name);
                }
            }
        });
    }

    createDigitalEyes() {
        if (!this.model) return;
        console.log('🤖 جاري إنشاء عيون رقمية...');
        if (this.leftEye) { this.model.remove(this.leftEye); this.leftEye = null; }
        if (this.rightEye) { this.model.remove(this.rightEye); this.rightEye = null; }
        this.createSingleDigitalEye(-0.18, 0.35, 0.36, 0.1, 'left');
        this.createSingleDigitalEye(0.18, 0.35, 0.36, 0.1, 'right');
        console.log('✅ تم إنشاء عيون رقمية!');
    }

    createSingleDigitalEye(x, y, z, size, side) {
        const eyeGroup = new THREE.Group();
        
        // الحلقة الخارجية
        const outerRing = new THREE.Mesh(
            new THREE.RingGeometry(size * 0.85, size, 64),
            new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
        );
        eyeGroup.add(outerRing);
        
        // الحلقة الوسطى
        const midRing = new THREE.Mesh(
            new THREE.RingGeometry(size * 0.6, size * 0.75, 64),
            new THREE.MeshBasicMaterial({ color: 0x0099cc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        eyeGroup.add(midRing);
        
        // الدائرة الزرقاء
        const innerCircle = new THREE.Mesh(
            new THREE.CircleGeometry(size * 0.55, 64),
            new THREE.MeshStandardMaterial({ color: 0x0066cc, emissive: 0x003366, emissiveIntensity: 0.6 })
        );
        eyeGroup.add(innerCircle);
        
        // البؤبؤ
        const pupil = new THREE.Mesh(
            new THREE.CircleGeometry(size * 0.25, 64),
            new THREE.MeshBasicMaterial({ color: 0x00ffff })
        );
        pupil.position.z = 0.01;
        eyeGroup.add(pupil);
        
        // التألق
        const highlight = new THREE.Mesh(
            new THREE.CircleGeometry(size * 0.08, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        highlight.position.set(size * 0.1, size * 0.1, 0.02);
        eyeGroup.add(highlight);
        
        // التوهج
        const glow = new THREE.Mesh(
            new THREE.CircleGeometry(size * 1.3, 64),
            new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.15 })
        );
        glow.position.z = -0.01;
        eyeGroup.add(glow);
        
        eyeGroup.position.set(x, y, z);
        eyeGroup.renderOrder = 1000;
        this.model.add(eyeGroup);
        
        if (side === 'left') this.leftEye = eyeGroup;
        else this.rightEye = eyeGroup;
    }

    setLipSync(intensity) {
        if (!this.screen) return;
        this.lipSyncIntensity = intensity;
        this.screen.scale.y = 1.0 + intensity * 0.5;
        this.screen.scale.x = 1.0 + intensity * 0.2;
        this.screen.position.z = intensity * 0.1;
    }

    stopLipSync() {
        if (!this.screen) return;
        this.screen.scale.y = 1;
        this.screen.scale.x = 1;
        this.screen.position.z = 0;
    }

    raiseHand() {
        if (this.isHandRaised) return;
        this.isHandRaised = true;
        this.handRaiseProgress = 0;
        console.log('✋ رفع اليد!');
    }

    lowerHand() {
        if (!this.isHandRaised) return;
        this.isHandRaised = false;
        console.log('✋ خفض اليد!');
    }

    spinAround() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.spinProgress = 0;
        this.originalRotationY = this.model ? this.model.rotation.y : Math.PI;
        console.log('🌀 لف حول نفسه!');
    }

    wink(eye = 'left') {
        if (this.isWinking) return;
        this.isWinking = true;
        this.winkEye = eye;
        console.log('😑 غمض!');
    }

    openEye() {
        this.isWinking = false;
        if (this.leftEye) this.leftEye.scale.y = 1;
        if (this.rightEye) this.rightEye.scale.y = 1;
        console.log('👀 فتح!');
    }

    // ✅ تحديث العيون مع الكلام
    updateEyes(deltaTime) {
        if (!this.leftEye || !this.rightEye) return;
        
        // ✅ نبض خفيف للعيون (دائرية مفتوحة)
        this.eyePulseTime += deltaTime;
        const pulse = 1 + Math.sin(this.eyePulseTime * 2) * 0.03;
        
        if (!this.isWinking) {
            if (this.leftEye) this.leftEye.scale.set(pulse, pulse, 1);
            if (this.rightEye) this.rightEye.scale.set(pulse, pulse, 1);
        }
        
        // ✅ رمش أثناء الكلام
        if (this.isTalking && !this.isWinking) {
            this.eyeBlinkTime += deltaTime;
            if (this.eyeBlinkTime > 0.12 && !this.isBlinking) {
                this.isBlinking = true;
                if (this.leftEye) this.leftEye.scale.y = 0.1;
                if (this.rightEye) this.rightEye.scale.y = 0.1;
                setTimeout(() => {
                    if (this.leftEye && !this.isWinking) this.leftEye.scale.y = 1;
                    if (this.rightEye && !this.isWinking) this.rightEye.scale.y = 1;
                    this.isBlinking = false;
                }, 60);
                this.eyeBlinkTime = 0;
            }
        }
        
        // ✅ حركة البؤبؤ أثناء الكلام
        if (this.isTalking && !this.isWinking) {
            const pupilMoveX = Math.sin(this.talkTime * 8) * 0.02;
            const pupilMoveY = Math.cos(this.talkTime * 6) * 0.01;
            
            if (this.leftEye) {
                this.leftEye.children[3].position.x = pupilMoveX;
                this.leftEye.children[3].position.y = pupilMoveY;
            }
            if (this.rightEye) {
                this.rightEye.children[3].position.x = pupilMoveX;
                this.rightEye.children[3].position.y = pupilMoveY;
            }
        }
    }

    // ✅ تحديث اليد مع الكلام (شرح)
    updateHand(deltaTime) {
        if (!this.hand) return;
        
        // ✅ حركة اليد أثناء الكلام (شرح)
        if (this.isTalking && !this.isHandRaised) {
            this.handWaveTime += deltaTime * 5;
            
            const orig = this.handOriginalRotation || { x: 0, y: 0, z: 0 };
            
            // ✅ موجة اليد (يمين-يسار)
            const waveZ = Math.sin(this.handWaveTime) * 0.4;
            // ✅ رفع وخفض اليد
            const waveY = Math.sin(this.handWaveTime * 0.7) * 0.05;
            // ✅ حركة للأمام/للخلف
            const waveX = Math.sin(this.handWaveTime * 0.5) * 0.2;
            
            this.hand.rotation.z = orig.z + waveZ;
            this.hand.rotation.y = orig.y + waveX;
            this.hand.position.y = orig.y + waveY;
            
            // ✅ تحريك الـ children (أصابع)
            this.hand.traverse((child) => {
                if (child !== this.hand && child.rotation) {
                    child.rotation.z = waveZ * 0.5;
                    child.rotation.x = Math.sin(this.handWaveTime + 1) * 0.1;
                }
            });
        }
        
        // ✅ رفع اليد للأعلى
        if (this.isHandRaised && !this.isTalking) {
            this.handRaiseProgress += deltaTime * 2;
            const progress = Math.min(this.handRaiseProgress, 1);
            
            const orig = this.handOriginalRotation || { x: 0, y: 0, z: 0 };
            
            this.hand.rotation.z = orig.z - progress * 1.5;
            this.hand.rotation.x = orig.x - progress * 0.5;
            this.hand.position.y = orig.y + progress * 0.3;
        }
        
        // ✅ رجوع اليد لوضعها الطبيعي
        if (!this.isTalking && !this.isHandRaised) {
            const orig = this.handOriginalRotation || { x: 0, y: 0, z: 0 };
            
            this.hand.rotation.z += (orig.z - this.hand.rotation.z) * 0.1;
            this.hand.rotation.y += (orig.y - this.hand.rotation.y) * 0.1;
            this.hand.position.y += (orig.y - this.hand.position.y) * 0.1;
            
            this.hand.traverse((child) => {
                if (child !== this.hand && child.rotation) {
                    child.rotation.z *= 0.9;
                    child.rotation.x *= 0.9;
                }
            });
        }
    }

    updateSpin(deltaTime) {
        if (!this.model) return;
        if (this.isSpinning) {
            this.spinProgress += deltaTime * 4;
            if (this.spinProgress < 1) {
                this.model.rotation.y += deltaTime * 25;
            } else if (this.spinProgress < 2) {
                // وقوف
            } else if (this.spinProgress < 3) {
                this.model.rotation.y += (this.originalRotationY - this.model.rotation.y) * 0.05;
            } else {
                this.isSpinning = false;
                this.model.rotation.y = this.originalRotationY;
            }
        }
    }

    updateWink(deltaTime) {
        if (!this.isWinking) return;
        if (this.winkEye === 'left' && this.leftEye) {
            this.leftEye.scale.y = 0.1;
        } else if (this.winkEye === 'right' && this.rightEye) {
            this.rightEye.scale.y = 0.1;
        }
    }

    updateLipSync(deltaTime) {
        if (!this.screen) return;
        if (this.isTalking) {
            this.talkTime += deltaTime;
            const intensity = 0.5 + Math.sin(this.talkTime * 12) * 0.3;
            this.screen.scale.y = 1.0 + intensity * 0.4;
            this.screen.scale.x = 1.0 + intensity * 0.15;
            this.screen.position.z = intensity * 0.08;
        } else {
            this.screen.scale.y += (1.0 - this.screen.scale.y) * 0.2;
            this.screen.scale.x += (1.0 - this.screen.scale.x) * 0.2;
            this.screen.position.z += (0 - this.screen.position.z) * 0.2;
        }
    }

        updateBodyBob(deltaTime) {
        if (!this.model || this.isSpinning) return;
        if (this.isTalking) {
            this.bodyBobTime += deltaTime * 6;
            this.model.position.y = Math.sin(this.bodyBobTime) * 0.03;
            this.model.rotation.z = Math.sin(this.bodyBobTime * 0.5) * 0.05;
        } else {
            this.floatOffset += deltaTime;
            this.model.position.y = Math.sin(this.floatOffset * 2) * 0.08;
            this.model.rotation.z += (0 - this.model.rotation.z) * 0.1;
        }
    }

    updateEyesLookAt(mouseX, mouseY) {
        if (!this.leftEye || !this.rightEye) return;
        const moveX = mouseX * 0.04;
        const moveY = mouseY * 0.03;
        this.leftEye.rotation.y = moveX;
        this.leftEye.rotation.x = -moveY;
        this.rightEye.rotation.y = moveX;
        this.rightEye.rotation.x = -moveY;
    }

    setTalking(talking) {
        this.isTalking = talking;
        if (!talking) {
            this.talkTime = 0;
            this.stopLipSync();
        }
        console.log(talking ? '🗣️ بيتكلم...' : '🔇 خلاص');
    }

    setExpression(expression) {
        if (!this.screen) return;
        switch(expression) {
            case 'happy':
                this.screen.scale.set(1.18, 1.25, 1.1);
                if (this.leftEye) this.leftEye.scale.set(1.15, 1.15, 1);
                if (this.rightEye) this.rightEye.scale.set(1.15, 1.15, 1);
                break;
            case 'sad':
                this.screen.scale.set(0.88, 0.78, 1);
                if (this.leftEye) this.leftEye.scale.set(0.8, 0.8, 1);
                if (this.rightEye) this.rightEye.scale.set(0.8, 0.8, 1);
                break;
            case 'surprised':
                this.screen.scale.set(1.28, 1.35, 1.12);
                if (this.leftEye) this.leftEye.scale.set(1.3, 1.3, 1);
                if (this.rightEye) this.rightEye.scale.set(1.3, 1.3, 1);
                break;
            case 'angry':
                this.screen.scale.set(0.95, 0.7, 1);
                if (this.leftEye) this.leftEye.scale.set(0.9, 1.1, 1);
                if (this.rightEye) this.rightEye.scale.set(0.9, 1.1, 1);
                break;
            default:
                this.screen.scale.set(1, 1, 1);
                if (this.leftEye) this.leftEye.scale.set(1, 1, 1);
                if (this.rightEye) this.rightEye.scale.set(1, 1, 1);
        }
    }

    updateScreenAnimation(deltaTime) {
        if (!this.screen) return;
        this.screenAnimTime += deltaTime * 3.2;
        this.screen.scale.y = Math.sin(this.screenAnimTime) * 0.07 + 1.0;
    }

    updateFloating(deltaTime) {
        if (!this.model || this.isSpinning) return;
        this.floatOffset += deltaTime;
        this.model.position.y = Math.sin(this.floatOffset * 2) * 0.08;
    }

    lookAt(mouseX, mouseY) {
        this.targetRotationY = mouseX * 0.55;
        this.targetRotationX = -mouseY * 0.3;
    }

    updateLookAt(deltaTime) {
        if (!this.model || this.isSpinning) return;
        this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.14;
        this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.14;
        this.model.rotation.y = Math.PI + this.currentRotationY * 0.35;
    }

    update(mouse, deltaTime, isActive) {
        if (!this.model) return;
        
        if (isActive) {
            this.lookAt(mouse.x, mouse.y);
            this.updateEyesLookAt(mouse.x, mouse.y);
        }
        
        this.updateLookAt(deltaTime);
        this.updateFloating(deltaTime);
        this.updateScreenAnimation(deltaTime);
        this.updateEyes(deltaTime);
        this.updateHand(deltaTime);
        this.updateLipSync(deltaTime);
        this.updateBodyBob(deltaTime);
        this.updateSpin(deltaTime);
        this.updateWink(deltaTime);
    }

    getPosition() {
        return this.model ? this.model.position : new THREE.Vector3();
    }

    getRotation() {
        return this.model ? this.model.rotation : new THREE.Euler();
    }
}
