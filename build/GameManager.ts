// 圣诞帽大作战 — Santa Cap Catcher
// Head-tracked falling-item catcher. State machine: CALIBRATION -> COUNTDOWN -> PLAYING -> RESULT.
const STATE_CALIB = 0;
const STATE_COUNT = 1;
const STATE_PLAY = 2;
const STATE_RESULT = 3;

const SCR_W = 720;
const SCR_H = 1280;

@component()
export class GameManager extends APJS.BasicScriptComponent {
  // ---------- tuning ----------
  baseSpeed: number = 300;        // px / second at speed multiplier 1.0
  spawnInterval: number = 0.85;   // seconds between spawns
  catchRadiusX: number = 118;     // forehead catch box half width (px)
  catchRadiusY: number = 112;     // forehead catch box half height (px)
  maxMiss: number = 10;
  maxConsecMiss: number = 5;
  roundSeconds: number = 45;

  // ---------- runtime state ----------
  private state: number = STATE_CALIB;
  private score: number = 0;
  private miss: number = 0;
  private consec: number = 0;
  private correct: number = 0;
  private timeLeft: number = 45;
  private speedMul: number = 1;
  private spawnTimer: number = 0;
  private countTimer: number = 0;
  private countStep: number = 0;
  private faceHold: number = 0;
  private flashT: number = 0;
  private shakeT: number = 0;
  private burstT: number = 0;
  private popupT: number = 0;
  private ready: boolean = false;

  // forehead point (screen px, origin at screen center, +Y up)
  private fx: number = 0;
  private fy: number = 120;

  // cached nodes
  private snow: APJS.SceneObject[] = [];
  private items: APJS.SceneObject[] = [];
  private itemST: APJS.ScreenTransform[] = [];
  private itemY: number[] = [];
  private itemX: number[] = [];
  private itemSpd: number[] = [];
  private itemActive: boolean[] = [];
  private itemType: number[] = [];   // 0 normal, 1 gold, 2 bad

  private calibNodes: APJS.SceneObject[] = [];
  private playNodes: APJS.SceneObject[] = [];
  private resNodes: APJS.SceneObject[] = [];

  private ringST: APJS.ScreenTransform | null = null;
  private burstImg: APJS.Image | null = null;
  private burstST: APJS.ScreenTransform | null = null;
  private flashImg: APJS.Image | null = null;
  private barST: APJS.ScreenTransform | null = null;
  private scoreTxt: APJS.Text | null = null;
  private lifeTxt: APJS.Text | null = null;
  private countTxt: APJS.Text | null = null;
  private countST: APJS.ScreenTransform | null = null;
  private resScoreTxt: APJS.Text | null = null;
  private resRankTxt: APJS.Text | null = null;
  private calibBtnImg: APJS.Image | null = null;
  private resBtnImg: APJS.Image | null = null;
  private camTr: APJS.Transform | null = null;

  private sfxClick: any = null;
  private sfxPop: any = null;
  private sfxSuccess: any = null;
  private sfxFail: any = null;

  // ---------------------------------------------------------------- helpers
  private find(name: string): APJS.SceneObject | null {
    try {
      const s = this.getSceneObject().scene as any;
      const o = s.findSceneObject(name);
      return (o as APJS.SceneObject) || null;
    } catch (e) {
      return null;
    }
  }

  private findMany(names: string[]): APJS.SceneObject[] {
    const out: APJS.SceneObject[] = [];
    for (let i = 0; i < names.length; i++) {
      const o = this.find(names[i]);
      if (o) out.push(o);
    }
    return out;
  }

  private stOf(o: APJS.SceneObject | null): APJS.ScreenTransform | null {
    if (!o) return null;
    return o.getComponent("ScreenTransform") as APJS.ScreenTransform;
  }

  private txtOf(name: string): APJS.Text | null {
    const o = this.find(name);
    if (!o) return null;
    return o.getComponent("Text") as APJS.Text;
  }

  private imgOf(name: string): APJS.Image | null {
    const o = this.find(name);
    if (!o) return null;
    return o.getComponent("Image") as APJS.Image;
  }

  private audioOf(name: string): any {
    const o = this.find(name);
    if (!o) return null;
    try {
      return o.getComponent("AudioComponent");
    } catch (e) {
      return null;
    }
  }

  private play(a: any): void {
    if (!a) return;
    try {
      a.play();
    } catch (e) {
      /* ignore */
    }
  }

  private show(nodes: APJS.SceneObject[], on: boolean): void {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]) nodes[i].setEnabledInHierarchy(on);
    }
  }

  private rnd(a: number, b: number): number {
    return a + Math.random() * (b - a);
  }

  // ---------------------------------------------------------------- lifecycle
  onStart(): void {
    this.setup();
    APJS.EventManager.getGlobalEmitter().on(APJS.EventType.RecordStart, this.onRecordStart);
    APJS.EventManager.getGlobalEmitter().on(APJS.EventType.Touch, this.onTouch);
    this.enterCalibration();
  }

  onDestroy(): void {
    APJS.EventManager.getGlobalEmitter().off(APJS.EventType.RecordStart, this.onRecordStart);
    APJS.EventManager.getGlobalEmitter().off(APJS.EventType.Touch, this.onTouch);
  }

  private setup(): void {
    if (this.ready) return;
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
      this.items.push(o as APJS.SceneObject);
      this.itemST.push(this.stOf(o) as APJS.ScreenTransform);
      this.itemY.push(0);
      this.itemX.push(0);
      this.itemSpd.push(0);
      this.itemActive.push(false);
      this.itemType.push(i === 4 ? 1 : i === 5 ? 2 : 0);
    }

    this.ringST = this.stOf(this.find("PlayRing"));
    const burst = this.find("Burst");
    this.burstST = this.stOf(burst);
    this.burstImg = burst ? (burst.getComponent("Image") as APJS.Image) : null;
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
    this.calibBtnImg = this.imgOf("CalibBtn");
    this.resBtnImg = this.imgOf("ResBtn");

    const cam = this.find("2D Camera");
    this.camTr = cam ? (cam.getComponent("Transform") as APJS.Transform) : null;

    this.sfxClick = this.audioOf("SfxClick");
    this.sfxPop = this.audioOf("SfxPop");
    this.sfxSuccess = this.audioOf("SfxSuccess");
    this.sfxFail = this.audioOf("SfxFail");

    this.ready = true;
  }

  private onRecordStart = (_e: APJS.IEvent): void => {
    this.enterCalibration();
  };

  private onTouch = (e: APJS.IEvent): void => {
    const args = (e as any).args as any[];
    if (!args || args.length === 0) return;
    const t = args[0] as APJS.TouchData;
    if (!t) return;
    if (t.phase !== APJS.TouchPhase.Began) return;
    try {
      if (this.state === STATE_CALIB && this.calibBtnImg && APJS.TouchUtils.isScreenPointOnImage(t.position, this.calibBtnImg)) {
        this.play(this.sfxClick);
        this.startCountdown();
      } else if (this.state === STATE_RESULT && this.resBtnImg && APJS.TouchUtils.isScreenPointOnImage(t.position, this.resBtnImg)) {
        this.play(this.sfxClick);
        this.enterCalibration();
      }
    } catch (err) {
      /* ignore */
    }
  };

  // ---------------------------------------------------------------- flow
  private enterCalibration(): void {
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
      if (this.items[i]) this.items[i].setEnabledInHierarchy(false);
    }
    if (this.burstImg) this.burstImg.opacity = 0;
    if (this.flashImg) this.flashImg.opacity = 0;
    if (this.countTxt) this.countTxt.text = "";
    if (this.countST) {
      this.countST.anchoredPosition = new APJS.Vector2f(0, 60);
    }
    if (this.countTxt) this.countTxt.fontSize = 190;
    if (this.ringST) this.ringST.anchoredPosition = new APJS.Vector2f(this.fx, this.fy);
    this.refreshHud();

    this.show(this.playNodes, false);
    this.show(this.resNodes, false);
    this.show(this.calibNodes, true);
  }

  private startCountdown(): void {
    if (this.state !== STATE_CALIB) return;
    this.state = STATE_COUNT;
    this.countTimer = 0;
    this.countStep = 0;
    this.show(this.calibNodes, false);
    this.show(this.playerNodes(), true);
    this.show(this.resNodes, false);
    this.refreshHud();
  }

  // gameplay nodes minus the transient ones that need special visibility rules
  private playerNodes(): APJS.SceneObject[] {
    const out: APJS.SceneObject[] = [];
    for (let i = 0; i < this.playNodes.length; i++) {
      const n = this.playNodes[i];
      if (!n) continue;
      const nm = n.name;
      if (nm.indexOf("Item") === 0) continue;
      out.push(n);
    }
    return out;
  }

  private startPlaying(): void {
    this.state = STATE_PLAY;
    this.timeLeft = this.roundSeconds;
    this.spawnTimer = 0.25;
    this.speedMul = 1;
    this.score = 0;
    this.miss = 0;
    this.consec = 0;
    this.correct = 0;
    if (this.countTxt) this.countTxt.text = "";
    this.refreshHud();
  }

  private endRound(): void {
    if (this.state === STATE_RESULT) return;
    this.state = STATE_RESULT;
    this.show(this.playNodes, false);
    this.show(this.calibNodes, false);
    this.show(this.resNodes, true);
    if (this.burstImg) this.burstImg.opacity = 0;
    if (this.flashImg) this.flashImg.opacity = 0;
    if (this.camTr) this.camTr.localPosition = new APJS.Vector3f(0, 0, 40);

    let rank = "手残圣诞老人的临时工";
    if (this.score > 15) rank = "圣诞本老";
    else if (this.score > 5) rank = "灵活的圣诞小精灵";

    if (this.resScoreTxt) this.resScoreTxt.text = "本局得分 " + Math.max(0, this.score);
    if (this.resRankTxt) this.resRankTxt.text = rank;
    this.play(this.sfxSuccess);
  }

  private refreshHud(): void {
    if (this.scoreTxt) this.scoreTxt.text = "得分 " + Math.max(0, this.score);
    if (this.lifeTxt) this.lifeTxt.text = "未接 " + this.miss + "/" + this.maxMiss;
  }

  private addMiss(n: number): void {
    this.miss += n;
    this.consec += n;
    this.flashT = 0.32;
    this.shakeT = 0.28;
    this.play(this.sfxFail);
    this.refreshHud();
    if (this.miss >= this.maxMiss || this.consec >= this.maxConsecMiss) this.endRound();
  }

  // ---------------------------------------------------------------- spawn
  private spawnOne(): void {
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
    if (slot < 0) return;

    this.itemActive[slot] = true;
    this.itemX[slot] = this.rnd(-260, 250);
    this.itemY[slot] = 560;
    const boost = this.itemType[slot] === 1 ? 1.3 : 1;
    this.itemSpd[slot] = this.baseSpeed * this.speedMul * boost;
    const o = this.items[slot];
    if (o) o.setEnabledInHierarchy(true);
    const st = this.itemST[slot];
    if (st) st.anchoredPosition = new APJS.Vector2f(this.itemX[slot], this.itemY[slot]);
  }

  // ---------------------------------------------------------------- forecast
  private updateFace(dt: number): boolean {
    let has = false;
    try {
      const res = APJS.AlgorithmManager.getResult() as any;
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
    } catch (e) {
      has = false;
    }
    if (!has) {
      this.fx += (0 - this.fx) * Math.min(1, dt * 4);
      this.fy += (120 - this.fy) * Math.min(1, dt * 4);
    }
    if (this.ringST) this.ringST.anchoredPosition = new APJS.Vector2f(this.fx, this.fy);
    return has;
  }

  private updateSnow(dt: number): void {
    for (let i = 0; i < this.snow.length; i++) {
      const st = this.stOf(this.snow[i]);
      if (!st) continue;
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
  onUpdate(dt: number): void {
    if (!this.ready) this.setup();
    if (!this.ready) return;
    if (dt > 0.1) dt = 0.1;

    this.updateSnow(dt);
    const hasFace = this.updateFace(dt);
    this.updateEffects(dt);

    if (this.state === STATE_CALIB) {
      if (hasFace) this.faceHold += dt;
      else this.faceHold = 0;
      if (this.faceHold > 1.2) this.startCountdown();
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
      if (this.countTimer > 2.88) this.startPlaying();
      return;
    }

    if (this.state === STATE_PLAY) {
      this.updatePlaying(dt);
      return;
    }
  }

  private updatePlaying(dt: number): void {
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
      if (!this.itemActive[i]) continue;
      const st = this.itemST[i];
      if (!st) continue;
      this.itemY[i] -= this.itemSpd[i] * dt;
      st.anchoredPosition = new APJS.Vector2f(this.itemX[i], this.itemY[i]);

      const dx = Math.abs(this.itemX[i] - this.fx);
      const dy = Math.abs(this.itemY[i] - this.fy);
      const t = this.itemType[i];

      if (dx < this.catchRadiusX && dy < this.catchRadiusY) {
        // caught
        this.itemActive[i] = false;
        if (this.items[i]) this.items[i].setEnabledInHierarchy(false);
        if (t === 2) {
          this.score -= 2;
          this.showPopup("-2", this.fx, this.fy + 100, true);
          this.addMiss(1);
        } else {
          const gain = t === 1 ? 3 : 1;
          this.score += gain;
          this.correct += 1;
          this.consec = 0;
          this.speedMul = Math.min(1.8, 1 + 0.1 * Math.floor(this.correct / 5));
          this.showPopup("+" + gain, this.fx, this.fy + 100, false);
          this.triggerBurst(this.fx, this.fy);
          if (t === 1) this.play(this.sfxSuccess);
          else this.play(this.sfxPop);
          this.refreshHud();
        }
        continue;
      }

      if (this.itemY[i] < -660) {
        this.itemActive[i] = false;
        if (this.items[i]) this.items[i].setEnabledInHierarchy(false);
        if (t !== 2) this.addMiss(1);
      }
    }

    if (this.state !== STATE_PLAY) return;
    if (this.score !== scoreBefore) this.refreshHud();
  }

  // ---------------------------------------------------------------- fx
  private showPopup(label: string, x: number, y: number, isBad: boolean): void {
    if (!this.countTxt || !this.countST) return;
    this.countTxt.text = label;
    this.countTxt.fontSize = 96;
    this.countTxt.color = isBad ? new APJS.Color(1, 0.25, 0.25, 1) : new APJS.Color(1, 0.85, 0.3, 1);
    this.countTxt.opacity = 1;
    this.countST.anchoredPosition = new APJS.Vector2f(x, y);
    this.popupT = 0.55;
  }

  private triggerBurst(x: number, y: number): void {
    if (this.burstST) this.burstST.anchoredPosition = new APJS.Vector2f(x, y);
    if (this.burstImg) this.burstImg.opacity = 1;
    this.burstT = 0.35;
  }

  private updateEffects(dt: number): void {
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashImg) this.flashImg.opacity = Math.max(0, Math.min(0.5, this.flashT * 1.6));
    }
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      if (this.camTr) {
        const amp = 14 * Math.max(0, this.shakeT / 0.28);
        this.camTr.localPosition = new APJS.Vector3f(
          (Math.random() - 0.5) * 2 * amp,
          (Math.random() - 0.5) * 2 * amp,
          40
        );
      }
    } else if (this.camTr) {
      const p = this.camTr.localPosition;
      if (p.x !== 0 || p.y !== 0) this.camTr.localPosition = new APJS.Vector3f(0, 0, 40);
    }
    if (this.burstT > 0) {
      this.burstT -= dt;
      if (this.burstImg) this.burstImg.opacity = Math.max(0, this.burstT / 0.35);
      if (this.burstST) {
        const s = 340 + (0.35 - Math.max(0, this.burstT)) * 320;
        this.burstST.sizeDelta = new APJS.Vector2f(s, s);
      }
    }
    if (this.popupT > 0) {
      this.popupT -= dt;
      if (this.countTxt) this.countTxt.opacity = Math.max(0, this.popupT / 0.55);
      if (this.countST && this.countTxt) {
        const p = this.countST.anchoredPosition;
        this.countST.anchoredPosition = new APJS.Vector2f(p.x, p.y + 90 * dt);
      }
      if (this.popupT <= 0 && this.countTxt && this.state === STATE_PLAY) this.countTxt.text = "";
    }
  }
}
