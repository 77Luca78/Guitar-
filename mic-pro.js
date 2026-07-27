/*
 * Luca Guitar Quest – Mikrofon Pro
 * Eigenständige Audio-Erweiterung für iPad/Safari.
 * Keine Yousician-Assets oder proprietären Algorithmen werden verwendet.
 */
(() => {
  'use strict';

  const VERSION = '2.0.0';
  const STORAGE_KEY = 'lq-mic-pro-settings-v2';
  const REC_DB = 'lq-mic-recordings';
  const REC_STORE = 'recordings';

  const defaults = {
    preset: 'acoustic-normal',
    inputGain: 5.0,
    gateDb: -64,
    confidence: 0.38,
    minFrequency: 65,
    maxFrequency: 1050,
    analysisMode: 'balanced',
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    selectedDeviceId: '',
    monitor: false,
    monitorVolume: 0.08,
    autoRecord: false,
    recordProcessed: true,
    onsetSensitivity: 0.018,
    noteHoldMs: 90
  };

  const presets = {
    'acoustic-quiet': {inputGain: 8.0, gateDb: -70, confidence: 0.32, onsetSensitivity: 0.011, noteHoldMs: 70},
    'acoustic-normal': {inputGain: 5.0, gateDb: -64, confidence: 0.38, onsetSensitivity: 0.016, noteHoldMs: 90},
    'electric-unplugged': {inputGain: 10.0, gateDb: -72, confidence: 0.30, onsetSensitivity: 0.009, noteHoldMs: 65},
    'loud-room': {inputGain: 2.4, gateDb: -46, confidence: 0.55, onsetSensitivity: 0.035, noteHoldMs: 120},
    'custom': {}
  };

  let settings = loadSettings();
  let highPass = null;
  let lowPass = null;
  let inputGainNode = null;
  let compressor = null;
  let recordDestination = null;
  let monitorGainNode = null;
  let waveformCanvas = null;
  let waveformCtx = null;
  let micPanel = null;
  let mediaRecorder = null;
  let recordChunks = [];
  let recordingStartedAt = 0;
  let recordingPausedAt = 0;
  let recordingPausedTotal = 0;
  let recordingTimer = null;
  let lastRecordingUrl = '';
  let lastRecordingBlob = null;
  let previousRms = 0;
  let lastOnsetAt = 0;
  let lastAcceptedPitchAt = 0;
  let acceptedPitchBuffer = [];
  let calibrationRunning = false;
  let micRestarting = false;
  let originalTogglePlay = null;
  let recDbPromise = null;
  let recordingListUrls = [];

  function loadSettings(){
    try { return {...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}; }
    catch { return {...defaults}; }
  }
  function saveSettings(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    updateControlValues();
  }
  function dbToLinear(db){ return Math.pow(10, db / 20); }
  function linearToDb(value){ return 20 * Math.log10(Math.max(value, 1e-8)); }
  function clampLocal(value, min, max){ return Math.min(max, Math.max(min, value)); }
  function medianLocal(values){
    if(!values.length) return 0;
    const sorted = [...values].sort((a,b)=>a-b);
    const mid = Math.floor(sorted.length/2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;
  }
  function percentile(values, p){
    if(!values.length) return 0;
    const sorted=[...values].sort((a,b)=>a-b);
    return sorted[Math.min(sorted.length-1, Math.max(0, Math.round((sorted.length-1)*p)))];
  }
  function safeName(name='aufnahme'){
    return name.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,70) || 'aufnahme';
  }

  function injectStyles(){
    if(document.getElementById('lq-mic-pro-style')) return;
    const style=document.createElement('style');
    style.id='lq-mic-pro-style';
    style.textContent=`
      .mic-pro-trigger{border:1px solid rgba(24,227,179,.55)!important;background:rgba(24,227,179,.12)!important;color:#7fffe0!important}
      .mic-pro-trigger.recording{background:rgba(255,82,104,.18)!important;border-color:#ff5268!important;color:#ff9cab!important;animation:micPulse 1.15s infinite}
      @keyframes micPulse{50%{box-shadow:0 0 0 7px rgba(255,82,104,.08)}}
      .mic-pro-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.64);backdrop-filter:blur(5px);z-index:10000;display:none;align-items:flex-end;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))}
      .mic-pro-backdrop.open{display:flex}
      .mic-pro-sheet{width:min(980px,100%);max-height:min(92vh,900px);overflow:auto;background:#15191e;border:1px solid #394149;border-radius:26px;box-shadow:0 28px 90px rgba(0,0,0,.58);color:#f5f7f8;padding:18px}
      .mic-pro-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;position:sticky;top:-18px;background:linear-gradient(#15191e 80%,transparent);padding:18px 0 13px;z-index:2}
      .mic-pro-head h2{margin:0;font-size:1.35rem}.mic-pro-head p{margin:.25rem 0 0;color:#aeb6bd}.mic-pro-close{width:42px;height:42px;border-radius:50%;border:1px solid #3c444c;background:#232930;color:#fff;font-size:1.35rem}
      .mic-pro-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.mic-pro-card{background:#1c2228;border:1px solid #323a42;border-radius:18px;padding:14px}.mic-pro-card.full{grid-column:1/-1}.mic-pro-card h3{margin:.1rem 0 .8rem}
      .mic-pro-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin:.65rem 0}.mic-pro-row.stack{grid-template-columns:1fr}.mic-pro-row label{color:#dce2e6;margin:0}.mic-pro-row small{display:block;color:#9fa8af;margin-top:3px}.mic-pro-row input[type=range]{width:100%;accent-color:#18e3b3}.mic-pro-row select{width:100%;background:#0e1216;color:#fff;border:1px solid #3a434b;border-radius:12px;padding:.65rem}
      .mic-pro-value{font-variant-numeric:tabular-nums;color:#7fffe0;min-width:76px;text-align:right}.mic-pro-switch{display:flex;align-items:center;gap:8px}.mic-pro-switch input{width:20px;height:20px;accent-color:#18e3b3}
      .mic-pro-actions{display:flex;flex-wrap:wrap;gap:8px}.mic-pro-btn{border:1px solid #3b464f;background:#252c33;color:#fff;border-radius:13px;padding:.7rem .9rem;font-weight:700}.mic-pro-btn.primary{background:linear-gradient(135deg,#18e3b3,#11b7ff);border:0;color:#071411}.mic-pro-btn.danger{border-color:#ff657c;color:#ffb0bc}.mic-pro-btn:disabled{opacity:.45}
      .mic-pro-status{border-radius:13px;padding:.75rem;background:#0f1418;color:#aeb6bd;white-space:pre-line}.mic-pro-status.good{color:#63f0ac}.mic-pro-status.warn{color:#ffd278}.mic-pro-status.bad{color:#ff8293}
      .mic-pro-meter{height:13px;background:#090d10;border:1px solid #353e45;border-radius:999px;overflow:hidden}.mic-pro-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#18e3b3,#ffcf59,#ff657c);transition:width .06s linear}.mic-pro-wave{width:100%;height:110px;background:#0c1013;border:1px solid #303941;border-radius:15px;display:block}
      .mic-pro-rec-time{font-size:1.5rem;font-weight:900;font-variant-numeric:tabular-nums}.mic-pro-recording-item{display:grid;grid-template-columns:1fr auto;gap:9px;align-items:center;padding:.7rem 0;border-bottom:1px solid #30373e}.mic-pro-recording-item:last-child{border-bottom:0}.mic-pro-recording-item audio{width:100%;margin-top:.45rem}
      .mic-pro-livebar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:.7rem}.mic-pro-chip{padding:.35rem .55rem;border-radius:999px;background:#10161a;border:1px solid #354048;color:#cbd3d8;font-size:.86rem}.mic-pro-chip strong{color:#7fffe0}
      @media(max-width:760px){.mic-pro-grid{grid-template-columns:1fr}.mic-pro-card.full{grid-column:auto}.mic-pro-sheet{border-radius:22px 22px 0 0;padding:14px}.mic-pro-backdrop{padding:0;align-items:flex-end}.mic-pro-head{top:-14px;padding:14px 0 10px}}
    `;
    document.head.appendChild(style);
  }

  function injectUI(){
    if(document.getElementById('micProBackdrop')) return;
    injectStyles();
    const backdrop=document.createElement('div');
    backdrop.id='micProBackdrop';
    backdrop.className='mic-pro-backdrop';
    backdrop.innerHTML=`
      <section class="mic-pro-sheet" role="dialog" aria-modal="true" aria-labelledby="micProTitle">
        <header class="mic-pro-head">
          <div><h2 id="micProTitle">Mikrofon Pro</h2><p>Empfindlichkeit, Kalibrierung, Live-Feedback und Aufnahme</p></div>
          <button id="micProClose" class="mic-pro-close" aria-label="Schließen">×</button>
        </header>
        <div class="mic-pro-grid">
          <div class="mic-pro-card">
            <h3>Eingang</h3>
            <div class="mic-pro-row stack"><label>Audioquelle</label><select id="micProDevice"><option value="">Automatisch / iPad-Mikrofon</option></select></div>
            <div class="mic-pro-row stack"><label>Profil</label><select id="micProPreset"><option value="acoustic-quiet">Akustik · leise</option><option value="acoustic-normal">Akustik · normal</option><option value="electric-unplugged">E-Gitarre unverstärkt</option><option value="loud-room">Laute Umgebung</option><option value="custom">Benutzerdefiniert</option></select></div>
            <div class="mic-pro-row"><label>Empfindlichkeit <small>Digitale Verstärkung nach dem iPad-Mikrofon</small></label><b id="micProGainValue" class="mic-pro-value">5,0×</b></div>
            <input id="micProGain" type="range" min="1" max="12" step="0.25">
            <div class="mic-pro-row"><label>Raushshwelle <small>Niedriger = leisere Töne werden erkannt</small></label><b id="micProGateValue" class="mic-pro-value">−64 dB</b></div>
            <input id="micProGate" type="range" min="-80" max="-25" step="1">
            <div class="mic-pro-row"><label>Erkennungssicherheit <small>Niedriger reagiert schneller, aber empfindlicher auf Nebengeräusche</small></label><b id="micProConfidenceValue" class="mic-pro-value">38 %</b></div>
            <input id="micProConfidence" type="range" min="25" max="85" step="1">
          </div>

          <div class="mic-pro-card">
            <h3>Signalverarbeitung</h3>
            <div class="mic-pro-row stack"><label>Analysemodus</label><select id="micProAnalysisMode"><option value="fast">Schnell · geringe Latenz</option><option value="balanced">Ausgewogen</option><option value="precision">Präzise · stabiler bei tiefen Tönen</option></select></div>
            <label class="mic-pro-switch"><input id="micProEcho" type="checkbox"> Echo-Unterdrückung</label>
            <label class="mic-pro-switch"><input id="micProNoise" type="checkbox"> Browser-Rauschunterdrückung</label>
            <label class="mic-pro-switch"><input id="micProAutoGain" type="checkbox"> Automatische Browser-Verstärkung</label>
            <p style="color:#9fa8af">Für Gitarre bleiben diese drei Optionen normalerweise aus, weil Sprachfilter Obertöne verändern können. Änderungen daran starten das Mikrofon neu.</p>
            <label class="mic-pro-switch"><input id="micProMonitor" type="checkbox"> Eingang mithören <small>(nur mit Kopfhörern)</small></label>
            <div class="mic-pro-row"><label>Monitor-Lautstärke</label><b id="micProMonitorValue" class="mic-pro-value">8 %</b></div>
            <input id="micProMonitorVolume" type="range" min="0" max="30" step="1">
            <div class="mic-pro-actions" style="margin-top:12px"><button id="micProRestart" class="mic-pro-btn primary">Mikrofon neu starten</button><button id="micProCalibrate" class="mic-pro-btn">Automatisch kalibrieren</button></div>
          </div>

          <div class="mic-pro-card full">
            <h3>Live-Signal</h3>
            <canvas id="micProWaveform" class="mic-pro-wave" width="900" height="160"></canvas>
            <div class="mic-pro-livebar"><span class="mic-pro-chip">Pegel <strong id="micProLevel">0 %</strong></span><span class="mic-pro-chip">RMS <strong id="micProDb">−∞ dB</strong></span><span class="mic-pro-chip">Ton <strong id="micProPitch">–</strong></span><span class="mic-pro-chip">Sicherheit <strong id="micProClarity">0 %</strong></span><span class="mic-pro-chip">Latenz <strong id="micProLatency">–</strong></span></div>
            <div class="mic-pro-meter" style="margin-top:10px"><i id="micProMeterBar"></i></div>
            <div id="micProStatus" class="mic-pro-status" style="margin-top:10px">Bereit.</div>
          </div>

          <div class="mic-pro-card full">
            <h3>Aufnahme während des Spielens</h3>
            <label class="mic-pro-switch"><input id="micProAutoRecord" type="checkbox"> Aufnahme automatisch mit dem Player starten und stoppen</label>
            <label class="mic-pro-switch"><input id="micProProcessedRecord" type="checkbox"> Gefiltertes und verstärktes Gitarrensignal aufnehmen</label>
            <div class="mic-pro-actions" style="margin-top:12px"><button id="micProRecordStart" class="mic-pro-btn primary">● Aufnahme starten</button><button id="micProRecordStop" class="mic-pro-btn danger" disabled>■ Stoppen</button><span id="micProRecordTime" class="mic-pro-rec-time">0:00</span></div>
            <div id="micProRecordingPreview" style="margin-top:12px"></div>
            <div id="micProRecordings" style="margin-top:12px"></div>
          </div>
        </div>
      </section>`;
    document.body.appendChild(backdrop);
    micPanel=backdrop;
    waveformCanvas=document.getElementById('micProWaveform');
    waveformCtx=waveformCanvas.getContext('2d');

    document.getElementById('micProClose').onclick=closePanel;
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)closePanel()});
    bindControlEvents();
    addTriggerButtons();
    updateControlValues();
    loadRecordings();
  }

  function addTriggerButtons(){
    const playerMic=document.getElementById('playerMicBtn');
    if(playerMic && !document.getElementById('micProPlayerBtn')){
      const btn=document.createElement('button');
      btn.id='micProPlayerBtn';btn.className='toggle-button mic-pro-trigger';btn.textContent='Mikro-Pro';btn.onclick=openPanel;
      playerMic.insertAdjacentElement('afterend',btn);
    }
    const tunerActions=document.querySelector('.tuner-actions');
    if(tunerActions && !document.getElementById('micProTunerBtn')){
      const btn=document.createElement('button');
      btn.id='micProTunerBtn';btn.className='button secondary mic-pro-trigger';btn.textContent='Mikrofon einstellen';btn.onclick=openPanel;
      tunerActions.appendChild(btn);
    }
  }

  function openPanel(){
    injectUI();
    micPanel.classList.add('open');
    document.body.style.overflow='hidden';
    enumerateInputs();
    updateControlValues();
  }
  function closePanel(){
    if(!micPanel) return;
    micPanel.classList.remove('open');
    document.body.style.overflow='';
  }
  function panelStatus(text,kind=''){
    const el=document.getElementById('micProStatus');
    if(!el) return;
    el.textContent=text;el.className=`mic-pro-status ${kind}`;
  }

  function updateControlValues(){
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value};
    const check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value};
    set('micProPreset',settings.preset);set('micProGain',settings.inputGain);set('micProGate',settings.gateDb);set('micProConfidence',Math.round(settings.confidence*100));set('micProAnalysisMode',settings.analysisMode);set('micProMonitorVolume',Math.round(settings.monitorVolume*100));set('micProDevice',settings.selectedDeviceId);
    check('micProEcho',settings.echoCancellation);check('micProNoise',settings.noiseSuppression);check('micProAutoGain',settings.autoGainControl);check('micProMonitor',settings.monitor);check('micProAutoRecord',settings.autoRecord);check('micProProcessedRecord',settings.recordProcessed);
    const text=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
    text('micProGainValue',`${Number(settings.inputGain).toFixed(2).replace('.',',')}×`);text('micProGateValue',`${String(settings.gateDb).replace('-','−')} dB`);text('micProConfidenceValue',`${Math.round(settings.confidence*100)} %`);text('micProMonitorValue',`${Math.round(settings.monitorVolume*100)} %`);
    applyLiveNodeSettings();
  }

  function bindControlEvents(){
    const on=(id,event,handler)=>{const el=document.getElementById(id);if(el)el.addEventListener(event,handler)};
    on('micProPreset','change',e=>{settings.preset=e.target.value;Object.assign(settings,presets[e.target.value]||{});saveSettings()});
    on('micProGain','input',e=>{settings.inputGain=Number(e.target.value);settings.preset='custom';saveSettings()});
    on('micProGate','input',e=>{settings.gateDb=Number(e.target.value);settings.preset='custom';saveSettings()});
    on('micProConfidence','input',e=>{settings.confidence=Number(e.target.value)/100;settings.preset='custom';saveSettings()});
    on('micProAnalysisMode','change',e=>{settings.analysisMode=e.target.value;saveSettings();restartMicIfActive()});
    on('micProDevice','change',e=>{settings.selectedDeviceId=e.target.value;saveSettings();restartMicIfActive()});
    on('micProEcho','change',e=>{settings.echoCancellation=e.target.checked;saveSettings();restartMicIfActive()});
    on('micProNoise','change',e=>{settings.noiseSuppression=e.target.checked;saveSettings();restartMicIfActive()});
    on('micProAutoGain','change',e=>{settings.autoGainControl=e.target.checked;saveSettings();restartMicIfActive()});
    on('micProMonitor','change',e=>{settings.monitor=e.target.checked;saveSettings();applyLiveNodeSettings()});
    on('micProMonitorVolume','input',e=>{settings.monitorVolume=Number(e.target.value)/100;saveSettings();applyLiveNodeSettings()});
    on('micProAutoRecord','change',e=>{settings.autoRecord=e.target.checked;saveSettings()});
    on('micProProcessedRecord','change',e=>{settings.recordProcessed=e.target.checked;saveSettings()});
    on('micProRestart','click',()=>restartMicIfActive(true));
    on('micProCalibrate','click',runCalibration);
    on('micProRecordStart','click',startRecording);
    on('micProRecordStop','click',stopRecording);
  }

  function applyLiveNodeSettings(){
    if(inputGainNode && audioCtx){ inputGainNode.gain.setTargetAtTime(settings.inputGain,audioCtx.currentTime,.015); }
    if(monitorGainNode && audioCtx){ monitorGainNode.gain.setTargetAtTime(settings.monitor?settings.monitorVolume:0,audioCtx.currentTime,.02); }
  }

  async function enumerateInputs(){
    const select=document.getElementById('micProDevice');if(!select||!navigator.mediaDevices?.enumerateDevices)return;
    try{
      const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput');
      const current=settings.selectedDeviceId;
      select.innerHTML='<option value="">Automatisch / iPad-Mikrofon</option>'+devices.map((d,i)=>`<option value="${d.deviceId}">${escapeHtml(d.label||`Mikrofon ${i+1}`)}</option>`).join('');
      select.value=devices.some(d=>d.deviceId===current)?current:'';
    }catch(err){ panelStatus(`Audioquellen konnten nicht gelesen werden: ${err.message}`,'warn'); }
  }
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

  async function restartMicIfActive(force=false){
    if(micRestarting)return;
    const wasActive=!!micStream?.active;
    if(!wasActive&&!force){panelStatus('Die Einstellung ist gespeichert und wird beim nächsten Mikrofonstart verwendet.','good');return}
    micRestarting=true;
    try{
      stopMic('Mikrofon wird neu gestartet …');
      const ok=await startMic(document.getElementById('screen-player')?.classList.contains('active')?'player':'tuner');
      panelStatus(ok?'Mikrofon mit den neuen Einstellungen neu gestartet.':'Mikrofon konnte nicht neu gestartet werden.',ok?'good':'bad');
    } finally { micRestarting=false; }
  }

  function analysisConfig(){
    if(settings.analysisMode==='fast')return{fftSize:2048,interval:32,minHold:55};
    if(settings.analysisMode==='precision')return{fftSize:8192,interval:72,minHold:120};
    return{fftSize:4096,interval:48,minHold:settings.noteHoldMs||90};
  }

  function buildConstraints(){
    const audio={
      channelCount:{ideal:1},
      sampleRate:{ideal:48000},
      sampleSize:{ideal:24},
      echoCancellation:settings.echoCancellation,
      noiseSuppression:settings.noiseSuppression,
      autoGainControl:settings.autoGainControl
    };
    if(settings.selectedDeviceId) audio.deviceId={ideal:settings.selectedDeviceId};
    return{audio,video:false};
  }

  function disconnectNodes(){
    [micSource,highPass,lowPass,inputGainNode,compressor,analyser,recordDestination,monitorGainNode].forEach(node=>{try{node?.disconnect?.()}catch{}});
    highPass=lowPass=inputGainNode=compressor=recordDestination=monitorGainNode=null;
  }

  const baseStopMic = typeof stopMic==='function'?stopMic:null;

  startMic = async function(origin='tuner'){
    if(micStream?.active){
      if(origin==='player')state.player.mic=true;
      updateMicButtons(true);applyLiveNodeSettings();return true;
    }
    const env=updateMicEnvironmentUI();
    if(!env.secure){setMicStatus('Kein Mikrofonzugriff: Öffne die App über ihre HTTPS-Adresse.','bad');return false}
    if(!env.hasAPI){setMicStatus('Safari stellt die Mikrofon-Schnittstelle nicht bereit.','bad');return false}
    try{
      await queryMicPermission();
      await ensureAudioContext();
      micStream=await navigator.mediaDevices.getUserMedia(buildConstraints());
      const track=micStream.getAudioTracks()[0];
      if(!track||track.readyState!=='live')throw new Error('Der Mikrofonkanal ist nicht aktiv.');
      disconnectNodes();
      micSource=audioCtx.createMediaStreamSource(micStream);
      highPass=audioCtx.createBiquadFilter();highPass.type='highpass';highPass.frequency.value=55;highPass.Q.value=.65;
      lowPass=audioCtx.createBiquadFilter();lowPass.type='lowpass';lowPass.frequency.value=1700;lowPass.Q.value=.55;
      inputGainNode=audioCtx.createGain();inputGainNode.gain.value=settings.inputGain;
      compressor=audioCtx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=.003;compressor.release.value=.16;
      analyser=audioCtx.createAnalyser();const cfg=analysisConfig();analyser.fftSize=cfg.fftSize;analyser.smoothingTimeConstant=.04;
      recordDestination=audioCtx.createMediaStreamDestination();
      monitorGainNode=audioCtx.createGain();monitorGainNode.gain.value=settings.monitor?settings.monitorVolume:0;
      micSource.connect(highPass).connect(lowPass).connect(inputGainNode).connect(compressor);
      compressor.connect(analyser);compressor.connect(recordDestination);compressor.connect(monitorGainNode).connect(audioCtx.destination);
      timeData=new Float32Array(analyser.fftSize);freqData=new Uint8Array(analyser.frequencyBinCount);
      pitchHistory=[];acceptedPitchBuffer=[];lastMicFrame=0;lastStrongSignalAt=performance.now();lastMicError='';previousRms=0;lastOnsetAt=0;
      if(origin==='player')state.player.mic=true;
      updateMicButtons(true);setMicStatus('Mikrofon Pro läuft. Leise Töne werden verstärkt; die Raushshwelle ist anpassbar.','good');
      panelStatus(`Mikrofon aktiv · ${track.label||'iPad-Mikrofon'} · ${track.getSettings?.().sampleRate||audioCtx.sampleRate} Hz`,'good');
      await enumerateInputs();
      micLoopId=requestAnimationFrame(micLoop);
      return true;
    }catch(err){
      lastMicError=`${err.name||'Fehler'}: ${err.message||err}`;
      const messages={NotAllowedError:'Mikrofonzugriff wurde abgelehnt. Erlaube ihn in Safari für diese Website.',SecurityError:'Mikrofon ist in dieser Umgebung blockiert.',NotFoundError:'Kein Mikrofon gefunden.',NotReadableError:'Das Mikrofon wird möglicherweise von einer anderen App verwendet.',AbortError:'Der Mikrofonstart wurde abgebrochen.',OverconstrainedError:'Die gewünschte Mikrofoneinstellung wird vom Gerät nicht unterstützt.'};
      setMicStatus(messages[err.name]||`Mikrofon konnte nicht gestartet werden: ${err.message||err}`,'bad');
      panelStatus(messages[err.name]||lastMicError,'bad');
      updateMicButtons(false);return false;
    }
  };

  stopMic = function(reason='Mikrofon gestoppt.'){
    state.player.mic=false;
    if(micLoopId)cancelAnimationFrame(micLoopId);micLoopId=null;
    if(mediaRecorder?.state==='recording')stopRecording();
    disconnectNodes();
    if(micStream)micStream.getTracks().forEach(t=>t.stop());
    micStream=null;analyser=null;timeData=null;freqData=null;pitchHistory=[];acceptedPitchBuffer=[];
    updateMicButtons(false);setMicStatus(reason,'normal');panelStatus(reason);
    const detected=document.getElementById('liveDetectedNote');if(detected)detected.textContent='–';
  };

  detectPitchYIN = function(buf,sampleRate){
    const minFreq=settings.minFrequency||65,maxFreq=settings.maxFrequency||1050;
    const minTau=Math.max(2,Math.floor(sampleRate/maxFreq));
    const maxTau=Math.min(Math.floor(sampleRate/minFreq),Math.floor(buf.length/2)-2);
    const threshold=settings.analysisMode==='fast'?.30:settings.analysisMode==='precision'?.20:.24;
    const diff=new Float32Array(maxTau+1),cmnd=new Float32Array(maxTau+1);
    let running=0;
    const limit=buf.length-maxTau;
    for(let tau=minTau;tau<=maxTau;tau++){
      let sum=0;
      for(let i=0;i<limit;i+=2){const d=buf[i]-buf[i+tau];sum+=d*d}
      diff[tau]=sum;
    }
    cmnd[minTau]=1;
    for(let tau=minTau+1;tau<=maxTau;tau++){
      running+=diff[tau];cmnd[tau]=running?diff[tau]*(tau-minTau)/running:1;
    }
    let tau=-1;
    for(let t=minTau+2;t<maxTau-1;t++){
      if(cmnd[t]<threshold&&cmnd[t]<=cmnd[t-1]&&cmnd[t]<cmnd[t+1]){tau=t;while(tau+1<maxTau&&cmnd[tau+1]<cmnd[tau])tau++;break}
    }
    if(tau<0){let best=.55;for(let t=minTau+2;t<maxTau-1;t++){if(cmnd[t]<best){best=cmnd[t];tau=t}}if(tau<0)return null}
    const x0=cmnd[tau-1],x1=cmnd[tau],x2=cmnd[tau+1],den=2*x1-x2-x0;
    const refined=Math.abs(den)>1e-9?tau+(x2-x0)/(2*den):tau;
    let frequency=sampleRate/refined;
    if(!Number.isFinite(frequency)||frequency<minFreq||frequency>maxFreq)return null;
    const clarity=clampLocal(1-cmnd[tau],0,1);
    return{frequency,clarity,tau:refined};
  };

  function stablePitch(pitch,now){
    const midiFloat=69+12*Math.log2(pitch.frequency/440);
    acceptedPitchBuffer.push({frequency:pitch.frequency,midiFloat,clarity:pitch.clarity,time:now});
    acceptedPitchBuffer=acceptedPitchBuffer.filter(x=>now-x.time<420).slice(-7);
    const medianMidi=medianLocal(acceptedPitchBuffer.map(x=>x.midiFloat));
    const same=acceptedPitchBuffer.filter(x=>Math.abs(x.midiFloat-medianMidi)<.45);
    if(same.length<2 && settings.analysisMode!=='fast')return null;
    return{frequency:medianLocal(same.map(x=>x.frequency))||pitch.frequency,clarity:medianLocal(same.map(x=>x.clarity))||pitch.clarity};
  }

  function updateProSignal(rms,pitch){
    const db=linearToDb(rms);const level=clampLocal((db+80)/60*100,0,100);
    const text=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
    const bar=document.getElementById('micProMeterBar');if(bar)bar.style.width=`${level}%`;
    text('micProLevel',`${Math.round(level)} %`);text('micProDb',Number.isFinite(db)?`${db.toFixed(1).replace('.',',')} dB`:'−∞ dB');
    text('micProClarity',`${Math.round((pitch?.clarity||0)*100)} %`);
    text('micProLatency',`${Math.round((audioCtx?.baseLatency||0)*1000)} ms`);
    if(pitch){const midi=Math.round(69+12*Math.log2(pitch.frequency/440));text('micProPitch',`${typeof noteName==='function'?noteName(midi):midi} · ${pitch.frequency.toFixed(1)} Hz`)}
    drawWaveform();
  }

  function drawWaveform(){
    if(!waveformCtx||!waveformCanvas||!timeData)return;
    const w=waveformCanvas.width,h=waveformCanvas.height;waveformCtx.clearRect(0,0,w,h);waveformCtx.fillStyle='#0c1013';waveformCtx.fillRect(0,0,w,h);waveformCtx.strokeStyle='#18e3b3';waveformCtx.lineWidth=2;waveformCtx.beginPath();
    const step=Math.max(1,Math.floor(timeData.length/w));
    for(let x=0;x<w;x++){const y=(.5-timeData[Math.min(timeData.length-1,x*step)]*.42)*h;if(x===0)waveformCtx.moveTo(x,y);else waveformCtx.lineTo(x,y)}
    waveformCtx.stroke();waveformCtx.strokeStyle='rgba(255,255,255,.12)';waveformCtx.beginPath();waveformCtx.moveTo(0,h/2);waveformCtx.lineTo(w,h/2);waveformCtx.stroke();
  }

  micLoop = function(now=performance.now()){
    if(!analyser||!timeData)return;
    const cfg=analysisConfig();
    if(now-lastMicFrame<cfg.interval){micLoopId=requestAnimationFrame(micLoop);return}
    lastMicFrame=now;
    analyser.getFloatTimeDomainData(timeData);if(freqData)analyser.getByteFrequencyData(freqData);
    const sig=signalRms(timeData);const gate=dbToLinear(settings.gateDb);
    updateSignalUI(sig.rms,0);updateProSignal(sig.rms,null);

    if(sig.rms<gate){
      if(now-lastStrongSignalAt>550){
        const msg=`Signal unter Raushshwelle (${linearToDb(sig.rms).toFixed(1)} dB / Grenze ${settings.gateDb} dB). Empfindlichkeit erhöhen oder automatisch kalibrieren.`;
        const info=document.getElementById('tunerInfo');if(info)info.textContent=msg;
        const detail=document.getElementById('livePitchDetail');if(detail)detail.textContent='Sehr leises Signal';
      }
      previousRms=sig.rms;micLoopId=requestAnimationFrame(micLoop);return;
    }

    lastStrongSignalAt=now;
    const pitch=detectPitchYIN(timeData,audioCtx.sampleRate);
    updateSignalUI(sig.rms,pitch?.clarity||0);updateProSignal(sig.rms,pitch);
    if(!pitch||pitch.clarity<settings.confidence){
      const detail=document.getElementById('livePitchDetail');if(detail)detail.textContent=`Ton instabil · Sicherheit ${Math.round((pitch?.clarity||0)*100)}%`;
      previousRms=sig.rms;micLoopId=requestAnimationFrame(micLoop);return;
    }

    const stable=stablePitch(pitch,now);
    if(!stable){previousRms=sig.rms;micLoopId=requestAnimationFrame(micLoop);return}
    const rawMidi=Math.round(69+12*Math.log2(stable.frequency/440));
    const freq=typeof smoothPitch==='function'?smoothPitch(stable.frequency,rawMidi):stable.frequency;
    const det=updateDetectedPitch(freq,stable.clarity);
    lastAcceptedPitchAt=now;
    const dot=document.getElementById('liveMicDot');if(dot){dot.classList.add('on');dot.classList.remove('warn','bad')}

    const t=performance.now();
    if(state.player.mic&&state.player.playing&&state.player.mode==='melody'&&(det.midi!==lastDetectedMidi||t-lastDetectedAt>cfg.minHold)){
      judgeInput({type:'melody',string:det.loc.string,midi:det.midi},null,{fromMic:true,countWrong:false});lastDetectedMidi=det.midi;lastDetectedAt=t;
    }
    if(state.player.mic&&state.player.playing&&state.player.mode==='chords'&&t-lastChordAt>320){
      const ch=detectChordPro();if(ch){judgeInput({type:'chords',chord:ch},null,{fromMic:true,countWrong:false});lastChordAt=t}
    }
    const onsetRise=sig.rms-previousRms;
    if(state.player.mic&&state.player.playing&&state.player.mode==='rhythm'&&sig.rms>gate*2.2&&onsetRise>settings.onsetSensitivity&&t-lastOnsetAt>115){
      const target=currentTargetEvent();if(target?.type==='rhythm'){judgeInput({type:'rhythm',direction:target.direction},null,{fromMic:true,countWrong:false});lastOnsetAt=t}
    }
    previousRms=sig.rms;micLoopId=requestAnimationFrame(micLoop);
  };

  function detectChordPro(){
    if(!freqData||!audioCtx||!analyser)return null;
    const chroma=new Array(12).fill(0),binHz=audioCtx.sampleRate/analyser.fftSize;
    let total=0;
    for(let bin=2;bin<freqData.length;bin++){
      const mag=freqData[bin];if(mag<18)continue;
      const freq=bin*binHz;if(freq<65||freq>1800)continue;
      const midi=Math.round(69+12*Math.log2(freq/440));const weight=mag*mag;
      chroma[((midi%12)+12)%12]+=weight;total+=weight;
    }
    if(total<10000)return null;
    let best=null,bestScore=0;
    for(const [name,tones] of Object.entries(CHORD_TONES)){
      const inside=tones.reduce((sum,t)=>sum+chroma[t],0),outside=chroma.reduce((sum,v,i)=>sum+(tones.includes(i)?0:v),0);
      const score=inside/(inside+outside*.48+1);if(score>bestScore){bestScore=score;best=name}
    }
    return bestScore>.44?best:null;
  }

  async function runCalibration(){
    if(calibrationRunning)return;
    calibrationRunning=true;
    const btn=document.getElementById('micProCalibrate');if(btn)btn.disabled=true;
    const calibrationOriginalGain=settings.inputGain;
    try{
      if(!micStream?.active){const ok=await startMic('tuner');if(!ok)throw new Error('Mikrofon konnte nicht gestartet werden.')}
      panelStatus('Kalibrierung 1/2: Bitte 2 Sekunden ruhig sein. Nebengeräusche werden gemessen …','warn');
      if(inputGainNode&&audioCtx)inputGainNode.gain.setValueAtTime(1,audioCtx.currentTime);
      const noise=await collectRms(2200);
      panelStatus('Kalibrierung 2/2: Schlage jetzt 4–6 Mal eine Saite in deiner normalen Lautstärke an …','warn');
      const signal=await collectRms(4200);
      const noiseFloor=percentile(noise,.75),signalLevel=percentile(signal,.92);
      if(signalLevel<noiseFloor*1.8)throw new Error('Gitarre war nicht deutlich lauter als die Umgebung. Bitte näher ans iPad gehen und erneut versuchen.');
      const noiseDb=linearToDb(noiseFloor),signalDb=linearToDb(signalLevel);
      settings.gateDb=Math.round(clampLocal(Math.min(signalDb-10,noiseDb+7),-78,-30));
      settings.inputGain=Math.round(clampLocal(.09/Math.max(signalLevel,.002),1,12)*4)/4;
      settings.confidence=clampLocal(settings.confidence,0.30,0.55);settings.preset='custom';saveSettings();
      panelStatus(`Kalibrierung abgeschlossen.\nUmgebung: ${noiseDb.toFixed(1)} dB\nGitarrensignal: ${signalDb.toFixed(1)} dB\nNeue Verstärkung: ${settings.inputGain.toFixed(2)}×\nNeue Raushshwelle: ${settings.gateDb} dB`,'good');
    }catch(err){panelStatus(`Kalibrierung fehlgeschlagen: ${err.message}`,'bad')}
    finally{if(inputGainNode&&audioCtx)inputGainNode.gain.setValueAtTime(settings.inputGain||calibrationOriginalGain,audioCtx.currentTime);calibrationRunning=false;if(btn)btn.disabled=false}
  }

  function collectRms(duration){
    return new Promise(resolve=>{
      const values=[],start=performance.now();
      const sample=()=>{
        if(analyser&&timeData){analyser.getFloatTimeDomainData(timeData);values.push(signalRms(timeData).rms)}
        if(performance.now()-start<duration)requestAnimationFrame(sample);else resolve(values);
      };sample();
    });
  }

  function chooseMimeType(){
    const candidates=['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm'];
    return candidates.find(type=>window.MediaRecorder?.isTypeSupported?.(type))||'';
  }

  async function startRecording(){
    if(mediaRecorder?.state==='recording')return;
    if(!window.MediaRecorder){panelStatus('Aufnahme wird von dieser Safari-Version nicht unterstützt.','bad');return}
    if(!micStream?.active){const ok=await startMic(document.getElementById('screen-player')?.classList.contains('active')?'player':'tuner');if(!ok)return}
    try{
      const stream=settings.recordProcessed&&recordDestination?recordDestination.stream:micStream;
      const mimeType=chooseMimeType();mediaRecorder=new MediaRecorder(stream,mimeType?{mimeType}:undefined);recordChunks=[];
      mediaRecorder.ondataavailable=e=>{if(e.data?.size)recordChunks.push(e.data)};
      mediaRecorder.onstop=finishRecording;
      mediaRecorder.start(250);recordingStartedAt=Date.now();recordingPausedAt=0;recordingPausedTotal=0;
      recordingTimer=setInterval(updateRecordingTimer,250);updateRecordingButtons(true);panelStatus('Aufnahme läuft. Das Gitarrensignal wird lokal auf dem iPad gespeichert.','good');
    }catch(err){panelStatus(`Aufnahme konnte nicht gestartet werden: ${err.message}`,'bad')}
  }
  function stopRecording(){
    if(mediaRecorder&&mediaRecorder.state!=='inactive')mediaRecorder.stop();
  }
  function pauseRecording(){
    if(mediaRecorder?.state==='recording'){mediaRecorder.pause();recordingPausedAt=Date.now();panelStatus('Aufnahme pausiert.','warn')}
  }
  function resumeRecording(){
    if(mediaRecorder?.state==='paused'){recordingPausedTotal+=Date.now()-recordingPausedAt;recordingPausedAt=0;mediaRecorder.resume();panelStatus('Aufnahme läuft weiter.','good')}
  }
  function updateRecordingTimer(){
    const pausedNow=recordingPausedAt?Date.now()-recordingPausedAt:0;
    const elapsed=Date.now()-recordingStartedAt-recordingPausedTotal-pausedNow;const el=document.getElementById('micProRecordTime');if(el)el.textContent=formatDuration(elapsed);
  }
  function formatDuration(ms){const s=Math.floor(ms/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
  function updateRecordingButtons(active){
    const start=document.getElementById('micProRecordStart'),stop=document.getElementById('micProRecordStop'),trigger=document.getElementById('micProPlayerBtn');
    if(start)start.disabled=active;if(stop)stop.disabled=!active;if(trigger)trigger.classList.toggle('recording',active);
  }
  async function finishRecording(){
    clearInterval(recordingTimer);recordingTimer=null;updateRecordingButtons(false);
    const mimeType=mediaRecorder?.mimeType||recordChunks[0]?.type||'audio/webm';
    const blob=new Blob(recordChunks,{type:mimeType});lastRecordingBlob=blob;
    if(lastRecordingUrl)URL.revokeObjectURL(lastRecordingUrl);lastRecordingUrl=URL.createObjectURL(blob);
    const title=state?.player?.song?.title||'Freies Üben';const pausedNow=recordingPausedAt?Date.now()-recordingPausedAt:0;const durationMs=Date.now()-recordingStartedAt-recordingPausedTotal-pausedNow;const record={id:`rec-${Date.now()}`,title,created:new Date().toISOString(),durationMs,mimeType,blob};
    await saveRecording(record);renderRecordingPreview(record,lastRecordingUrl);await loadRecordings();panelStatus(`Aufnahme gespeichert: ${title} · ${formatDuration(record.durationMs)}`,'good');
    mediaRecorder=null;recordChunks=[];
  }

  function renderRecordingPreview(record,url){
    const box=document.getElementById('micProRecordingPreview');if(!box)return;
    box.innerHTML=`<div class="mic-pro-status good"><b>Letzte Aufnahme:</b> ${escapeHtml(record.title)} · ${formatDuration(record.durationMs)}<audio controls src="${url}" style="width:100%;margin-top:8px"></audio><div class="mic-pro-actions" style="margin-top:8px"><button class="mic-pro-btn" id="micProDownloadLatest">Herunterladen</button><button class="mic-pro-btn" id="micProShareLatest">Teilen</button></div></div>`;
    document.getElementById('micProDownloadLatest').onclick=()=>downloadBlob(lastRecordingBlob,record);
    document.getElementById('micProShareLatest').onclick=()=>shareBlob(lastRecordingBlob,record);
  }

  function openRecordingDb(){
    if(recDbPromise)return recDbPromise;
    recDbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(REC_DB,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(REC_STORE))req.result.createObjectStore(REC_STORE,{keyPath:'id'})};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });return recDbPromise;
  }
  async function saveRecording(record){
    try{const db=await openRecordingDb();await new Promise((resolve,reject)=>{const tx=db.transaction(REC_STORE,'readwrite');tx.objectStore(REC_STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch(err){panelStatus(`Aufnahme vorhanden, konnte aber nicht dauerhaft gespeichert werden: ${err.message}`,'warn')}
  }
  async function getRecordings(){
    try{const db=await openRecordingDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(REC_STORE,'readonly'),req=tx.objectStore(REC_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})}catch{return[]}
  }
  async function deleteRecording(id){
    const db=await openRecordingDb();await new Promise((resolve,reject)=>{const tx=db.transaction(REC_STORE,'readwrite');tx.objectStore(REC_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});loadRecordings();
  }
  async function loadRecordings(){
    const box=document.getElementById('micProRecordings');if(!box)return;
    recordingListUrls.forEach(url=>URL.revokeObjectURL(url));
    recordingListUrls=[];
    const records=(await getRecordings()).sort((a,b)=>String(b.created).localeCompare(String(a.created))).slice(0,12);
    if(!records.length){box.innerHTML='<div class="mic-pro-status">Noch keine gespeicherten Aufnahmen.</div>';return}
    box.innerHTML='<h4>Gespeicherte Aufnahmen</h4>'+records.map(r=>{
      const url=URL.createObjectURL(r.blob);
      recordingListUrls.push(url);
      return `<div class="mic-pro-recording-item"><div><b>${escapeHtml(r.title)}</b><small style="display:block;color:#9fa8af">${new Date(r.created).toLocaleString('de-DE')} · ${formatDuration(r.durationMs)}</small><audio controls src="${url}"></audio></div><div class="mic-pro-actions"><button class="mic-pro-btn" data-rec-download="${r.id}">↓</button><button class="mic-pro-btn danger" data-rec-delete="${r.id}">×</button></div></div>`
    }).join('');
    box.querySelectorAll('[data-rec-download]').forEach(btn=>btn.onclick=()=>{const r=records.find(x=>x.id===btn.dataset.recDownload);if(r)downloadBlob(r.blob,r)});
    box.querySelectorAll('[data-rec-delete]').forEach(btn=>btn.onclick=()=>deleteRecording(btn.dataset.recDelete));
  }
  function extensionFor(type){return type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm'}
  function downloadBlob(blob,record){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${safeName(record.title)}-${new Date(record.created).toISOString().slice(0,19).replace(/:/g,'-')}.${extensionFor(blob.type||record.mimeType||'')}`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
  async function shareBlob(blob,record){
    try{const file=new File([blob],`${safeName(record.title)}.${extensionFor(blob.type||record.mimeType||'')}`,{type:blob.type||record.mimeType});if(navigator.canShare?.({files:[file]}))await navigator.share({title:'Luca Guitar Quest Aufnahme',files:[file]});else downloadBlob(blob,record)}catch(err){if(err.name!=='AbortError')downloadBlob(blob,record)}
  }

  function wrapPlayerToggle(){
    if(typeof togglePlay!=='function'||originalTogglePlay)return;
    originalTogglePlay=togglePlay;
    togglePlay=function(){
      const wasPlaying=!!state.player.playing;
      originalTogglePlay();
      const nowPlaying=!!state.player.playing;
      if(settings.autoRecord&&!wasPlaying&&nowPlaying){if(mediaRecorder?.state==='paused')resumeRecording();else startRecording()}
      if(settings.autoRecord&&wasPlaying&&!nowPlaying&&mediaRecorder?.state==='recording')pauseRecording();
    };
    const btn=document.getElementById('playPauseBtn');if(btn)btn.onclick=togglePlay;
  }

  function wrapFinishAttempt(){
    if(typeof finishAttempt!=='function'||finishAttempt.__micProWrapped)return;
    const original=finishAttempt;
    const wrapped=function(){if(settings.autoRecord&&mediaRecorder&&mediaRecorder.state!=='inactive')stopRecording();return original.apply(this,arguments)};
    wrapped.__micProWrapped=true;finishAttempt=wrapped;
  }

  function observeUi(){
    const observer=new MutationObserver(()=>addTriggerButtons());
    observer.observe(document.body,{subtree:true,childList:true});
  }

  function init(){
    injectUI();wrapPlayerToggle();wrapFinishAttempt();observeUi();
    window.addEventListener('beforeunload',()=>{if(mediaRecorder?.state==='recording')stopRecording()});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&mediaRecorder?.state==='recording'&&!state.player.playing)stopRecording()});
    console.info(`[Luca Guitar Quest] Mikrofon Pro ${VERSION} geladen.`);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
  window.addEventListener('pagehide',()=>{
    recordingListUrls.forEach(url=>URL.revokeObjectURL(url));
    recordingListUrls=[];
    if(lastRecordingUrl){
      URL.revokeObjectURL(lastRecordingUrl);
      lastRecordingUrl='';
    }
  });

})();