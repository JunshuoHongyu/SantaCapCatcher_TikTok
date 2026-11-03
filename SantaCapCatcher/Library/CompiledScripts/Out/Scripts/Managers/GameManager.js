const {BasicScriptNode} = require('../../BasicScriptNode');
const {
  customNode,
  component,
  input,
  output,
  serializeSceneObjectFlag,
  serializeProperty,
  label, readOnly, slider, spinBox, dropDown,
  textArea, header, showIf, tooltip, separator,
  space, groupBegin, groupEnd, disablePin,
} = require('../../OrionDecorators');

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
// 圣诞帽大作战 — Santa Cap Catcher
// Head-tracked falling-item catcher. State machine: CALIBRATION -> COUNTDOWN -> PLAYING -> RESULT.
const STATE_CALIB = 0;
const STATE_COUNT = 1;
const STATE_PLAY = 2;
const STATE_RESULT = 3;
// ---------- UI copy (single source of truth for localisation) ----------
const UI = {
    calibTitle: "SANTA CAP CATCHER",
    calibSub: "Align your head with the ring - hats are falling!",
    calibBtn: "START",
    hudScore: (s) => "SCORE " + Math.max(0, s),
    hudLife: (m, t) => "MISS " + m + "/" + t,
    resTitle: "TIME UP!",
    resScore: (s) => "SCORE " + Math.max(0, s),
    rankLow: "SANTA'S TEMP WORKER",
    rankMid: "FLEXIBLE ELF",
    rankHigh: "SANTA PRIME",
    share1: "@ your clumsiest friend to try!",
    share2: "Tap below to make a duet!",
    resBtn: "PLAY AGAIN",
};
const SCR_W = 720;
const SCR_H = 1280;
let GameManager = class GameManager extends APJS.BasicScriptComponent {
    constructor() {
        super(...arguments);
        // ---------- tuning ----------
        this.baseSpeed = 300; // px / second at speed multiplier 1.0
        this.spawnInterval = 0.85; // seconds between spawns
        this.catchRadiusX = 118; // forehead catch box half width (px)
        this.catchRadiusY = 112; // forehead catch box half height (px)
        this.maxMiss = 8;
        this.maxConsecMiss = 5;
        this.roundSeconds = 30;
        // ---------- runtime state ----------
        this.state = STATE_CALIB;
        this.score = 0;
        this.miss = 0;
        this.consec = 0;
        this.correct = 0;
        this.timeLeft = 30;
        this.speedMul = 1;
        this.spawnTimer = 0;
        this.countTimer = 0;
        this.countStep = 0;
        this.faceHold = 0;
        this.flashT = 0;
        this.shakeT = 0;
        this.burstT = 0;
        this.popupT = 0;
        this.ready = false;
        // forehead point (screen px, origin at screen center, +Y up)
        this.fx = 0;
        this.fy = 120;
        // cached nodes
        this.snow = [];
        this.items = [];
        this.itemST = [];
        this.itemY = [];
        this.itemX = [];
        this.itemSpd = [];
        this.itemActive = [];
        this.itemType = []; // 0 normal, 1 gold, 2 bad
        this.calibNodes = [];
        this.playNodes = [];
        this.resNodes = [];
        this.ringST = null;
        this.burstImg = null;
        this.burstST = null;
        this.flashImg = null;
        this.barST = null;
        this.scoreTxt = null;
        this.lifeTxt = null;
        this.countTxt = null;
        this.countST = null;
        this.resScoreTxt = null;
        this.resRankTxt = null;
        this.calibTitleTxt = null;
        this.calibSubTxt = null;
        this.calibBtnTxt = null;
        this.resTitleTxt = null;
        this.resShare1Txt = null;
        this.resShare2Txt = null;
        this.resBtnTxt = null;
        this.calibBtnImg = null;
        this.resBtnImg = null;
        this.camTr = null;
        this.sfxClick = null;
        this.sfxPop = null;
        this.sfxSuccess = null;
        this.sfxFail = null;
        this.onRecordStart = (_e) => {
            this.enterCalibration();
        };
        this.onTouch = (e) => {
            const args = e.args;
            if (!args || args.length === 0)
                return;
            const t = args[0];
            if (!t)
                return;
            if (t.phase !== APJS.TouchPhase.Began)
                return;
            try {
                if (this.state === STATE_CALIB && this.calibBtnImg && APJS.TouchUtils.isScreenPointOnImage(t.position, this.calibBtnImg)) {
                    this.play(this.sfxClick);
                    this.startCountdown();
                }
                else if (this.state === STATE_RESULT && this.resBtnImg && APJS.TouchUtils.isScreenPointOnImage(t.position, this.resBtnImg)) {
                    this.play(this.sfxClick);
                    this.enterCalibration();
                }
            }
            catch (err) {
                /* ignore */
            }
        };
    }
    // ---------------------------------------------------------------- helpers
    find(name) {
        try {
            const s = this.getSceneObject().scene;
            const o = s.findSceneObject(name);
            return o || null;
        }
        catch (e) {
            return null;
        }
    }
    findMany(names) {
        const out = [];
        for (let i = 0; i < names.length; i++) {
            const o = this.find(names[i]);
            if (o)
                out.push(o);
        }
        return out;
    }
    stOf(o) {
        if (!o)
            return null;
        return o.getComponent("ScreenTransform");
    }
    txtOf(name) {
        const o = this.find(name);
        if (!o)
            return null;
        return o.getComponent("Text");
    }
    imgOf(name) {
        const o = this.find(name);
        if (!o)
            return null;
        return o.getComponent("Image");
    }
    audioOf(name) {
        const o = this.find(name);
        if (!o)
            return null;
        try {
            return o.getComponent("AudioComponent");
        }
        catch (e) {
            return null;
        }
    }
    play(a) {
        if (!a)
            return;
        try {
            a.play();
        }
        catch (e) {
            /* ignore */
        }
    }
    show(nodes, on) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i])
                nodes[i].setEnabledInHierarchy(on);
        }
    }
    rnd(a, b) {
        return a + Math.random() * (b - a);
    }
    // ---------------------------------------------------------------- lifecycle
    onStart() {
        this.setup();
        APJS.EventManager.getGlobalEmitter().on(APJS.EventType.RecordStart, this.onRecordStart);
        APJS.EventManager.getGlobalEmitter().on(APJS.EventType.Touch, this.onTouch);
        this.enterCalibration();
    }
    onDestroy() {
        APJS.EventManager.getGlobalEmitter().off(APJS.EventType.RecordStart, this.onRecordStart);
        APJS.EventManager.getGlobalEmitter().off(APJS.EventType.Touch, this.onTouch);
    }
    setup() {
        if (this.ready)
            return;
        this.snow = this.findMany(["Snow0", "Snow1", "Snow2", "Snow3"]);
        this.calibNodes = this.findMany(["CalibDim", "CalibRing", "CalibTitle", "CalibSub", "CalibBtn", "CalibBtnText"]);
        this.playNodes = this.findMany([
            "PlayRing", "Item0", "Item1", "Item2", "Item3", "Item4", "Item5",
            "HudPlate", "HudScore", "HudLife", "BarBg", "BarFill", "Burst", "CountText",
        ]);
        this.resNodes = this.findMany([
            "ResCard", "ResTitle", "ResScore", "ResRank", "ResShare1", "ResShare2", "ResBtn", "ResBtnText",
        ]);
        const itemNames = ["Item0", "Item1", "Item2", "Item3", "Item4", "Item5"];
        for (let i = 0; i < itemNames.length; i++) {
            const o = this.find(itemNames[i]);
            this.items.push(o);
            this.itemST.push(this.stOf(o));
            this.itemY.push(0);
            this.itemX.push(0);
            this.itemSpd.push(0);
            this.itemActive.push(false);
            this.itemType.push(i === 4 ? 1 : i === 5 ? 2 : 0);
        }
        this.ringST = this.stOf(this.find("PlayRing"));
        const burst = this.find("Burst");
        this.burstST = this.stOf(burst);
        this.burstImg = burst ? burst.getComponent("Image") : null;
        this.flashImg = this.imgOf("Flash");
        if (this.flashImg) {
            this.flashImg.color = new APJS.Color(1, 0.12, 0.12, 1);
            this.flashImg.opacity = 0;
        }
        this.barST = this.stOf(this.find("BarFill"));
        this.scoreTxt = this.txtOf("HudScore");
        this.lifeTxt = this.txtOf("HudLife");
        this.countTxt = this.txtOf("CountText");
        this.countST = this.stOf(this.find("CountText"));
        this.resScoreTxt = this.txtOf("ResScore");
        this.resRankTxt = this.txtOf("ResRank");
        this.calibTitleTxt = this.txtOf("CalibTitle");
        this.calibSubTxt = this.txtOf("CalibSub");
        this.calibBtnTxt = this.txtOf("CalibBtnText");
        this.resTitleTxt = this.txtOf("ResTitle");
        this.resShare1Txt = this.txtOf("ResShare1");
        this.resShare2Txt = this.txtOf("ResShare2");
        this.resBtnTxt = this.txtOf("ResBtnText");
        this.calibBtnImg = this.imgOf("CalibBtn");
        this.resBtnImg = this.imgOf("ResBtn");
        const cam = this.find("2D Camera");
        this.camTr = cam ? cam.getComponent("Transform") : null;
        this.sfxClick = this.audioOf("SfxClick");
        this.sfxPop = this.audioOf("SfxPop");
        this.sfxSuccess = this.audioOf("SfxSuccess");
        this.sfxFail = this.audioOf("SfxFail");
        this.applyStaticCopy();
        this.ready = true;
    }
    // Static labels live in the scene as baked glyphs; override them at boot so
    // all UI copy is managed in one place (see UI above).
    applyStaticCopy() {
        if (this.calibTitleTxt)
            this.calibTitleTxt.text = UI.calibTitle;
        if (this.calibSubTxt)
            this.calibSubTxt.text = UI.calibSub;
        if (this.calibBtnTxt)
            this.calibBtnTxt.text = UI.calibBtn;
        if (this.resTitleTxt)
            this.resTitleTxt.text = UI.resTitle;
        if (this.resShare1Txt)
            this.resShare1Txt.text = UI.share1;
        if (this.resShare2Txt)
            this.resShare2Txt.text = UI.share2;
        if (this.resBtnTxt)
            this.resBtnTxt.text = UI.resBtn;
    }
    // ---------------------------------------------------------------- flow
    enterCalibration() {
        this.state = STATE_CALIB;
        this.score = 0;
        this.miss = 0;
        this.consec = 0;
        this.correct = 0;
        this.timeLeft = this.roundSeconds;
        this.speedMul = 1;
        this.spawnTimer = 0;
        this.countTimer = 0;
        this.countStep = 0;
        this.faceHold = 0;
        this.flashT = 0;
        this.shakeT = 0;
        this.burstT = 0;
        this.popupT = 0;
        this.fx = 0;
        this.fy = 120;
        for (let i = 0; i < this.items.length; i++) {
            this.itemActive[i] = false;
            if (this.items[i])
                this.items[i].setEnabledInHierarchy(false);
        }
        if (this.burstImg)
            this.burstImg.opacity = 0;
        if (this.flashImg)
            this.flashImg.opacity = 0;
        if (this.countTxt)
            this.countTxt.text = "";
        if (this.countST) {
            this.countST.anchoredPosition = new APJS.Vector2f(0, 60);
        }
        if (this.countTxt)
            this.countTxt.fontSize = 190;
        if (this.ringST)
            this.ringST.anchoredPosition = new APJS.Vector2f(this.fx, this.fy);
        this.refreshHud();
        this.show(this.playNodes, false);
        this.show(this.resNodes, false);
        this.show(this.calibNodes, true);
    }
    startCountdown() {
        if (this.state !== STATE_CALIB)
            return;
        this.state = STATE_COUNT;
        this.countTimer = 0;
        this.countStep = 0;
        this.show(this.calibNodes, false);
        this.show(this.playerNodes(), true);
        this.show(this.resNodes, false);
        this.refreshHud();
    }
    // gameplay nodes minus the transient ones that need special visibility rules
    playerNodes() {
        const out = [];
        for (let i = 0; i < this.playNodes.length; i++) {
            const n = this.playNodes[i];
            if (!n)
                continue;
            const nm = n.name;
            if (nm.indexOf("Item") === 0)
                continue;
            out.push(n);
        }
        return out;
    }
    startPlaying() {
        this.state = STATE_PLAY;
        this.timeLeft = this.roundSeconds;
        this.spawnTimer = 0.25;
        this.speedMul = 1;
        this.score = 0;
        this.miss = 0;
        this.consec = 0;
        this.correct = 0;
        if (this.countTxt)
            this.countTxt.text = "";
        this.refreshHud();
    }
    endRound() {
        if (this.state === STATE_RESULT)
            return;
        this.state = STATE_RESULT;
        this.show(this.playNodes, false);
        this.show(this.calibNodes, false);
        this.show(this.resNodes, true);
        if (this.burstImg)
            this.burstImg.opacity = 0;
        if (this.flashImg)
            this.flashImg.opacity = 0;
        if (this.camTr)
            this.camTr.localPosition = new APJS.Vector3f(0, 0, 40);
        let rank = UI.rankLow;
        if (this.score > 15)
            rank = UI.rankHigh;
        else if (this.score > 5)
            rank = UI.rankMid;
        if (this.resScoreTxt)
            this.resScoreTxt.text = UI.resScore(this.score);
        if (this.resRankTxt)
            this.resRankTxt.text = rank;
        this.play(this.sfxSuccess);
    }
    refreshHud() {
        if (this.scoreTxt)
            this.scoreTxt.text = UI.hudScore(this.score);
        if (this.lifeTxt)
            this.lifeTxt.text = UI.hudLife(this.miss, this.maxMiss);
    }
    addMiss(n) {
        this.miss += n;
        this.consec += n;
        this.flashT = 0.32;
        this.shakeT = 0.28;
        this.play(this.sfxFail);
        this.refreshHud();
        if (this.miss >= this.maxMiss || this.consec >= this.maxConsecMiss)
            this.endRound();
    }
    // ---------------------------------------------------------------- spawn
    spawnOne() {
        // weighted type pick: 65% normal, 15% gold, 20% bad
        const r = Math.random();
        const want = r < 0.65 ? 0 : r < 0.8 ? 1 : 2;
        let slot = -1;
        for (let i = 0; i < this.itemActive.length; i++) {
            if (!this.itemActive[i] && this.itemType[i] === want) {
                slot = i;
                break;
            }
        }
        if (slot < 0) {
            for (let i = 0; i < this.itemActive.length; i++) {
                if (!this.itemActive[i]) {
                    slot = i;
                    break;
                }
            }
        }
        if (slot < 0)
            return;
        this.itemActive[slot] = true;
        this.itemX[slot] = this.rnd(-260, 250);
        this.itemY[slot] = 560;
        const boost = this.itemType[slot] === 1 ? 1.3 : 1;
        this.itemSpd[slot] = this.baseSpeed * this.speedMul * boost;
        const o = this.items[slot];
        if (o)
            o.setEnabledInHierarchy(true);
        const st = this.itemST[slot];
        if (st)
            st.anchoredPosition = new APJS.Vector2f(this.itemX[slot], this.itemY[slot]);
    }
    // ---------------------------------------------------------------- forecast
    updateFace(dt) {
        let has = false;
        try {
            const res = APJS.AlgorithmManager.getResult();
            if (res && res.getFaceCount() > 0) {
                const f = res.getFaceBaseInfo(0);
                if (f && f.rect) {
                    const r = f.rect;
                    const nx = r.x + r.width * 0.5;
                    const ny = r.y + r.height * 0.94;
                    const sx = (nx - 0.5) * SCR_W;
                    const sy = (ny - 0.5) * SCR_H;
                    // smooth so the ring does not jitter with detector noise
                    this.fx += (Math.max(-300, Math.min(300, sx)) - this.fx) * Math.min(1, dt * 18);
                    this.fy += (Math.max(-340, Math.min(520, sy)) - this.fy) * Math.min(1, dt * 18);
                    has = true;
                }
            }
        }
        catch (e) {
            has = false;
        }
        if (!has) {
            this.fx += (0 - this.fx) * Math.min(1, dt * 4);
            this.fy += (120 - this.fy) * Math.min(1, dt * 4);
        }
        if (this.ringST)
            this.ringST.anchoredPosition = new APJS.Vector2f(this.fx, this.fy);
        return has;
    }
    updateSnow(dt) {
        for (let i = 0; i < this.snow.length; i++) {
            const st = this.stOf(this.snow[i]);
            if (!st)
                continue;
            let y = st.anchoredPosition.y - (28 + i * 11) * dt;
            let x = st.anchoredPosition.x + Math.sin((y + i * 40) * 0.01) * 6 * dt;
            if (y < -680) {
                y = 680;
                x = this.rnd(-300, 300);
            }
            st.anchoredPosition = new APJS.Vector2f(x, y);
        }
    }
    // ---------------------------------------------------------------- main
    onUpdate(dt) {
        if (!this.ready)
            this.setup();
        if (!this.ready)
            return;
        if (dt > 0.1)
            dt = 0.1;
        this.updateSnow(dt);
        const hasFace = this.updateFace(dt);
        this.updateEffects(dt);
        if (this.state === STATE_CALIB) {
            if (hasFace)
                this.faceHold += dt;
            else
                this.faceHold = 0;
            if (this.faceHold > 1.2)
                this.startCountdown();
            return;
        }
        if (this.state === STATE_COUNT) {
            this.countTimer += dt;
            const step = Math.floor(this.countTimer / 0.72);
            if (step !== this.countStep && step < 4) {
                this.countStep = step;
                this.play(this.sfxClick);
                if (this.countTxt && this.countST) {
                    this.countTxt.fontSize = 190;
                    this.countTxt.opacity = 1;
                    this.countST.anchoredPosition = new APJS.Vector2f(0, 60);
                    this.countTxt.text = step === 0 ? "3" : step === 1 ? "2" : step === 2 ? "1" : "GO!";
                }
            }
            if (this.countTimer > 2.88)
                this.startPlaying();
            return;
        }
        if (this.state === STATE_PLAY) {
            this.updatePlaying(dt);
            return;
        }
    }
    updatePlaying(dt) {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.endRound();
            return;
        }
        // timer bar
        if (this.barST) {
            const k = Math.max(0, Math.min(1, this.timeLeft / this.roundSeconds));
            this.barST.sizeDelta = new APJS.Vector2f(560 * k, 20);
        }
        // spawn
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.spawnInterval / Math.min(1.6, this.speedMul);
            this.spawnOne();
        }
        const scoreBefore = this.score;
        for (let i = 0; i < this.items.length; i++) {
            if (!this.itemActive[i])
                continue;
            const st = this.itemST[i];
            if (!st)
                continue;
            this.itemY[i] -= this.itemSpd[i] * dt;
            st.anchoredPosition = new APJS.Vector2f(this.itemX[i], this.itemY[i]);
            const dx = Math.abs(this.itemX[i] - this.fx);
            const dy = Math.abs(this.itemY[i] - this.fy);
            const t = this.itemType[i];
            const reach = this.speedMul >= 1.4 ? 1.08 : 1; // P2: forgiving catch at high speed
            if (dx < this.catchRadiusX * reach && dy < this.catchRadiusY * reach) {
                // caught
                this.itemActive[i] = false;
                if (this.items[i])
                    this.items[i].setEnabledInHierarchy(false);
                if (t === 2) {
                    this.score -= 2;
                    this.showPopup("-2", this.fx, this.fy + 100, true);
                    this.addMiss(1);
                    if (this.state !== STATE_PLAY)
                        return; // round may have ended
                }
                else {
                    const gain = t === 1 ? 3 : 1;
                    this.score += gain;
                    this.correct += 1;
                    this.consec = 0;
                    this.speedMul = Math.min(1.8, 1 + 0.1 * Math.floor(this.correct / 5));
                    this.showPopup("+" + gain, this.fx, this.fy + 100, false);
                    this.triggerBurst(this.fx, this.fy);
                    if (t === 1)
                        this.play(this.sfxSuccess);
                    else
                        this.play(this.sfxPop);
                    this.refreshHud();
                }
                continue;
            }
            if (this.itemY[i] < -660) {
                this.itemActive[i] = false;
                if (this.items[i])
                    this.items[i].setEnabledInHierarchy(false);
                if (t !== 2) {
                    this.addMiss(1);
                    if (this.state !== STATE_PLAY)
                        return; // round may have ended
                }
            }
        }
        if (this.state !== STATE_PLAY)
            return;
        if (this.score !== scoreBefore)
            this.refreshHud();
    }
    // ---------------------------------------------------------------- fx
    showPopup(label, x, y, isBad) {
        if (!this.countTxt || !this.countST)
            return;
        this.countTxt.text = label;
        this.countTxt.fontSize = 96;
        this.countTxt.color = isBad ? new APJS.Color(1, 0.25, 0.25, 1) : new APJS.Color(1, 0.85, 0.3, 1);
        this.countTxt.opacity = 1;
        this.countST.anchoredPosition = new APJS.Vector2f(x, y);
        this.popupT = 0.55;
    }
    triggerBurst(x, y) {
        if (this.burstST)
            this.burstST.anchoredPosition = new APJS.Vector2f(x, y);
        if (this.burstImg)
            this.burstImg.opacity = 1;
        this.burstT = 0.35;
    }
    updateEffects(dt) {
        if (this.flashT > 0) {
            this.flashT -= dt;
            if (this.flashImg)
                this.flashImg.opacity = Math.max(0, Math.min(0.5, this.flashT * 1.6));
        }
        if (this.shakeT > 0) {
            this.shakeT -= dt;
            if (this.camTr) {
                const amp = 14 * Math.max(0, this.shakeT / 0.28);
                this.camTr.localPosition = new APJS.Vector3f((Math.random() - 0.5) * 2 * amp, (Math.random() - 0.5) * 2 * amp, 40);
            }
        }
        else if (this.camTr) {
            const p = this.camTr.localPosition;
            if (p.x !== 0 || p.y !== 0)
                this.camTr.localPosition = new APJS.Vector3f(0, 0, 40);
        }
        if (this.burstT > 0) {
            this.burstT -= dt;
            if (this.burstImg)
                this.burstImg.opacity = Math.max(0, this.burstT / 0.35);
            if (this.burstST) {
                const s = 340 + (0.35 - Math.max(0, this.burstT)) * 320;
                this.burstST.sizeDelta = new APJS.Vector2f(s, s);
            }
        }
        if (this.popupT > 0) {
            this.popupT -= dt;
            if (this.countTxt)
                this.countTxt.opacity = Math.max(0, this.popupT / 0.55);
            if (this.countST && this.countTxt) {
                const p = this.countST.anchoredPosition;
                this.countST.anchoredPosition = new APJS.Vector2f(p.x, p.y + 90 * dt);
            }
            if (this.popupT <= 0 && this.countTxt && this.state === STATE_PLAY)
                this.countTxt.text = "";
        }
    }
};
GameManager = __decorate([
    component()
], GameManager);
exports.GameManager = GameManager;
