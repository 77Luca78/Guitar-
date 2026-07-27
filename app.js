'use strict';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const formatTime = ms => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2,'0')}`;
};

const STRINGS = [
  {name:'E',midi:40,freq:82.41,color:'#ff657c'},
  {name:'A',midi:45,freq:110.00,color:'#ffb84c'},
  {name:'D',midi:50,freq:146.83,color:'#50e29b'},
  {name:'G',midi:55,freq:196.00,color:'#10b8ff'},
  {name:'B',midi:59,freq:246.94,color:'#b69bff'},
  {name:'e',midi:64,freq:329.63,color:'#ff9f66'}
];
const CHORD_TONES = {
  C:[0,4,7],D:[2,6,9],Dm:[2,5,9],E:[4,8,11],Em:[4,7,11],F:[5,9,0],G:[7,11,2],A:[9,1,4],Am:[9,0,4],B7:[11,3,6,9]
};

function melodyEvents(sequence,bpm=90,beats=1,frets=null){
  const beatMs=60000/bpm;
  return sequence.map((string,i)=>({id:`e${i}`,timeMs:Math.round(i*beatMs*beats),durationMs:Math.round(beatMs*.8),type:'melody',string, fret:frets?.[i] ?? 0, midi:STRINGS[string].midi+(frets?.[i]??0), label:`${STRINGS[string].name}${frets?.[i]??0}`}));
}
function chordEvents(sequence,bpm=84,beats=4){
  const beatMs=60000/bpm;
  return sequence.map((chord,i)=>({id:`c${i}`,timeMs:Math.round(i*beatMs*beats),durationMs:Math.round(beatMs*beats*.85),type:'chords',chord,label:chord}));
}
function rhythmEvents(pattern='D D U U D U',bpm=90,bars=4){
  const tokens=pattern.split(/\s+/).filter(Boolean),beatMs=60000/bpm/2,events=[];
  for(let b=0;b<bars;b++) tokens.forEach((dir,i)=>events.push({id:`r${b}-${i}`,timeMs:Math.round((b*tokens.length+i)*beatMs),durationMs:Math.round(beatMs*.7),type:'rhythm',direction:dir.toUpperCase().startsWith('U')?'up':'down',label:dir.toUpperCase()}));
  return events;
}
function modePack({melody=null,chords=null,rhythm=null}){
  const m={}; if(melody)m.melody=melody;if(chords)m.chords=chords;if(rhythm)m.rhythm=rhythm;return m;
}

const BUILTIN_SONGS = [
  {id:'open-strings',title:'Offene Saiten',artist:'Luca Grundlagen',category:'Grundlagen',difficulty:1,bpm:72,key:'–',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Saiten','Anfänger'],modes:modePack({melody:melodyEvents([0,1,2,3,4,5,5,4,3,2,1,0],72)})},
  {id:'alternate-picking',title:'Wechselschlag Basis',artist:'Luca Grundlagen',category:'Grundlagen',difficulty:1,bpm:82,key:'–',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Picking'],modes:modePack({melody:melodyEvents([0,1,0,1,2,3,2,3,4,5,4,5],82,.5)})},
  {id:'string-skipping',title:'Saitensprünge',artist:'Luca Grundlagen',category:'Grundlagen',difficulty:2,bpm:88,key:'–',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Koordination'],modes:modePack({melody:melodyEvents([0,2,4,1,3,5,4,2,0,5,3,1],88,.75)})},
  {id:'chromatic-1234',title:'Chromatik 1–2–3–4',artist:'Luca Grundlagen',category:'Grundlagen',difficulty:2,bpm:76,key:'E',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Fingertechnik'],modes:modePack({melody:melodyEvents([0,0,0,0,1,1,1,1,2,2,2,2],76,.5,[1,2,3,4,1,2,3,4,1,2,3,4])})},
  {id:'c-chord',title:'Lerne den C-Akkord',artist:'Luca Akkordkurs',category:'Akkorde',difficulty:1,bpm:70,key:'C',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['C-Dur'],modes:modePack({chords:chordEvents(['C','C','Am','C','G','C'],70,4),rhythm:rhythmEvents('D D D D',70,4)})},
  {id:'g-chord',title:'Lerne den G-Akkord',artist:'Luca Akkordkurs',category:'Akkorde',difficulty:1,bpm:72,key:'G',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['G-Dur'],modes:modePack({chords:chordEvents(['G','G','D','G','C','G'],72,4),rhythm:rhythmEvents('D D U U D U',72,3)})},
  {id:'em-am-change',title:'Em–Am Wechsel',artist:'Luca Akkordkurs',category:'Akkorde',difficulty:1,bpm:76,key:'Em',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Moll'],modes:modePack({chords:chordEvents(['Em','Am','Em','Am','C','Em'],76,2),rhythm:rhythmEvents('D D U U D U',76,4)})},
  {id:'gd-emc',title:'G–D–Em–C Pop-Kreis',artist:'Luca Songkurs',category:'Songkurs',difficulty:2,bpm:88,key:'G',timeSig:'4/4',source:'built-in',rights:'Generische Akkordübung',tags:['Pop'],modes:modePack({chords:chordEvents(['G','D','Em','C','G','D','C','D'],88,4),rhythm:rhythmEvents('D D U U D U',88,6),melody:melodyEvents([3,4,5,4,3,2,1,0,1,2,3,5],88,1)})},
  {id:'em-cgd',title:'Em–C–G–D Emotional',artist:'Luca Songkurs',category:'Songkurs',difficulty:2,bpm:82,key:'Em',timeSig:'4/4',source:'built-in',rights:'Generische Akkordübung',tags:['Pop','Ballade'],modes:modePack({chords:chordEvents(['Em','C','G','D','Em','C','G','D'],82,4),rhythm:rhythmEvents('D D U U D U',82,6)})},
  {id:'twelve-bar-blues',title:'12-Bar Blues in E',artist:'Luca Blueskurs',category:'Songkurs',difficulty:3,bpm:96,key:'E',timeSig:'4/4',source:'built-in',rights:'Traditionelles Blues-Schema',tags:['Blues'],modes:modePack({chords:chordEvents(['E','E','E','E','A','A','E','E','B7','A','E','B7'],96,4),rhythm:rhythmEvents('D U D U D U D U',96,8),melody:melodyEvents([0,0,1,0,2,1,0,1,2,2,1,0],96,.5,[0,3,0,2,0,2,3,0,2,0,2,0])})},
  {id:'rhythm-quarter',title:'Viertelnoten sicher strummen',artist:'Luca Rhythmus',category:'Rhythmus',difficulty:1,bpm:80,key:'–',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Strumming'],modes:modePack({rhythm:rhythmEvents('D D D D',80,6)})},
  {id:'rhythm-eighth',title:'Achtelnoten Down/Up',artist:'Luca Rhythmus',category:'Rhythmus',difficulty:2,bpm:92,key:'–',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Strumming'],modes:modePack({rhythm:rhythmEvents('D U D U D U D U',92,6)})},
  {id:'syncopation',title:'Synkopen-Training',artist:'Luca Rhythmus',category:'Rhythmus',difficulty:3,bpm:98,key:'–',timeSig:'4/4',source:'built-in',rights:'Originale Übung',tags:['Timing'],modes:modePack({rhythm:rhythmEvents('D X U U X U',98,7)})},
  {id:'ode-to-joy',title:'Ode an die Freude · Lernfassung',artist:'L. v. Beethoven · eigene Lernfassung',category:'Songkurs',difficulty:2,bpm:92,key:'D',timeSig:'4/4',source:'public-domain',rights:'Komposition gemeinfrei; Lernfassung eigenständig',tags:['Klassik'],modes:modePack({melody:melodyEvents([2,2,3,4,4,3,2,1,0,0,1,2,2,1,1,2,2,3,4,4,3,2,1,0,0,1,2,1,0,0],92,.75)})},
  {id:'amazing-grace',title:'Amazing Grace · Akkordtraining',artist:'Traditional · eigene Lernfassung',category:'Songkurs',difficulty:2,bpm:76,key:'G',timeSig:'3/4',source:'traditional',rights:'Traditionelle Melodie; Lernfassung eigenständig',tags:['Traditional'],modes:modePack({chords:chordEvents(['G','C','G','D','G','C','G','D','G'],76,3),melody:melodyEvents([3,5,3,1,0,1,3,5,3,1,0,3],76,1.5)})},
  {id:'kids-entchen',title:'Alle meine Entchen · Lernfassung',artist:'Traditionell',category:'Kinderlied',difficulty:1,bpm:84,key:'G',timeSig:'4/4',source:'traditional',rights:'Traditionell; keine Liedtexte enthalten',tags:['Kita','Kinder'],isKids:true,modes:modePack({chords:chordEvents(['G','D','G','C','G','D','G'],84,4),melody:melodyEvents([0,1,2,3,4,4,5,5,5,4,4,4,3,3,3,2,2,2,1,1,1,0],84,.5),rhythm:rhythmEvents('D D D D',84,5)})},
  {id:'kids-bruder',title:'Bruder Jakob · Lernfassung',artist:'Traditionell',category:'Kinderlied',difficulty:1,bpm:90,key:'C',timeSig:'4/4',source:'traditional',rights:'Traditionell; keine Liedtexte enthalten',tags:['Kita','Kinder'],isKids:true,modes:modePack({melody:melodyEvents([0,1,2,0,0,1,2,0,2,3,4,2,3,4,4,5,4,3,2,0,4,5,4,3,2,0],90,.5),chords:chordEvents(['C','G','C','G','C'],90,4)})},
  {id:'kids-backe',title:'Backe, backe Kuchen · Lernfassung',artist:'Traditionell',category:'Kinderlied',difficulty:1,bpm:88,key:'G',timeSig:'4/4',source:'traditional',rights:'Traditionell; keine Liedtexte enthalten',tags:['Kita','Kinder'],isKids:true,modes:modePack({chords:chordEvents(['G','D','G','C','G','D','G'],88,4),rhythm:rhythmEvents('D D U U D U',88,5)})},
  {id:'kids-haenschen',title:'Hänschen klein · Lernfassung',artist:'Traditionell',category:'Kinderlied',difficulty:2,bpm:82,key:'G',timeSig:'4/4',source:'traditional',rights:'Traditionell; keine Liedtexte enthalten',tags:['Kita','Kinder'],isKids:true,modes:modePack({melody:melodyEvents([4,2,0,2,4,4,4,2,2,2,4,5,5,4,2,0,2,4,4,4,2,2,4,2,0],82,.6),chords:chordEvents(['G','D','G','C','G','D','G'],82,4)})},
  {id:'kids-fuchs',title:'Fuchs, du hast die Gans gestohlen · Lernfassung',artist:'Traditionell',category:'Kinderlied',difficulty:2,bpm:92,key:'G',timeSig:'4/4',source:'traditional',rights:'Traditionell; keine Liedtexte enthalten',tags:['Kita','Kinder'],isKids:true,modes:modePack({chords:chordEvents(['G','D','G','C','G','D','G','D','G'],92,4),rhythm:rhythmEvents('D D U U D U',92,6)})},
  {id:'kids-summ',title:'Summ, summ, summ · Lernfassung',artist:'Traditionell',category:'Kinderlied',difficulty:1,bpm:76,key:'G',timeSig:'4/4',source:'traditional',rights:'Traditionell; keine Liedtexte enthalten',tags:['Kita','Kinder'],isKids:true,modes:modePack({chords:chordEvents(['G','C','G','D','G'],76,4),melody:melodyEvents([3,3,2,2,1,1,0,0,1,2,3,3,3],76,.75)})},
  {id:'kids-laterne',title:'Laternen-Rhythmus · eigene Übung',artist:'Luca Kinderbereich',category:'Kinderlied',difficulty:1,bpm:74,key:'–',timeSig:'4/4',source:'built-in',rights:'Originale Rhythmusübung',tags:['Kita','Rhythmus'],isKids:true,modes:modePack({rhythm:rhythmEvents('D D U D D U',74,5)})}
];

const PERSONAL_CATALOG_DATA = [["Kobold im Kopp", "Versengold"], ["Valhalleluja", "Nanowar Of Steel"], ["Sirin", "Serinx"], ["Cut The Line", "Final Request"], ["Love Has Gone", "Alok, ALTA, Robert Falcon & Jess Glynne"], ["Future Folk", "Goom Gum"], ["My Head", "TH;EN"], ["I Got Love (feat. Nate Dogg)", "CYRIL, Kelland & Nate Dogg"], ["Arrival", "KREAM"], ["All Night – Extended Club Version", "Example"], ["Lets Try It", "Marten Hørger & BRANDON"], ["The Future Is Now", "The Offspring"], ["Final Masquerade", "Linkin Park"], ["Silence – John Summit Remix", "Delerium, Sarah McLachlan & John Summit"], ["Terminator", "Alok & SOLANCE"], ["Metalingus", "Alter Bridge"], ["Another Life", "Motionless In White"], ["Even If It Kills Me", "Papa Roach"], ["Blackhole", "Architects"], ["AFRAID TO DIE", "P.O.D., Tatiana Shmayluk & Jinjer"], ["Girl With The Tattoo", "Apparition"], ["Girl With Golden Eyes", "Sixx:A.M."], ["Tail Lights", "Blacktop Mojo"], ["Everything Ends", "Architects"], ["where did you go?", "We Came As Romans"], ["I Want It All", "Rise Against"], ["Not Strong Enough", "Apocalyptica & Brent Smith"], ["Burn", "MADE & San Andreas"], ["Dope", "Yelawolf"], ["Power", "Jeris Johnson"], ["Bis zur Sonne", "Sido, B-Tight & Damion Davis"], ["Up From the Bottom", "Linkin Park"], ["Unshatter", "Linkin Park"], ["Monsters (feat. blackbear)", "All Time Low & blackbear"], ["Smooth Criminal", "Alien Ant Farm"], ["Drop It Like It's Hot", "Snoop Dogg & Pharrell Williams"], ["Lohn Isch Da", "Teddy Teclebrhan & Antoine Burtz"], ["Eyes on Fire – Zeds Dead Remix", "Blue Foundation & Zeds Dead"], ["Heartbeat – Chase & Status We Just Bought A Guitar Mix", "Nneka & Chase & Status"], ["Benzi Box", "DANGERDOOM, MF DOOM, Danger Mouse & CeeLo Green"], ["Mr. Roboto", "Styx"], ["Nutshell", "Alice In Chains"], ["BMXing", "mgk"], ["Left Behind", "The Plot In You"], ["Addicted", "Zerb, The Chainsmokers & Ink"], ["Out Of Control", "Hoobastank"], ["I Just Don't Love You Anymore", "Wake Up Hate"], ["I Don't Know Why I Love You", "Stevie Wonder"], ["Mayday", "Three Days Grace"], ["Not Afraid", "Skillet"], ["Talk To Me", "Champion, Four Tet, Skrillex & Naisha"], ["The Real Slim Shady", "Eminem"], ["My Stress", "NF"], ["Only", "NF & Sasha Alex Sloan"], ["sun to me", "mgk"], ["Over Each Other", "Linkin Park"], ["pretty toxic revolver", "mgk"], ["Endlich normale Leute", "Trailerpark"], ["Arbeitskollegen", "Trailerpark"], ["Hart Vermissen", "Alligatoah"], ["ICH FÜHLE DICH", "Alligatoah"], ["This Life (Theme from Sons of Anarchy)", "Curtis Stigers & The Forest Rangers"], ["This Life", "Curtis Stigers & The Forest Rangers"], ["Bodies", "Drowning Pool"], ["Been To Hell", "Hollywood Undead"], ["Worth Dying For", "Rise Against"], ["You Give Love A Bad Name", "Bon Jovi"], ["Cold", "Crossfade"], ["Don't Wake Me", "Skillet"], ["Mood", "Fame on Fire"], ["On the Other Side", "Flight Paths"], ["Darkbloom", "We Came As Romans"], ["Suffocate", "Kayzo & Bad Omens"], ["TRIALS", "STARSET"], ["Naked And Alive", "Milky Chance"], ["in these walls (my house) (feat. PVRIS)", "mgk & PVRIS"], ["Far from Here", "Emmit Fenn"], ["Frieden", "K.I.Z"], ["Marlboro Lights", "Bausa & Marteria"], ["JACKY – feat. Sido & Marteria", "Marsimoto, Sido & Marteria"], ["Soul Song", "Grey Daze"], ["Popular Monster", "Falling In Reverse"], ["Eazy-Duz-It", "Eazy-E, Dr. Dre & MC Ren"], ["Hail to the King", "Avenged Sevenfold"], ["Friendly Fire", "Linkin Park"], ["In Da Getto", "J Balvin & Skrillex"], ["Mädchen auf dem Pferd", "Luca-Dante Spadafora, Niklas Dee, Octavian & Peter Plate"], ["Killing Me Slowly", "Bad Wolves"], ["Blood Shake (feat. Dope D.O.D.)", "Salmo & Dope D.O.D."], ["All I Have", "NF"], ["If You Want Love", "NF"], ["If I Had a Heart", "Fever Ray"], ["Blah Blah Blah", "Armin van Buuren"], ["In the End", "Linkin Park"], ["Die Bitch", "Marteria"], ["Drown In My Mind", "Story Untold"], ["Make It Bun Dem", "Skrillex & Damian Jr Gong Marley"], ["Slam Dunk (feat. Kstylis)", "Valentino Khan, Skrillex & Kstylis"], ["Drag Me To Hell", "Subway To Sally & Chris Harms"], ["Crawling", "Linkin Park"], ["Mockingbird", "Eminem"], ["Something Better – Acoustic", "The Broken View"], ["Rasend Herz", "In Extremo"], ["Arschficksong", "Sido"], ["For Evigt", "Volbeat & Johan Olsen"], ["The Devil's Bleeding Crown", "Volbeat"], ["Lola Montez", "Volbeat"], ["A Warrior's Call", "Volbeat"], ["Still Counting", "Volbeat"], ["Wind", "In Extremo"], ["Rap God", "Eminem"], ["J'me tire", "GIMS"], ["Narcissistic Cannibal (feat. Skrillex & Kill the Noise)", "Korn, Skrillex & Kill The Noise"], ["Last Resort – Reimagined", "Falling In Reverse"], ["Alpha Omega", "mgk"], ["Alice In Wonderland", "mgk"], ["Strip für mich (feat. Kitty Kat)", "Sido & Kitty Kat"], ["Don't Cry (Original)", "Guns N' Roses"], ["Snuff", "Slipknot"], ["Here Without You", "3 Doors Down"], ["The Messenger", "Linkin Park"], ["3 Monde", "Sido"], ["Black Hole", "We Came As Romans & Caleb Shomo"], ["Intro", "Sido"], ["Elfenbein (feat. Yasha & Miss Platnum)", "Marteria, Yasha & Miss Platnum"], ["El Presidente", "Marteria"], ["Bengalische Tiger", "Marteria"], ["Immer wenn ich high bin (feat. Walking Trett)", "Marsimoto & Walking Trett"], ["Fighting Myself", "Linkin Park"], ["Figure.09", "Linkin Park"], ["Don't Stay", "Linkin Park"], ["One More Light", "Linkin Park"], ["Find Myself", "Asking Alexandria"], ["HAPPY", "NF"], ["Cinema – Skrillex Remix", "Benny Benassi, Gary Go & Skrillex"], ["Creeds Push Up", "No Stress"], ["All The Ways I Could Die", "Arrows in Action"], ["No Man", "SMACK, No Thanks & WEIRD GRRL"], ["Get Up Off The Floor", "FORTELLA"], ["EULE (feat. Marteria)", "Jan Delay & Marteria"], ["Base Ventura", "Marteria"], ["Aus dem Häuschen", "DJ Sweap & DJ Pfund 500, Marteria & HARRIS"], ["Doublespeak", "We Came As Romans"], ["Piece Of Your Heart – Alok Remix", "MEDUZA, Alok & Goodboys"], ["Titanik", "KITSCHKRIEG, Miss Platnum, Marteria & SFR"], ["Gone away", "Nomy"], ["There's Fear In Letting Go", "I Prevail"], ["Face Me", "The Plot In You"], ["Endboss", "Marteria"], ["Circles", "Pierce The Veil"], ["Ich rolle mit meim Besten – Babos Remix", "Haftbefehl & Marteria"]];
function stableHash(text){let h=2166136261;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function makeReferenceSong([title,artist],index){
  const h=stableHash(title+artist),bpm=76+(h%55),pattern=['D D U U D U','D U D U D U D U','D D D U D U'][h%3];
  return {id:`catalog-${index}-${h.toString(36)}`,title,artist,category:'Favorit',difficulty:1+(h%4),bpm,key:'–',timeSig:'4/4',source:'favorite-template',referenceOnly:true,rights:'Persönlicher Katalogeintrag. Keine Originalaufnahme, exakten Tabs oder lizenzierten Songdaten enthalten.',tags:['Lieblingssong','Referenz','Rhythmus-Template'],modes:{rhythm:rhythmEvents(pattern,bpm,8)}};
}
const REFERENCE_SONGS = PERSONAL_CATALOG_DATA.map(makeReferenceSong);

const DB = {
  db:null,
  async open(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB nicht verfügbar'));return}
      const timeout=setTimeout(()=>reject(new Error('IndexedDB-Startzeit überschritten')),2500);
      const req=indexedDB.open('luca-guitar-studio-pro',2);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains('songs')) db.createObjectStore('songs',{keyPath:'id'});
        if(!db.objectStoreNames.contains('progress')) db.createObjectStore('progress',{keyPath:'id'});
        if(!db.objectStoreNames.contains('sources')) db.createObjectStore('sources',{keyPath:'id'});
        if(!db.objectStoreNames.contains('audio')) db.createObjectStore('audio',{keyPath:'id'});
        if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings',{keyPath:'id'});
      };
      req.onsuccess=()=>{clearTimeout(timeout);this.db=req.result;resolve(this.db)};
      req.onerror=()=>{clearTimeout(timeout);reject(req.error)};
    });
  },
  async getAll(store){return new Promise((resolve,reject)=>{const r=this.db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})},
  async get(store,key){return new Promise((resolve,reject)=>{const r=this.db.transaction(store,'readonly').objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})},
  async put(store,value){return new Promise((resolve,reject)=>{const r=this.db.transaction(store,'readwrite').objectStore(store).put(value);r.onsuccess=()=>resolve(value);r.onerror=()=>reject(r.error)})},
  async delete(store,key){return new Promise((resolve,reject)=>{const r=this.db.transaction(store,'readwrite').objectStore(store).delete(key);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
};

const state = {
  songs:[],customSongs:[],sources:[],progress:{id:'global',xp:0,streak:0,lastPlayed:[],songResults:{}},settings:{id:'ui',highContrast:false,reducedMotion:false,fontScale:100,metronome:true,micDefault:false,timingWindow:260,networkEnabled:false},
  category:'all',learnFilter:'all',detailSong:null,detailMode:null,
  player:{song:null,mode:null,events:[],durationMs:0,positionMs:0,playing:false,lastFrame:0,speed:1,score:0,hits:0,misses:0,wrong:0,combo:0,timing:[],judged:new Map(),metronome:true,mic:false,lastBeat:-1,loopA:null,loopB:null,loopOn:false,seeking:false,finished:false,audioUrl:null}
};

function getResult(songId,mode){return state.progress.songResults?.[`${songId}:${mode}`]||null}
function starsHTML(n=0){return `<span class="stars">${[1,2,3].map(i=>`<span class="${i<=n?'on':''}">★</span>`).join('')}</span>`}
function modeLabel(mode){return ({melody:'Melodie',chords:'Akkorde',rhythm:'Rhythmus'})[mode]||mode}
function sourceLabel(source){return ({'built-in':'Mitgeliefert','traditional':'Traditionell','public-domain':'Public Domain','favorite':'Favorit','favorite-template':'Referenz-Template','import':'Import'})[source]||source}
function availableModes(song){return Object.keys(song.modes||{})}
function songDuration(song,mode){const events=song.modes?.[mode]||[];return events.length?Math.max(...events.map(e=>e.timeMs+(e.durationMs||400)))+1500:15000}

function fallbackRead(key,defaultValue){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):defaultValue}catch{return defaultValue}}
function fallbackWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function mergeSongSets(...sets){const map=new Map();for(const set of sets)for(const song of set||[])if(song?.id)map.set(song.id,song);return [...map.values()]}
function pausePlayerForNavigation(){const p=state.player;if(!p?.playing)return;p.playing=false;p.lastFrame=0;releaseWakeLock();document.body.classList.remove('player-active');const audio=$('#backingAudio');if(audio?.src)audio.pause();const btn=$('#playPauseBtn');if(btn)btn.textContent='▶'}

async function init(){
  try{await DB.open()}catch(err){console.warn('IndexedDB nicht verfügbar; LocalStorage-Ersatz wird verwendet.',err?.message||err)}
  await loadPersistentData();
  bindNavigation();bindLibrary();bindImport();bindSettings();bindPlayer();bindTuner();bindInstallSupport();bindNetworkSupport();
  applySettings();renderAll();registerSW();
}
async function loadPersistentData(){
  if(!DB.db){
    state.customSongs=fallbackRead('lq-pro-songs',fallbackRead('lq_customSongs',[]));
    state.sources=fallbackRead('lq-pro-sources',[]);
    const savedProgress=fallbackRead('lq-pro-progress',null);if(savedProgress)state.progress={...state.progress,...savedProgress,songResults:savedProgress.songResults||{},lastPlayed:savedProgress.lastPlayed||[]};
    const savedSettings=fallbackRead('lq-pro-settings',null);if(savedSettings)state.settings={...state.settings,...savedSettings};
    state.songs=mergeSongSets(BUILTIN_SONGS,REFERENCE_SONGS,state.customSongs);return;
  }
  state.customSongs=await DB.getAll('songs');state.sources=await DB.getAll('sources');
  const savedProgress=await DB.get('progress','global');
  if(savedProgress) state.progress={...state.progress,...savedProgress,songResults:savedProgress.songResults||{},lastPlayed:savedProgress.lastPlayed||[]};
  const savedSettings=await DB.get('settings','ui');
  if(savedSettings) state.settings={...state.settings,...savedSettings};
  await migrateLegacy();
  state.songs=mergeSongSets(BUILTIN_SONGS,REFERENCE_SONGS,state.customSongs);
}
async function migrateLegacy(){
  const old=localStorage.getItem('lq_customSongs');
  if(old && state.customSongs.length===0){
    try{for(const s of JSON.parse(old)){s.id=s.id||uid('legacy');s.source='import';s.category=s.category||'Import';s.modes=s.modes||legacyToModes(s);await DB.put('songs',s)}state.customSongs=await DB.getAll('songs')}catch{}
  }
}
function legacyToModes(s){if(s.type==='chords'&&s.chords)return{chords:chordEvents(s.chords,s.bpm||90,4)};if(s.notes)return{melody:melodyEvents(s.notes,s.bpm||90)};return{rhythm:rhythmEvents('D D U U D U',s.bpm||90,4)}}
function registerSW(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{})}

function bindNavigation(){
  $$('[data-nav]').forEach(btn=>btn.addEventListener('click',()=>openScreen(btn.dataset.nav)));
  document.addEventListener('click',event=>{const btn=event.target.closest('[data-song-detail]');if(!btn)return;const song=state.songs.find(s=>s.id===btn.dataset.songDetail);if(song)openSongDetail(song)});
  $('#quickPracticeBtn').onclick=()=>openSongDetail(state.songs.find(s=>s.id==='open-strings'));
  $$('.subnav [data-learn-filter]').forEach(btn=>btn.onclick=()=>{$$('.subnav [data-learn-filter]').forEach(b=>b.classList.toggle('active',b===btn));state.learnFilter=btn.dataset.learnFilter;renderLearn()});
}
function openScreen(name){
  if(name!=='player')pausePlayerForNavigation();
  $$('.screen').forEach(s=>s.classList.toggle('active',s.id===`screen-${name}`));
  $$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  if(name!=='player') window.scrollTo({top:0,behavior:state.settings.reducedMotion?'auto':'smooth'});
  if(name==='library')renderLibrary();if(name==='learn')renderLearn();if(name==='kids')renderKids();
}

function renderAll(){renderTop();renderHome();renderLearn();renderLibrary();renderKids();renderSources()}
function renderTop(){
  const level=Math.floor((state.progress.xp||0)/500)+1;
  $('#homeLevel').textContent=level;$('#learnLevel').textContent=level;$('#xpTop').textContent=state.progress.xp||0;$('#streakTop').textContent=state.progress.streak||0;
  $('#learnXp').textContent=state.progress.xp||0;$('#nextLevelXp').textContent=level*500;$('#learnXpBar').style.width=`${((state.progress.xp||0)%500)/5}%`;
}
function renderHome(){
  const recommended=state.songs.filter(s=>s.difficulty<=2).slice(0,5);
  $('#homeRecommended').innerHTML=recommended.map(songCard).join('');
  const recentIds=state.progress.lastPlayed||[];const recent=recentIds.map(id=>state.songs.find(s=>s.id===id)).filter(Boolean).slice(0,5);
  $('#recentSongs').innerHTML=(recent.length?recent:state.songs.slice(5,10)).map(songCard).join('');
}
function renderLearn(){
  const songs=state.songs.filter(s=>['Grundlagen','Akkorde','Rhythmus','Songkurs'].includes(s.category)).filter(s=>state.learnFilter==='all'||s.category===state.learnFilter);
  $('#learnGrid').innerHTML=songs.map(songCard).join('');renderTop();
}
function renderKids(){const kids=state.songs.filter(s=>s.isKids||s.category==='Kinderlied');$('#kidsCount').textContent=kids.length;$('#kidsGrid').innerHTML=kids.map(songCard).join('')}
function songCard(song){
  const modes=availableModes(song);const best=Math.max(0,...modes.map(m=>getResult(song.id,m)?.bestScore||0));const stars=Math.max(0,...modes.map(m=>getResult(song.id,m)?.stars||0));
  return `<article class="lesson-card" data-type="${modes[0]||'melody'}" data-kids="${song.isKids?'true':'false'}"><div class="lesson-thumb"></div><div class="lesson-body"><div class="eyebrow">${song.category} · Level ${song.difficulty}</div><h3>${escapeHTML(song.title)}</h3>${starsHTML(stars)}<div class="lesson-footer"><span>${best?`${best}% Bestwert`:'Noch offen'}</span><button class="small-button" data-song-detail="${song.id}">Öffnen</button></div></div></article>`
}
function bindDynamicCards(){/* Ereignisdelegation in bindNavigation hält dynamische Karten klickbar. */}

function bindLibrary(){
  ['librarySearch','libraryMode','libraryDifficulty','librarySource','librarySort'].forEach(id=>$('#'+id).addEventListener('input',renderLibrary));
  $$('.category-button').forEach(btn=>btn.onclick=()=>{$$('.category-button').forEach(b=>b.classList.toggle('active',b===btn));state.category=btn.dataset.category;renderLibrary()});
}
function renderLibrary(){
  let list=[...state.songs];const q=$('#librarySearch').value.trim().toLowerCase(),mode=$('#libraryMode').value,diff=$('#libraryDifficulty').value,source=$('#librarySource').value,sort=$('#librarySort').value;
  if(q)list=list.filter(s=>[s.title,s.artist,s.category,s.source,...(s.tags||[])].join(' ').toLowerCase().includes(q));
  if(mode!=='all')list=list.filter(s=>availableModes(s).includes(mode));
  if(diff!=='all')list=list.filter(s=>diff==='4'?s.difficulty>=4:s.difficulty===Number(diff));
  if(source!=='all')list=list.filter(s=>source==='favorite'?['favorite','favorite-template'].includes(s.source):s.source===source);
  if(state.category!=='all')list=list.filter(s=>s.category===state.category);
  const bestFor=s=>Math.max(0,...availableModes(s).map(m=>getResult(s.id,m)?.bestScore||0));
  if(sort==='title')list.sort((a,b)=>a.title.localeCompare(b.title,'de'));if(sort==='level')list.sort((a,b)=>a.difficulty-b.difficulty);if(sort==='stars')list.sort((a,b)=>bestFor(b)-bestFor(a));if(sort==='recent'){const pos=id=>(state.progress.lastPlayed||[]).indexOf(id);list.sort((a,b)=>(pos(a.id)<0?999:pos(a.id))-(pos(b.id)<0?999:pos(b.id)))}
  $('#countAll').textContent=state.songs.length;$('#libraryResultCount').textContent=`${list.length} Songs`;
  $('#libraryList').innerHTML=list.map(song=>{
    const modes=availableModes(song),best=Math.max(0,...modes.map(m=>getResult(song.id,m)?.bestScore||0)),stars=Math.max(0,...modes.map(m=>getResult(song.id,m)?.stars||0));
    return `<div class="library-row ${song.referenceOnly?'reference-template':''}"><div><b>${escapeHTML(song.title)}</b><div class="muted">${escapeHTML(song.artist||'Luca Guitar Quest')} · Level ${song.difficulty}</div><span class="play-status ${song.referenceOnly?'template':'exact'}">${song.referenceOnly?'Rhythmus-Template · exakte Songdaten fehlen':'Spielbare Übungsdaten'}</span></div><div class="mode-col mode-tags">${modes.map(m=>`<span class="mode-tag">${modeLabel(m)}</span>`).join('')}</div><div class="source-col"><div>${starsHTML(stars)}</div><span class="source-tag">${best?best+'%':'–'} · ${sourceLabel(song.source)}</span></div><button class="small-button" data-song-detail="${song.id}">Details</button></div>`
  }).join('');bindDynamicCards();
}

function openSongDetail(song){
  if(!song){alert('Dieser Song konnte nicht geladen werden.');return}
  state.detailSong=song;state.detailMode=availableModes(song)[0];renderSongDetail();openScreen('detail');
}
function renderSongDetail(){
  const song=state.detailSong;if(!song)return;const modes=availableModes(song);if(!modes.includes(state.detailMode))state.detailMode=modes[0];const result=getResult(song.id,state.detailMode);
  $('#songDetail').innerHTML=`<div class="detail-hero"><div class="panel"><span class="eyebrow">${song.category.toUpperCase()}</span><h1>${escapeHTML(song.title)}</h1><p class="muted">${escapeHTML(song.artist||'Luca Guitar Quest')}</p><p>${escapeHTML(song.rights||'Eigene Übungsdaten')}</p>${song.referenceOnly?'<div class="detail-warning"><b>Referenz-Template:</b> Dieser Lieblingssong ist in deiner Bibliothek, enthält aber keine kopierten Original-Tabs oder Audiodaten. Der vorhandene Rhythmusmodus ist ein neutrales Übungstemplate. Für eine exakte Spielspur importiere eine legal nutzbare MIDI-, MusicXML-, ChordPro-, Tab- oder GuitarPro-Quelle.</div>':''}<div class="mode-picker">${modes.map(m=>`<button class="mode-button ${m===state.detailMode?'active':''}" data-mode-pick="${m}">${modeLabel(m)}</button>`).join('')}</div><div class="button-row" style="margin-top:1rem"><button id="detailPlayBtn" class="button primary">${song.referenceOnly?'Rhythmus-Template üben':'Im gewählten Modus spielen'}</button>${song.referenceUrl?`<button id="detailReferenceBtn" class="button secondary">Original-Link öffnen</button>`:''}</div></div><div class="panel"><h3>Songdaten</h3><div class="detail-metadata"><div class="meta-card"><span class="muted">Tempo</span><b>${song.bpm} BPM</b></div><div class="meta-card"><span class="muted">Tonart</span><b>${song.key||'–'}</b></div><div class="meta-card"><span class="muted">Takt</span><b>${song.timeSig||'4/4'}</b></div><div class="meta-card"><span class="muted">Level</span><b>${song.difficulty}</b></div><div class="meta-card"><span class="muted">Quelle</span><b>${sourceLabel(song.source)}</b></div><div class="meta-card"><span class="muted">Bestwert</span><b>${result?.bestScore||0}%</b></div></div><div style="margin-top:1rem">${starsHTML(result?.stars||0)} <span class="muted">${result?.attempts||0} Versuche</span></div></div></div>`;
  $$('[data-mode-pick]').forEach(btn=>btn.onclick=()=>{state.detailMode=btn.dataset.modePick;renderSongDetail()});
  $('#detailPlayBtn').onclick=()=>startPlayer(song,state.detailMode);
  if($('#detailReferenceBtn')){const btn=$('#detailReferenceBtn');btn.dataset.requiresNetwork='true';btn.onclick=()=>openExternalUrl(song.referenceUrl,'Original-Link')}
}

function bindPlayer(){
  $('#playPauseBtn').onclick=togglePlay;$('#restartBtn').onclick=()=>seekTo(0,true);$('#backFiveBtn').onclick=()=>seekTo(state.player.positionMs-5000,true);$('#forwardFiveBtn').onclick=()=>seekTo(state.player.positionMs+5000,true);
  $('#speedSlider').oninput=e=>setSpeed(Number(e.target.value)/100);$('#speedMinus').onclick=()=>{$('#speedSlider').value=clamp(Number($('#speedSlider').value)-10,50,150);setSpeed(Number($('#speedSlider').value)/100)};$('#speedPlus').onclick=()=>{$('#speedSlider').value=clamp(Number($('#speedSlider').value)+10,50,150);setSpeed(Number($('#speedSlider').value)/100)};
  $('#metronomeBtn').onclick=()=>{state.player.metronome=!state.player.metronome;$('#metronomeBtn').classList.toggle('active',state.player.metronome)};
  $('#playerMicBtn').onclick=async()=>{if(state.player.mic){stopMic();state.player.mic=false}else{const ok=await startMic('player');state.player.mic=ok}$('#playerMicBtn').classList.toggle('active',state.player.mic)};
  $('#timelineSeek').addEventListener('input',e=>{state.player.seeking=true;seekTo(Number(e.target.value),false)});
  $('#timelineSeek').addEventListener('change',()=>{state.player.seeking=false;resetJudgementsAfterSeek(state.player.positionMs)});
  $('#timelineSeek').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key))setTimeout(()=>seekTo(Number(e.target.value),true),0)});
  const timelineWrap=$('.timeline-wrap');let pointerSeeking=false;
  const seekFromPointer=(event,commit=false)=>{const rect=timelineWrap.getBoundingClientRect(),ratio=clamp((event.clientX-rect.left)/Math.max(1,rect.width),0,1);state.player.seeking=!commit;seekTo(ratio*state.player.durationMs,commit)};
  timelineWrap.addEventListener('pointerdown',event=>{if(event.target===$('#timelineSeek'))return;pointerSeeking=true;timelineWrap.setPointerCapture?.(event.pointerId);seekFromPointer(event,false)});
  timelineWrap.addEventListener('pointermove',event=>{if(pointerSeeking)seekFromPointer(event,false)});
  timelineWrap.addEventListener('pointerup',event=>{if(!pointerSeeking)return;pointerSeeking=false;seekFromPointer(event,true);timelineWrap.releasePointerCapture?.(event.pointerId)});
  timelineWrap.addEventListener('pointercancel',()=>{pointerSeeking=false;state.player.seeking=false});
  $('#setLoopABtn').onclick=()=>{state.player.loopA=state.player.positionMs;if(state.player.loopB!==null&&state.player.loopB<=state.player.loopA)state.player.loopB=null;renderLoopRegion()};
  $('#setLoopBBtn').onclick=()=>{state.player.loopB=state.player.positionMs;if(state.player.loopA!==null&&state.player.loopB<=state.player.loopA)state.player.loopA=Math.max(0,state.player.loopB-5000);renderLoopRegion()};
  $('#loopToggleBtn').onclick=()=>{if(state.player.loopA===null||state.player.loopB===null){alert('Setze zuerst Punkt A und Punkt B.');return}state.player.loopOn=!state.player.loopOn;$('#loopToggleBtn').textContent=state.player.loopOn?'Loop an':'Loop aus';$('#loopToggleBtn').classList.toggle('active',state.player.loopOn);renderLoopRegion()};
  window.addEventListener('keydown',e=>{if(!$('#screen-player').classList.contains('active'))return;if(e.code==='Space'){e.preventDefault();togglePlay()}if(e.code==='ArrowLeft'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();seekTo(state.player.positionMs-3000,true)}if(e.code==='ArrowRight'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();seekTo(state.player.positionMs+3000,true)}});
  window.addEventListener('resize',drawHighway);
}
async function startPlayer(song,mode){
  const p=state.player;if(p.audioUrl){URL.revokeObjectURL(p.audioUrl);p.audioUrl=null}const oldAudio=$('#backingAudio');oldAudio.pause();oldAudio.removeAttribute('src');oldAudio.load();p.song=song;p.mode=mode;p.events=(song.modes[mode]||[]).map(e=>({...e}));p.durationMs=songDuration(song,mode);p.positionMs=0;p.playing=false;p.lastFrame=0;p.speed=1;p.score=0;p.hits=0;p.misses=0;p.wrong=0;p.combo=0;p.timing=[];p.judged=new Map();p.lastBeat=-1;p.loopA=null;p.loopB=null;p.loopOn=false;p.finished=false;p.audioUrl=null;
  $('#playerTitle').textContent=song.title;$('#playerCategory').textContent=`${song.category} · ${modeLabel(mode)}`;$('#playerMeta').textContent=`${song.bpm} BPM · ${song.timeSig||'4/4'} · Level ${song.difficulty}`;$('#speedSlider').value=100;$('#speedValue').textContent=100;$('#timelineSeek').max=p.durationMs;$('#timelineSeek').value=0;$('#durationLabel').textContent=formatTime(p.durationMs);$('#currentTimeLabel').textContent='0:00';$('#timelineProgress').style.width='0%';
  p.metronome=state.settings.metronome;$('#metronomeBtn').classList.toggle('active',p.metronome);$('#playPauseBtn').textContent='▶';$('#loopToggleBtn').textContent='Loop aus';$('#loopToggleBtn').classList.remove('active');renderInputControls();renderTimelineMarkers();renderPlayerStats();renderLoopRegion();openScreen('player');drawHighway();
  if(song.audioId)await loadSongAudio(song.audioId);
  if($('#liveDetectedNote'))$('#liveDetectedNote').textContent='–';if($('#livePitchDetail'))$('#livePitchDetail').textContent=micStream?'Mikrofon bereit':'Mikrofon aus';if($('#liveTargetNote'))$('#liveTargetNote').textContent=p.events[0]?.label||'–';
  if(state.settings.micDefault&&!micStream){const ok=await startMic('player');p.mic=ok;$('#playerMicBtn').classList.toggle('active',ok)}
}
function renderInputControls(){
  const p=state.player;let html='';
  if(p.mode==='melody')html=STRINGS.map((s,i)=>`<button class="input-button" data-input-string="${i}">${s.name}<small> Saite</small></button>`).join('');
  if(p.mode==='chords'){const chords=[...new Set(p.events.map(e=>e.chord))];html=chords.map(ch=>`<button class="input-button" data-input-chord="${ch}">${ch}</button>`).join('')+`<button class="input-button" id="manualChordBtn">✓ gespielt</button>`}
  if(p.mode==='rhythm')html=`<button class="input-button" data-input-rhythm="down">↓ Abschlag</button><button class="input-button" data-input-rhythm="up">↑ Aufschlag</button>`;
  $('#inputControls').innerHTML=html;
  $$('[data-input-string]').forEach(b=>b.onclick=()=>judgeInput({type:'melody',string:Number(b.dataset.inputString)},b));
  $$('[data-input-chord]').forEach(b=>b.onclick=()=>judgeInput({type:'chords',chord:b.dataset.inputChord},b));
  $$('[data-input-rhythm]').forEach(b=>b.onclick=()=>judgeInput({type:'rhythm',direction:b.dataset.inputRhythm},b));
  if($('#manualChordBtn'))$('#manualChordBtn').onclick=()=>judgeInput({type:'chords',chord:null},$('#manualChordBtn'));
}
function togglePlay(){
  const p=state.player;if(!p.song)return;
  if(p.positionMs>=p.durationMs-20)seekTo(0,true);
  p.playing=!p.playing;p.lastFrame=performance.now();$('#playPauseBtn').textContent=p.playing?'Ⅱ':'▶';
  const audio=$('#backingAudio');if(p.playing&&audio.src){audio.playbackRate=p.speed;audio.currentTime=p.positionMs/1000;audio.play().catch(()=>{})}else if(audio.src)audio.pause();
if(p.playing){requestWakeLock();document.body.classList.add('player-active');requestAnimationFrame(playerLoop)}else{releaseWakeLock();document.body.classList.remove('player-active')}
}
function setSpeed(speed){state.player.speed=speed;$('#speedValue').textContent=Math.round(speed*100);const audio=$('#backingAudio');if(audio.src)audio.playbackRate=speed}
function seekTo(ms,commit=true){
  const p=state.player;p.positionMs=clamp(Number(ms)||0,0,p.durationMs||0);p.lastFrame=performance.now();
  $('#timelineSeek').value=p.positionMs;$('#currentTimeLabel').textContent=formatTime(p.positionMs);updateTimelineProgress();
  const audio=$('#backingAudio');if(audio.src&&Number.isFinite(audio.duration)){const target=clamp(p.positionMs/1000,0,audio.duration||0);if(Math.abs(audio.currentTime-target)>.08)audio.currentTime=target}
  if(commit){p.seeking=false;resetJudgementsAfterSeek(p.positionMs)}drawHighway();
}
function resetJudgementsAfterSeek(position){
  const p=state.player;
  for(const [id,result] of [...p.judged.entries()]){const event=p.events.find(e=>e.id===id);if(event&&event.timeMs>=position-500)p.judged.delete(id)}
  recalcAttemptStats();p.finished=false;
}
function recalcAttemptStats(){
  const p=state.player;const vals=[...p.judged.values()];p.hits=vals.filter(v=>v.status==='hit').length;p.misses=vals.filter(v=>v.status==='miss').length;p.wrong=vals.filter(v=>v.status==='wrong').length;p.timing=vals.filter(v=>v.status==='hit').map(v=>v.diff);p.score=vals.reduce((n,v)=>n+(v.points||0),0);p.combo=0;renderPlayerStats();
}
function playerLoop(now){
  const p=state.player;if(!p.playing)return;
  if(p.seeking){p.lastFrame=now;requestAnimationFrame(playerLoop);return}
  const audio=$('#backingAudio');
  if(audio.src&&!audio.paused)p.positionMs=audio.currentTime*1000;else{const delta=(now-p.lastFrame)*p.speed;p.positionMs+=Math.max(0,delta)}p.lastFrame=now;
  if(p.loopOn&&p.loopA!==null&&p.loopB!==null&&p.positionMs>=p.loopB){seekTo(p.loopA,true);if(audio.src){audio.currentTime=p.loopA/1000;audio.play().catch(()=>{})}}
  markMissedEvents();playMetronome();updatePlayerUI();drawHighway();
  if(p.positionMs>=p.durationMs){p.positionMs=p.durationMs;p.playing=false;releaseWakeLock();document.body.classList.remove('player-active');$('#playPauseBtn').textContent='▶';finishAttempt();return}
  requestAnimationFrame(playerLoop);
}
function updateTimelineProgress(){const p=state.player,ratio=p.durationMs?clamp(p.positionMs/p.durationMs,0,1):0;$('#timelineProgress').style.width=`calc(${ratio*100}% - ${ratio*16}px)`}
function updatePlayerUI(){const p=state.player;$('#timelineSeek').value=p.positionMs;$('#currentTimeLabel').textContent=formatTime(p.positionMs);updateTimelineProgress();renderPlayerStats();const target=currentTargetEvent();if($('#liveTargetNote'))$('#liveTargetNote').textContent=target?(target.type==='melody'?`${noteName(target.midi)}${Math.floor(target.midi/12)-1} · ${STRINGS[target.string].name}${target.fret}`:target.label):'–'}
function markMissedEvents(){
  const p=state.player,windowMs=Number(state.settings.timingWindow||260);
  p.events.forEach(event=>{if(!p.judged.has(event.id)&&p.positionMs-event.timeMs>windowMs){p.judged.set(event.id,{status:'miss',diff:windowMs,points:0});p.misses++;p.combo=0}})
}
function judgeInput(input,button,options={}){
  const p=state.player;if(!p.song)return false;const windowMs=Number(state.settings.timingWindow||260);let best=null,bestDiff=Infinity,nearTarget=null,nearDiff=Infinity;
  for(const event of p.events){
    if(p.judged.has(event.id)||event.type!==input.type)continue;
    const diff=Math.abs(event.timeMs-p.positionMs);if(diff>windowMs)continue;
    if(diff<nearDiff){nearTarget=event;nearDiff=diff}
    let match=false;
    if(input.type==='melody'){
      if(Number.isFinite(input.midi)&&Number.isFinite(event.midi))match=Math.abs(event.midi-input.midi)<=0;
      else match=event.string===input.string;
    }
    if(input.type==='chords')match=!input.chord||event.chord===input.chord;
    if(input.type==='rhythm')match=event.direction===input.direction;
    if(match&&diff<bestDiff){best=event;bestDiff=diff}
  }
  if(best){
    const timing=Math.max(0,1-bestDiff/windowMs),points=Math.round(100+timing*100+p.combo*3);
    p.judged.set(best.id,{status:'hit',diff:bestDiff,points,inputMidi:input.midi??null});p.hits++;p.combo++;p.timing.push(bestDiff);p.score+=points;flashButton(button,'hit');renderPlayerStats();return true;
  }
  if(options.fromMic){
    if(nearTarget&&options.countWrong===true){p.wrong++;p.combo=0;flashButton(button,'wrong');renderPlayerStats()}
    return false;
  }
  p.wrong++;p.combo=0;flashButton(button,'wrong');renderPlayerStats();return false;
}
function flashButton(button,cls){if(!button)return;button.classList.add(cls);setTimeout(()=>button.classList.remove(cls),170)}
function renderPlayerStats(){
  const p=state.player,judged=p.hits+p.misses,accuracy=judged?Math.round(p.hits/judged*100):0,avg=p.timing.length?Math.round(p.timing.reduce((a,b)=>a+b,0)/p.timing.length):null;
  $('#playerScore').textContent=p.score;$('#playerAccuracy').textContent=`${accuracy}%`;$('#playerTiming').textContent=avg===null?'–':`${avg} ms`;$('#playerCombo').textContent=p.combo;
}
function finishAttempt(){
  const p=state.player;if(p.finished)return;p.finished=true;markMissedEvents();const total=p.events.length,accuracy=total?Math.round(p.hits/total*100):0,avg=p.timing.length?p.timing.reduce((a,b)=>a+b,0)/p.timing.length:Number(state.settings.timingWindow),timingScore=Math.round(Math.max(0,1-avg/Number(state.settings.timingWindow))*100),overall=Math.round(accuracy*.7+timingScore*.3),stars=overall>=90?3:overall>=75?2:overall>=50?1:0,xp=40+stars*40+Math.round(overall*.6);
  const key=`${p.song.id}:${p.mode}`,old=state.progress.songResults[key]||{bestScore:0,stars:0,attempts:0};state.progress.songResults[key]={bestScore:Math.max(old.bestScore,overall),stars:Math.max(old.stars,stars),attempts:old.attempts+1,bestTiming:old.bestTiming===undefined?Math.round(avg):Math.min(old.bestTiming,Math.round(avg)),lastPlayed:new Date().toISOString()};state.progress.xp=(state.progress.xp||0)+xp;state.progress.streak=(state.progress.streak||0)+1;state.progress.lastPlayed=[p.song.id,...(state.progress.lastPlayed||[]).filter(id=>id!==p.song.id)].slice(0,12);persistProgress();renderAll();
  alert(`Auswertung\n${stars} von 3 Sternen\n${accuracy}% Trefferquote\n${timingScore}% Timingwertung\nGesamt: ${overall}%\n+${xp} XP`);
}
async function persistProgress(){if(DB.db)await DB.put('progress',state.progress);else fallbackWrite('lq-pro-progress',state.progress)}
function renderTimelineMarkers(){const p=state.player;$('#timelineMarkers').style.backgroundSize=`${Math.max(20,100/Math.max(4,p.events.length))}% 100%`}
function renderLoopRegion(){
  const p=state.player,el=$('#loopRegion');if(p.loopA===null||p.loopB===null){el.classList.add('hidden');return}const left=p.loopA/p.durationMs*100,width=(p.loopB-p.loopA)/p.durationMs*100;el.style.left=`${left}%`;el.style.width=`${width}%`;el.classList.remove('hidden')
}
function drawHighway(){
  const canvas=$('#gameCanvas'),ctx=canvas.getContext('2d'),p=state.player;if(!p.song)return;const dpr=window.devicePixelRatio||1,cssW=canvas.clientWidth||1200,cssH=canvas.clientHeight||520;if(canvas.width!==Math.round(cssW*dpr)||canvas.height!==Math.round(cssH*dpr)){canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);const w=cssW,h=cssH;ctx.clearRect(0,0,w,h);
  const skyH=h*.42;ctx.fillStyle='#4775e9';ctx.fillRect(0,0,w,skyH);ctx.fillStyle='#292d32';ctx.fillRect(0,skyH,w,h-skyH);
  for(let i=0;i<6;i++){const y=skyH+(i+1)*(h-skyH)/7;ctx.strokeStyle=i%2?'#e6c36f':'#b58d42';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  for(let x=0;x<w;x+=w/8){ctx.strokeStyle='rgba(71,118,239,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w/2+(x-w/2)*.2,skyH);ctx.lineTo(x,h);ctx.stroke()}
  const hitX=w*.22;ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(hitX-18,skyH,36,h-skyH);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hitX,skyH);ctx.lineTo(hitX,h);ctx.stroke();
  const lookAhead=3500/p.speed,lookBehind=500;for(const event of p.events){const dt=event.timeMs-p.positionMs;if(dt>lookAhead||dt<-lookBehind)continue;const x=hitX+(dt/lookAhead)*(w-hitX+80);const judged=p.judged.get(event.id);let y=h*.68,color='#fff',label=event.label||'';if(event.type==='melody'){y=skyH+(event.string+1)*(h-skyH)/7;color=STRINGS[event.string].color}else if(event.type==='chords'){y=h*.62;color='#ffb84c'}else if(event.type==='rhythm'){y=h*.78;color='#16e0ad'}ctx.globalAlpha=judged?.status==='miss'?.25:1;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,event.type==='chords'?23:17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,y);ctx.globalAlpha=1}
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.font='bold 18px system-ui';ctx.textAlign='left';ctx.fillText(`${modeLabel(p.mode)} · ${formatTime(p.positionMs)} / ${formatTime(p.durationMs)}`,20,30);
}
function playMetronome(){
  const p=state.player;if(!p.metronome||!p.playing)return;const beatMs=60000/(p.song.bpm||90),beat=Math.floor(p.positionMs/beatMs);if(beat===p.lastBeat)return;p.lastBeat=beat;try{ensureAudioContext();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.frequency.value=beat%4===0?1050:760;gain.gain.setValueAtTime(.0001,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.12,audioCtx.currentTime+.004);gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.05);osc.connect(gain).connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+.06)}catch{}
}
async function loadSongAudio(audioId){
  if(!DB.db)return;const rec=await DB.get('audio',audioId);if(!rec?.blob)return;const url=URL.createObjectURL(rec.blob);state.player.audioUrl=url;const audio=$('#backingAudio');audio.src=url;audio.onloadedmetadata=()=>{if(Number.isFinite(audio.duration)){state.player.durationMs=Math.max(state.player.durationMs,audio.duration*1000);$('#timelineSeek').max=state.player.durationMs;$('#durationLabel').textContent=formatTime(state.player.durationMs)}}
}

let audioCtx=null,analyser=null,micStream=null,micSource=null,timeData=null,freqData=null,micLoopId=null;
let lastDetectedMidi=null,lastDetectedAt=0,lastChordAt=0,lastMicFrame=0,lastStrongSignalAt=0;
let pitchHistory=[],micPermissionState='unknown',lastMicError='';

async function ensureAudioContext(){
  if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
  if(audioCtx.state==='suspended')await audioCtx.resume();
  return audioCtx;
}
function micEnvironment(){return{secure:window.isSecureContext===true,hasAPI:!!navigator.mediaDevices?.getUserMedia,protocol:location.protocol,host:location.host||'lokale Datei'}}
function updateMicEnvironmentUI(){
  const env=micEnvironment(),el=$('#micEnvironment');if(!el)return env;
  if(!env.secure){el.className='mic-environment bad';el.textContent=`Mikrofon blockiert: Die App läuft über ${env.protocol||'eine lokale Datei'}. Öffne sie über eine HTTPS-Adresse. Eine entpackte index.html aus der Dateien-App reicht auf dem iPad nicht.`}
  else if(!env.hasAPI){el.className='mic-environment bad';el.textContent='Dieser Browser stellt navigator.mediaDevices.getUserMedia nicht bereit. Öffne die HTTPS-Version in Safari.'}
  else{el.className='mic-environment ok';el.textContent='Mikrofonumgebung bereit: sichere HTTPS-Verbindung und Audio-Schnittstelle erkannt.'}
  return env;
}
function setMicStatus(text,kind='normal'){
  const box=$('#micStatusBox');if(box){box.textContent=text;box.style.color=kind==='bad'?'var(--bad)':kind==='good'?'var(--good)':kind==='warn'?'var(--gold)':'var(--muted)'}
  const detail=$('#livePitchDetail');if(detail&&!state.player.mic)detail.textContent=text;
}
function updateMicButtons(active){
  const tuner=$('#tunerMicBtn'),player=$('#playerMicBtn');
  if(tuner)tuner.textContent=active?'■ Mikrofon stoppen':'🎙 Mikrofon starten';
  if(player){player.classList.toggle('active',active&&state.player.mic);player.textContent=active&&state.player.mic?'Mikro an':'Mikro'}
  const dot=$('#liveMicDot');if(dot){dot.classList.toggle('on',active);dot.classList.remove('bad','warn')}
}
async function queryMicPermission(){
  try{if(navigator.permissions?.query){const p=await navigator.permissions.query({name:'microphone'});micPermissionState=p.state;p.onchange=()=>{micPermissionState=p.state;updateMicEnvironmentUI()}}}catch{}
  return micPermissionState;
}
async function startMic(origin='tuner'){
  if(micStream?.active){if(origin==='player')state.player.mic=true;updateMicButtons(true);return true}
  const env=updateMicEnvironmentUI();
  if(!env.secure){setMicStatus('Kein Mikrofonzugriff: Diese Version muss über HTTPS geöffnet werden.','bad');return false}
  if(!env.hasAPI){setMicStatus('Kein Mikrofonzugriff: MediaDevices API fehlt. Bitte Safari verwenden.','bad');return false}
  try{
    await queryMicPermission();await ensureAudioContext();
    micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:{ideal:1},echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    const track=micStream.getAudioTracks()[0];if(!track||track.readyState!=='live')throw new Error('Der Mikrofon-Audiokanal ist nicht aktiv.');
    micSource=audioCtx.createMediaStreamSource(micStream);analyser=audioCtx.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=0;
    timeData=new Float32Array(analyser.fftSize);freqData=new Uint8Array(analyser.frequencyBinCount);micSource.connect(analyser);
    pitchHistory=[];lastMicFrame=0;lastStrongSignalAt=performance.now();lastMicError='';
    if(origin==='player')state.player.mic=true;
    updateMicButtons(true);setMicStatus('Mikrofon läuft. Spiele eine einzelne Saite sauber an.','good');micLoopId=requestAnimationFrame(micLoop);return true;
  }catch(err){
    lastMicError=`${err.name||'Fehler'}: ${err.message||err}`;
    const messages={NotAllowedError:'Mikrofonzugriff wurde abgelehnt. Erlaube ihn in Safari für diese Website.',SecurityError:'Mikrofon ist in dieser Umgebung aus Sicherheitsgründen blockiert.',NotFoundError:'Es wurde kein Mikrofon gefunden.',NotReadableError:'Das Mikrofon wird möglicherweise von einer anderen App verwendet.',AbortError:'Der Mikrofonstart wurde abgebrochen.'};
    setMicStatus(messages[err.name]||`Mikrofon konnte nicht gestartet werden: ${err.message||err}`,'bad');const dot=$('#liveMicDot');if(dot)dot.classList.add('bad');updateMicButtons(false);return false;
  }
}
function stopMic(reason='Mikrofon gestoppt.'){
  state.player.mic=false;if(micLoopId)cancelAnimationFrame(micLoopId);micLoopId=null;try{micSource?.disconnect()}catch{}micSource=null;
  if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;analyser=null;timeData=null;freqData=null;pitchHistory=[];updateMicButtons(false);setMicStatus(reason,'normal');
  if($('#liveDetectedNote'))$('#liveDetectedNote').textContent='–';if($('#liveTargetNote'))$('#liveTargetNote').textContent='–';
}
function signalRms(buf){let sum=0,peak=0;for(let i=0;i<buf.length;i++){const v=buf[i];sum+=v*v;peak=Math.max(peak,Math.abs(v))}return{rms:Math.sqrt(sum/buf.length),peak}}
function detectPitchYIN(buf,sampleRate){
  const minFreq=65,maxFreq=1000,minTau=Math.max(2,Math.floor(sampleRate/maxFreq)),maxTau=Math.min(Math.floor(sampleRate/minFreq),Math.floor(buf.length/2)-1),threshold=.16;
  const diff=new Float32Array(maxTau+1),cmnd=new Float32Array(maxTau+1);let running=0;
  for(let tau=minTau;tau<=maxTau;tau++){let sum=0;for(let i=0;i<buf.length-maxTau;i+=2){const d=buf[i]-buf[i+tau];sum+=d*d}diff[tau]=sum}
  cmnd[minTau]=1;
  for(let tau=minTau+1;tau<=maxTau;tau++){running+=diff[tau];cmnd[tau]=running?diff[tau]*(tau-minTau)/running:1}
  let tau=-1;
  for(let t=minTau+2;t<maxTau-1;t++){if(cmnd[t]<threshold&&cmnd[t]<=cmnd[t-1]&&cmnd[t]<cmnd[t+1]){tau=t;break}}
  if(tau<0){let best=1;for(let t=minTau+2;t<maxTau-1;t++){if(cmnd[t]<best){best=cmnd[t];tau=t}}if(tau<0||best>.32)return null}
  const x0=cmnd[tau-1],x1=cmnd[tau],x2=cmnd[tau+1],den=(2*x1-x2-x0);let better=tau;if(Math.abs(den)>1e-9)better=tau+(x2-x0)/(2*den);
  const frequency=sampleRate/better,clarity=clamp(1-cmnd[tau],0,1);if(!Number.isFinite(frequency)||frequency<minFreq||frequency>maxFreq)return null;return{frequency,clarity,tau:better}
}
function median(values){if(!values.length)return 0;const a=[...values].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function smoothPitch(freq,midi){pitchHistory.push({freq,midi,time:performance.now()});pitchHistory=pitchHistory.filter(x=>performance.now()-x.time<500&&Math.abs(x.midi-midi)<=1).slice(-7);return median(pitchHistory.map(x=>x.freq))||freq}
function nearestOpenString(freq){let best=null;STRINGS.forEach((string,index)=>{const cents=1200*Math.log2(freq/string.freq),absCents=Math.abs(cents);if(!best||absCents<best.absCents)best={index,string,cents,absCents}});return best}
function currentTargetEvent(){const p=state.player;if(!p.song)return null;let best=null,bestDiff=Infinity;for(const e of p.events){if(p.judged.has(e.id))continue;const d=e.timeMs-p.positionMs;if(d<-(state.settings.timingWindow||260)||d>1800)continue;if(Math.abs(d)<bestDiff){best=e;bestDiff=Math.abs(d)}}return best}
function updateSignalUI(rms,clarity){
  const level=clamp((20*Math.log10(Math.max(rms,1e-6))+60)/45*100,0,100),conf=clamp(clarity*100,0,100);
  if($('#micLevelBar'))$('#micLevelBar').style.width=`${level}%`;if($('#micLevelText'))$('#micLevelText').textContent=`${Math.round(level)} %`;
  if($('#pitchConfidenceBar'))$('#pitchConfidenceBar').style.width=`${conf}%`;if($('#pitchConfidenceText'))$('#pitchConfidenceText').textContent=`${Math.round(conf)} %`;
}
function updateDetectedPitch(freq,clarity){
  const midiFloat=69+12*Math.log2(freq/440),midi=Math.round(midiFloat),cents=Math.round((midiFloat-midi)*100),loc=nearestStringAndFret(midi),note=`${noteName(midi)}${Math.floor(midi/12)-1}`;
  const open=nearestOpenString(freq),nearOpen=open&&open.absCents<180;
  if($('#tunerNote'))$('#tunerNote').textContent=note;if($('#tunerInfo'))$('#tunerInfo').textContent=`${Math.round(freq*10)/10} Hz · ${cents>=0?'+':''}${cents} Cent · Saite ${STRINGS[loc.string].name}, Bund ${loc.fret}`;
  if($('#tunerPointer'))$('#tunerPointer').style.left=`${50+clamp(cents,-50,50)*.9}%`;
  if($('#tunerTargetString'))$('#tunerTargetString').textContent=nearOpen?`${open.string.name}-Saite`:`${STRINGS[loc.string].name}, Bund ${loc.fret}`;
  if($('#tunerTargetFrequency'))$('#tunerTargetFrequency').textContent=nearOpen?`Ziel ${open.string.freq.toFixed(2)} Hz · ${Math.abs(open.cents)<4?'gestimmt':open.cents<0?'zu tief':'zu hoch'} ${Math.round(Math.abs(open.cents))} Cent`:'Kein offener Standardton in direkter Nähe';
  if($('#liveDetectedNote'))$('#liveDetectedNote').textContent=note;if($('#livePitchDetail'))$('#livePitchDetail').textContent=`${Math.round(freq*10)/10} Hz · ${cents>=0?'+':''}${cents} Cent · Sicherheit ${Math.round(clarity*100)}%`;
  const target=currentTargetEvent();if($('#liveTargetNote'))$('#liveTargetNote').textContent=target?(target.type==='melody'?`${noteName(target.midi)}${Math.floor(target.midi/12)-1} · ${STRINGS[target.string].name}${target.fret}`:target.label):'–';return{midi,cents,loc,note}
}
function micLoop(now=performance.now()){
  if(!analyser||!timeData)return;if(now-lastMicFrame<65){micLoopId=requestAnimationFrame(micLoop);return}lastMicFrame=now;
  analyser.getFloatTimeDomainData(timeData);if(freqData)analyser.getByteFrequencyData(freqData);const sig=signalRms(timeData);updateSignalUI(sig.rms,0);
  if(sig.rms<.006){if(now-lastStrongSignalAt>700){if($('#tunerInfo'))$('#tunerInfo').textContent='Signal zu leise – Saite etwas kräftiger anschlagen';if($('#livePitchDetail'))$('#livePitchDetail').textContent='Signal zu leise';const dot=$('#liveMicDot');if(dot){dot.classList.remove('on');dot.classList.add('warn')}}micLoopId=requestAnimationFrame(micLoop);return}
  lastStrongSignalAt=now;const pitch=detectPitchYIN(timeData,audioCtx.sampleRate);updateSignalUI(sig.rms,pitch?.clarity||0);
  if(!pitch||pitch.clarity<.62){if($('#tunerInfo'))$('#tunerInfo').textContent='Ton noch nicht stabil erkannt – einzeln anschlagen und ausklingen lassen';if($('#livePitchDetail'))$('#livePitchDetail').textContent='Ton instabil';micLoopId=requestAnimationFrame(micLoop);return}
  const rawMidi=Math.round(69+12*Math.log2(pitch.frequency/440)),freq=smoothPitch(pitch.frequency,rawMidi),det=updateDetectedPitch(freq,pitch.clarity);const dot=$('#liveMicDot');if(dot){dot.classList.add('on');dot.classList.remove('warn','bad')}
  const t=performance.now();if(state.player.mic&&state.player.playing&&state.player.mode==='melody'&&(det.midi!==lastDetectedMidi||t-lastDetectedAt>240)){judgeInput({type:'melody',string:det.loc.string,midi:det.midi},null,{fromMic:true,countWrong:false});lastDetectedMidi=det.midi;lastDetectedAt=t}
  if(state.player.mic&&state.player.playing&&state.player.mode==='chords'&&t-lastChordAt>450){const ch=detectChord();if(ch){judgeInput({type:'chords',chord:ch},null,{fromMic:true,countWrong:false});lastChordAt=t}}micLoopId=requestAnimationFrame(micLoop)
}
function nearestStringAndFret(midi){let best={string:0,fret:0,diff:999};STRINGS.forEach((s,i)=>{for(let fret=0;fret<=24;fret++){const diff=Math.abs(s.midi+fret-midi);if(diff<best.diff)best={string:i,fret,diff}}});return best}
function noteName(midi){return ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][((midi%12)+12)%12]}
function detectChord(){
  if(!freqData||!audioCtx||!analyser)return null;const chroma=new Array(12).fill(0),binHz=audioCtx.sampleRate/analyser.fftSize;for(let bin=2;bin<freqData.length;bin++){const mag=freqData[bin];if(mag<55)continue;const freq=bin*binHz;if(freq<70||freq>1400)continue;const midi=Math.round(69+12*Math.log2(freq/440));chroma[((midi%12)+12)%12]+=mag}
  let best=null,bestScore=0;for(const [name,tones] of Object.entries(CHORD_TONES)){const inside=tones.reduce((sum,t)=>sum+chroma[t],0),outside=chroma.reduce((sum,v,i)=>sum+(tones.includes(i)?0:v),0),score=inside/(inside+outside*.55+1);if(score>bestScore){bestScore=score;best=name}}return bestScore>.5?best:null
}
function runPitchSelfTest(){
  const sr=48000,results=[];for(const string of STRINGS){const length=4096,buf=new Float32Array(length);for(let i=0;i<length;i++){const t=i/sr;buf[i]=.75*Math.sin(2*Math.PI*string.freq*t)+.16*Math.sin(2*Math.PI*string.freq*2*t)+.07*Math.sin(2*Math.PI*string.freq*3*t)}const found=detectPitchYIN(buf,sr),error=found?Math.abs(1200*Math.log2(found.frequency/string.freq)):999;results.push({name:string.name,target:string.freq,found:found?.frequency||0,error,ok:error<8})}
  const ok=results.every(r=>r.ok),message=results.map(r=>`${r.ok?'✓':'✗'} ${r.name}: ${r.found.toFixed(2)} Hz (Abweichung ${r.error.toFixed(1)} Cent)`).join('\n');setMicStatus(`${ok?'Interne Tonanalyse fehlerfrei.':'Interne Tonanalyse mit Abweichung.'}\n${message}`,ok?'good':'bad');return{ok,results}
}
function bindTuner(){updateMicEnvironmentUI();queryMicPermission();$('#tunerMicBtn').onclick=async()=>{if(micStream){stopMic();return}await startMic('tuner')};$('#tunerSelfTestBtn').onclick=()=>{const r=runPitchSelfTest();alert(`${r.ok?'Tonanalyse funktioniert.':'Tonanalyse meldet Fehler.'}\n\n${r.results.map(x=>`${x.name}: ${x.found.toFixed(1)} Hz`).join('\n')}`)}}

function bindImport(){
  $('#favoriteSaveBtn').onclick=saveFavoriteSong;$('#legalSearchBtn').onclick=openLegalSearch;$('#importFileBtn').onclick=importSelectedFile;
}
async function saveFavoriteSong(){
  const title=$('#favoriteTitle').value.trim()||'Mein Lieblingssong',url=$('#favoriteUrl').value.trim(),bpm=clamp(Number($('#favoriteBpm').value)||90,40,220),chords=parseChords($('#favoriteChords').value);
  const song={id:uid('favorite'),title,artist:'Eigener Favorit',category:'Favorit',difficulty:2,bpm,key:chords[0]||'–',timeSig:'4/4',source:'favorite',rights:'Linkreferenz + eigene Übungsdaten',referenceUrl:url,tags:['Favorit'],modes:{chords:chordEvents(chords,bpm,4),rhythm:rhythmEvents('D D U U D U',bpm,6)}};
  await saveCustomSong(song);alert('Favorit wurde als Akkord- und Rhythmusübung gespeichert.');$('#favoriteTitle').value='';$('#favoriteUrl').value='';
}
function openLegalSearch(){const q=encodeURIComponent($('#legalQuery').value.trim()||'guitar midi public domain'),src=$('#legalSource').value,urls={mutopia:`https://www.mutopiaproject.org/cgibin/make-table.cgi?searchingfor=${q}`,imslp:`https://imslp.org/index.php?search=${q}`,gutenberg:`https://www.gutenberg.org/ebooks/search/?query=${q}+sheet+music`,wikimedia:`https://commons.wikimedia.org/w/index.php?search=${q}+midi+music`,web:`https://www.google.com/search?q=${q}+public+domain+midi+musicxml+guitar`};openExternalUrl(urls[src],'Legale Songquelle')}
async function importSelectedFile(){
  const file=$('#importFile').files[0];if(!file){setImportStatus('Bitte zuerst eine Datei auswählen.',true);return}const type=$('#importType').value,rights=$('#importRights').value,note=$('#importSourceNote').value.trim();
  try{
    let song=null;
    if(type==='midi')song=await parseMidiFile(file);
    else if(type==='tab')song=parseTextTab(await file.text(),file.name);
    else if(type==='chordpro')song=parseChordPro(await file.text(),file.name);
    else if(type==='musicxml')song=parseMusicXML(await file.text(),file.name);
    else if(type==='json')song=parseLucaJSON(await file.text());
    else if(type==='audio')song=await importOwnAudio(file);
    if(song){song.source='import';song.rights=rights;song.category=song.category||'Import';song.artist=song.artist||'Eigener Import';await saveCustomSong(song);setImportStatus(`${file.name} wurde importiert und ist in der Bibliothek spielbar.`)}
    else if(type==='guitarpro'){await saveSource({id:uid('source'),name:file.name,type:'GuitarPro',rights,note,size:file.size,created:new Date().toISOString()});setImportStatus('GuitarPro-Datei als legale Quelle gespeichert. Ein vollständiger GP-Binärparser ist bewusst als eigener späterer Modulbaustein vorgesehen.')}
  }catch(err){console.error(err);setImportStatus(`Importfehler: ${err.message}`,true)}
}
function setImportStatus(msg,error=false){$('#importStatus').textContent=msg;$('#importStatus').style.color=error?'var(--bad)':'var(--good)'}
async function saveCustomSong(song){song.id=String(song.id||uid('song')).replace(/[^a-zA-Z0-9_-]/g,'-');if(DB.db){await DB.put('songs',song);state.customSongs=await DB.getAll('songs')}else{state.customSongs=mergeSongSets(state.customSongs,[song]);fallbackWrite('lq-pro-songs',state.customSongs)}state.songs=mergeSongSets(BUILTIN_SONGS,REFERENCE_SONGS,state.customSongs);renderAll()}
async function saveSource(source){if(DB.db){await DB.put('sources',source);state.sources=await DB.getAll('sources')}else{state.sources=[source,...state.sources.filter(s=>s.id!==source.id)];fallbackWrite('lq-pro-sources',state.sources)}renderSources()}
function renderSources(){const list=[...state.sources].sort((a,b)=>(b.created||'').localeCompare(a.created||''));$('#sourceLibrary').innerHTML=list.length?list.map(s=>`<div class="source-item"><b>${escapeHTML(s.name)}</b><div class="muted">${escapeHTML(s.type||'Quelle')} · ${escapeHTML(s.rights||'')}</div><small>${escapeHTML(s.note||'')}</small></div>`).join(''):'Noch keine Quellen gespeichert.'}
function parseChords(text){const matches=text.match(/\b(B7|Em|Am|Dm|G|D|C|A|E|F)\b/g);return matches?.length?matches:['G','D','Em','C']}
function parseChordPro(text,name){
  const title=text.match(/\{title:\s*([^}]+)\}/i)?.[1]?.trim()||name.replace(/\.[^.]+$/,'');
  let chords=[...text.matchAll(/\[([^\]]+)\]/g)].map(m=>m[1].trim()).filter(ch=>CHORD_TONES[ch]);
  if(!chords.length)chords=parseChords(text).filter(ch=>CHORD_TONES[ch]);
  if(!chords.length)throw new Error('Keine unterstützten Akkorde gefunden.');
  return{id:uid('chordpro'),title,category:'Import',difficulty:2,bpm:84,key:chords[0],timeSig:'4/4',tags:['ChordPro'],modes:{chords:chordEvents(chords,84,4),rhythm:rhythmEvents('D D U U D U',84,6)}}
}
function parseTextTab(text,name){
  const raw=text.split(/\r?\n/).map(l=>l.trim()).filter(l=>/^[eBGDAE][|:-]/.test(l));
  if(raw.length<6)throw new Error('Es wurden keine sechs Tab-Zeilen erkannt.');
  const lines=raw.slice(0,6),events=[];
  lines.forEach((line,row)=>{
    const body=line.replace(/^[eBGDAE]/,'');
    for(const match of body.matchAll(/\d{1,2}/g)){
      const string=5-row,fret=Number(match[0]);
      if(fret<0||fret>30)continue;
      events.push({id:uid('tabnote'),timeMs:Math.round(match.index*125),durationMs:350,type:'melody',string,fret,midi:STRINGS[string].midi+fret,label:`${STRINGS[string].name}${fret}`});
    }
  });
  events.sort((a,b)=>a.timeMs-b.timeMs||a.string-b.string);
  if(!events.length)throw new Error('Keine Bundnummern gefunden.');
  return{id:uid('tab'),title:name.replace(/\.[^.]+$/,''),category:'Import',difficulty:2,bpm:90,key:'–',timeSig:'4/4',tags:['Text-Tab'],modes:{melody:events}}
}
function parseMusicXML(text,name){
  const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error('MusicXML ist nicht gültig.');const divisions=Number(doc.querySelector('divisions')?.textContent)||1,tempo=Number(doc.querySelector('sound[tempo]')?.getAttribute('tempo'))||90,notes=[];let cursor=0;
  for(const node of doc.querySelectorAll('note')){const duration=Number(node.querySelector('duration')?.textContent)||divisions,isChord=!!node.querySelector('chord');if(node.querySelector('rest')){if(!isChord)cursor+=duration;continue}const step=node.querySelector('pitch > step')?.textContent,alter=Number(node.querySelector('pitch > alter')?.textContent)||0,octave=Number(node.querySelector('pitch > octave')?.textContent);if(!step||!Number.isFinite(octave)){if(!isChord)cursor+=duration;continue}const pc={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[step]+alter,midi=(octave+1)*12+pc,loc=nearestStringAndFret(midi),eventCursor=isChord?Math.max(0,cursor-duration):cursor,timeMs=Math.round(eventCursor/divisions*(60000/tempo));notes.push({id:uid('xmlnote'),timeMs,durationMs:Math.round(duration/divisions*(60000/tempo)),type:'melody',string:loc.string,fret:loc.fret,midi,label:`${STRINGS[loc.string].name}${loc.fret}`});if(!isChord)cursor+=duration}
  if(!notes.length)throw new Error('Keine spielbaren Noten gefunden.');return{id:uid('musicxml'),title:doc.querySelector('work-title')?.textContent||name.replace(/\.[^.]+$/,''),category:'Import',difficulty:3,bpm:tempo,key:'–',timeSig:'4/4',tags:['MusicXML'],modes:{melody:notes}}
}
function parseLucaJSON(text){
  const data=JSON.parse(text);if(!data||typeof data!=='object')throw new Error('JSON-Objekt fehlt.');if(!String(data.title||'').trim())throw new Error('Titel fehlt.');
  if(!data.modes&&Array.isArray(data.notes))data.modes={melody:data.notes};if(!data.modes||typeof data.modes!=='object')throw new Error('modes oder notes fehlen.');
  const normalized={};for(const mode of ['melody','chords','rhythm']){if(!Array.isArray(data.modes[mode]))continue;normalized[mode]=data.modes[mode].map((event,index)=>({...event,id:event.id||`${mode}-${index}`,type:mode,timeMs:Math.max(0,Number(event.timeMs)||0),durationMs:Math.max(80,Number(event.durationMs)||400)})).sort((a,b)=>a.timeMs-b.timeMs)}
  if(!Object.keys(normalized).length)throw new Error('Kein unterstützter Modus mit Ereignissen gefunden.');data.modes=normalized;data.id=String(data.id||uid('json')).replace(/[^a-zA-Z0-9_-]/g,'-');data.difficulty=clamp(Number(data.difficulty)||2,1,10);data.bpm=clamp(Number(data.bpm)||90,30,260);data.timeSig=data.timeSig||'4/4';return data
}
async function parseMidiFile(file){
  const buffer=await file.arrayBuffer(),view=new DataView(buffer);let pos=0;const readStr=n=>{let s='';while(n--)s+=String.fromCharCode(view.getUint8(pos++));return s},u32=()=>{const v=view.getUint32(pos);pos+=4;return v},u16=()=>{const v=view.getUint16(pos);pos+=2;return v},vlq=()=>{let v=0,b;do{b=view.getUint8(pos++);v=(v<<7)+(b&127)}while(b&128);return v};
  if(readStr(4)!=='MThd')throw new Error('Keine Standard-MIDI-Datei.');const headerLen=u32(),format=u16(),tracks=u16(),division=u16();pos+=headerLen-6;let tempo=500000,all=[];
  for(let t=0;t<tracks;t++){if(readStr(4)!=='MTrk')break;const end=pos+u32();let tick=0,running=0;while(pos<end){tick+=vlq();let status=view.getUint8(pos++);if(status<128){pos--;status=running}else running=status;if(status===0xff){const meta=view.getUint8(pos++),len=vlq();if(meta===0x51&&len===3)tempo=(view.getUint8(pos)<<16)|(view.getUint8(pos+1)<<8)|view.getUint8(pos+2);pos+=len;continue}if(status===0xf0||status===0xf7){pos+=vlq();continue}const high=status&0xf0;if(high===0x90){const note=view.getUint8(pos++),vel=view.getUint8(pos++);if(vel>0)all.push({tick,note})}else if(high===0x80||high===0xa0||high===0xb0||high===0xe0)pos+=2;else if(high===0xc0||high===0xd0)pos+=1;else throw new Error('Unbekanntes MIDI-Ereignis.')}}
  const msPerTick=tempo/1000/division,events=all.slice(0,1200).map((n,i)=>{const loc=nearestStringAndFret(n.note);return{id:`midi-${i}`,timeMs:Math.round(n.tick*msPerTick),durationMs:350,type:'melody',string:loc.string,fret:loc.fret,midi:n.note,label:`${STRINGS[loc.string].name}${loc.fret}`}});if(!events.length)throw new Error('Keine Note-On-Ereignisse gefunden.');return{id:uid('midi'),title:file.name.replace(/\.[^.]+$/,''),category:'Import',difficulty:3,bpm:Math.round(60000000/tempo),key:'–',timeSig:'4/4',tags:['MIDI'],modes:{melody:events}}
}
async function importOwnAudio(file){
  if(!file.type.startsWith('audio/'))throw new Error('Die ausgewählte Datei ist keine Audio-Datei.');if(!DB.db)throw new Error('Audio-Import benötigt IndexedDB. Öffne die App über HTTPS oder einen installierten PWA-Webspace.');const audioId=uid('audio');await DB.put('audio',{id:audioId,blob:file,name:file.name,type:file.type});const title=file.name.replace(/\.[^.]+$/,'');return{id:uid('audio-song'),title,artist:'Eigene Audio-Datei',category:'Import',difficulty:2,bpm:90,key:'–',timeSig:'4/4',audioId,tags:['Eigene Audio-Datei'],modes:{rhythm:rhythmEvents('D D U U D U',90,12)}}
}

function bindSettings(){
  $('#highContrastToggle').onchange=e=>{state.settings.highContrast=e.target.checked;saveSettings()};$('#reducedMotionToggle').onchange=e=>{state.settings.reducedMotion=e.target.checked;saveSettings()};$('#fontScale').oninput=e=>{state.settings.fontScale=Number(e.target.value);saveSettings(false);applySettings()};$('#metronomeDefault').onchange=e=>{state.settings.metronome=e.target.checked;saveSettings()};$('#micDefault').onchange=e=>{state.settings.micDefault=e.target.checked;saveSettings()};$('#timingWindow').onchange=e=>{state.settings.timingWindow=Number(e.target.value);saveSettings()};$('#networkToggle').onchange=e=>{state.settings.networkEnabled=e.target.checked;saveSettings();updateNetworkUI()};$('#offlineCheckBtn').onclick=checkOfflineReadiness;$('#runDiagnosticsBtn').onclick=runDiagnostics;$('#exportBackupBtn').onclick=exportBackup;$('#backupImport').onchange=importBackup;
}
function applySettings(){document.body.classList.toggle('high-contrast',!!state.settings.highContrast);document.body.classList.toggle('reduced-motion',!!state.settings.reducedMotion);document.body.classList.toggle('local-only',!state.settings.networkEnabled);document.documentElement.style.setProperty('--font-scale',(state.settings.fontScale||100)/100);$('#highContrastToggle').checked=!!state.settings.highContrast;$('#reducedMotionToggle').checked=!!state.settings.reducedMotion;$('#fontScale').value=state.settings.fontScale||100;$('#metronomeDefault').checked=state.settings.metronome!==false;$('#micDefault').checked=!!state.settings.micDefault;$('#timingWindow').value=String(state.settings.timingWindow||260);if($('#networkToggle'))$('#networkToggle').checked=!!state.settings.networkEnabled;updateNetworkUI()}
async function saveSettings(apply=true){if(DB.db)await DB.put('settings',state.settings);else fallbackWrite('lq-pro-settings',state.settings);if(apply)applySettings()}
async function runDiagnostics(){
  const results=[];const test=(name,ok,detail='')=>results.push(`${ok?'✓':'✗'} ${name}${detail?' — '+detail:''}`),warn=(name,detail='')=>results.push(`! ${name}${detail?' — '+detail:''}`);
  test('Bibliothek geladen',state.songs.length>=BUILTIN_SONGS.length+REFERENCE_SONGS.length,`${state.songs.length} Einträge`);
  test('Mitgelieferte Übungen spielbar',BUILTIN_SONGS.every(s=>availableModes(s).length>0));
  test('Lieblingssong-Katalog geladen',REFERENCE_SONGS.length>=100,`${REFERENCE_SONGS.length} Referenzen`);
  test('Timeline unterstützt Seek',!!$('#timelineSeek')&&!!$('#timelineProgress')&&typeof seekTo==='function');
  test('Direktes Ziehen/Antippen',!!$('.timeline-wrap'));
  test('A/B-Loop vorhanden',!!$('#setLoopABtn')&&!!$('#setLoopBBtn')&&typeof renderLoopRegion==='function');
  test('Echte Treffer-/Timingwertung',typeof judgeInput==='function'&&typeof finishAttempt==='function');
  test('Web Audio verfügbar',!!(window.AudioContext||window.webkitAudioContext));
  test('Sicherer Kontext für Mikrofon',window.isSecureContext===true,`${location.protocol}//${location.host||'lokale Datei'}`);
  navigator.mediaDevices?.getUserMedia?test('Mikrofon-Schnittstelle',true,`Berechtigung: ${await queryMicPermission()}`):warn('Mikrofon-Schnittstelle','nur über HTTPS und einen unterstützten Browser verfügbar');
  const pitchTest=runPitchSelfTest();test('Tonerkennungs-Algorithmus',pitchTest.ok,pitchTest.ok?'alle sechs Standardsaiten erkannt':'synthetischer Test fehlgeschlagen');
  test('Persistenz',!!DB.db?'IndexedDB verbunden':'LocalStorage-Ersatz aktiv');
  for(const [name,fn] of [['ChordPro',()=>parseChordPro('{title: Test}\n[G] [D] [Em] [C]','test.cho')],['Text-Tab',()=>parseTextTab('e|--0--|\nB|--1--|\nG|--0--|\nD|--2--|\nA|--3--|\nE|-----|','test.txt')],['MusicXML',()=>parseMusicXML('<?xml version="1.0"?><score-partwise><part><measure><attributes><divisions>1</divisions></attributes><note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note></measure></part></score-partwise>','test.musicxml')],['Luca JSON',()=>parseLucaJSON('{"title":"Test","modes":{"rhythm":[]}}')]]){
    try{const parsed=fn();test(`${name}-Parser`,!!parsed)}catch(err){test(`${name}-Parser`,false,err.message)}
  }
  test('MIDI-Parser vorhanden',typeof parseMidiFile==='function');('serviceWorker'in navigator)?test('Service Worker',true,'Schnittstelle vorhanden'):warn('Service Worker','nur über HTTPS/localhost aktiv');test('Offline-/Netzwerkmodus',typeof openExternalUrl==='function'&&typeof updateNetworkUI==='function',networkModeLabel());if('caches'in window){const cacheKeys=await caches.keys();const ready=cacheKeys.some(k=>k.startsWith('luca-guitar-ipad-offline-'));ready?test('Offline-Kerncache',true,cacheKeys.join(', ')):warn('Offline-Kerncache','App einmal online neu laden, damit alle Kerndateien gespeichert werden')}
  const failures=results.filter(r=>r.startsWith('✗')).length;results.unshift(failures?`Prüfung abgeschlossen: ${failures} Problem(e) gefunden.`:'Prüfung abgeschlossen: keine internen Funktionsfehler erkannt.');
  $('#diagnosticsOutput').textContent=results.join('\n');return{failures,results};
}
async function exportBackup(){const data={version:2,exportedAt:new Date().toISOString(),songs:state.customSongs,sources:state.sources,progress:state.progress,settings:state.settings};const text=JSON.stringify(data,null,2);$('#backupPreview').value=text;const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Luca_Guitar_Quest_Backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importBackup(e){const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(DB.db){for(const song of data.songs||[])await DB.put('songs',song);for(const source of data.sources||[])await DB.put('sources',source);if(data.progress)await DB.put('progress',data.progress);if(data.settings)await DB.put('settings',data.settings)}else{fallbackWrite('lq-pro-songs',data.songs||[]);fallbackWrite('lq-pro-sources',data.sources||[]);if(data.progress)fallbackWrite('lq-pro-progress',data.progress);if(data.settings)fallbackWrite('lq-pro-settings',data.settings)}await loadPersistentData();applySettings();renderAll();alert('Backup wurde importiert.')}catch(err){alert(`Backup konnte nicht importiert werden: ${err.message}`)}}

function escapeHTML(value=''){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}



// Offline-first network controls
function networkModeLabel(){
  if(!state.settings.networkEnabled)return 'Lokaler Offline-Modus';
  return navigator.onLine?'Internet erlaubt':'Internet erlaubt, aber Verbindung fehlt';
}
function updateNetworkUI(){
  const enabled=!!state.settings.networkEnabled,online=navigator.onLine!==false;
  const top=$('#connectionTop'),box=$('#networkState');
  document.body.classList.toggle('local-only',!enabled);
  if(top){
    top.textContent=!enabled?'◉ Offline':online?'● Online erlaubt':'◌ Keine Verbindung';
    top.classList.remove('network-online','network-offline','network-unavailable');
    top.classList.add(!enabled?'network-offline':online?'network-online':'network-unavailable');
    top.title=networkModeLabel();
  }
  if(box){
    if(!enabled){box.textContent='Lokaler Offline-Modus aktiv. Die App verwendet nur lokal gespeicherte Inhalte; externe Links bleiben gesperrt.';box.style.color='var(--good)'}
    else if(!online){box.textContent='Internet-Funktionen sind erlaubt, aber das iPad hat derzeit keine Verbindung. Die App arbeitet weiter offline.';box.style.color='var(--gold)'}
    else{box.textContent='Internet-Funktionen sind erlaubt. Externe Spotify-, YouTube- und Quellenlinks können geöffnet werden.';box.style.color='var(--good)'}
  }
}
function bindNetworkSupport(){
  window.addEventListener('online',updateNetworkUI);
  window.addEventListener('offline',updateNetworkUI);
  updateNetworkUI();
}
async function openExternalUrl(url,label='Externer Link'){
  if(!url){alert(`${label} ist nicht hinterlegt.`);return false}
  if(!state.settings.networkEnabled){
    const enable=confirm(`${label} benötigt Internet.\n\nDie App ist aktuell im lokalen Offline-Modus. Internet-Funktionen jetzt erlauben?`);
    if(!enable){openScreen('settings');return false}
    state.settings.networkEnabled=true;await saveSettings();updateNetworkUI();
  }
  if(navigator.onLine===false){alert('Zurzeit besteht keine Netzwerkverbindung. Die lokalen Lernfunktionen bleiben trotzdem verfügbar.');return false}
  const win=window.open(url,'_blank','noopener');
  if(!win)alert('Der externe Link wurde vom Browser blockiert. Erlaube Pop-ups für diese App oder öffne den Link in Safari.');
  return !!win;
}
async function checkOfflineReadiness(){
  const lines=[];
  lines.push(`App-Modus: ${isStandaloneMode()?'installierte Home-Bildschirm-App':'Safari/Browser'}`);
  lines.push(`Verbindung: ${navigator.onLine===false?'offline':'online'}`);
  lines.push(`Internet-Funktionen: ${state.settings.networkEnabled?'erlaubt':'ausgeschaltet'}`);
  if(!('serviceWorker'in navigator)){lines.push('✗ Service Worker wird von diesem Browser nicht angeboten.');alert(lines.join('\n'));return false}
  try{
    const reg=await navigator.serviceWorker.getRegistration();
    lines.push(reg?'✓ Service Worker registriert':'! Service Worker noch nicht aktiv – Seite einmal online neu laden.');
    if('caches'in window){const keys=await caches.keys();lines.push(keys.some(k=>k.startsWith('luca-guitar-ipad-offline-'))?'✓ Offline-Kerncache vorhanden':'! Offline-Kerncache noch nicht vollständig. Öffne die App einmal online und lade sie neu.');}
  }catch(err){lines.push(`! Offline-Prüfung nicht möglich: ${err.message}`)}
  const ok=lines.filter(x=>x.startsWith('✗')).length===0;
  alert(lines.join('\n'));
  return ok;
}

// iPad/PWA installation support and screen wake lock
let deferredInstallPrompt = null;
let wakeLockSentinel = null;
function isStandaloneMode(){return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true}
function isAppleMobile(){return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1)}
function updateInstallUI(){
  const installed=isStandaloneMode(),secure=window.isSecureContext===true,apple=isAppleMobile();
  document.body.classList.toggle('standalone-mode',installed);
  const stateEl=$('#installState'),modalStatus=$('#installModalStatus');
  let text='',cls='';
  if(installed){text='Installiert: Die App läuft bereits im eigenständigen Home-Bildschirm-Modus.';cls='good'}
  else if(!secure){text='Noch nicht installierbar: Öffne die App zuerst über eine HTTPS-Adresse. Eine lokal geöffnete ZIP-/HTML-Datei reicht nicht.';cls='bad'}
  else if(apple){text='Bereit zur Installation: Öffne das Teilen-Menü in Safari und wähle „Zum Home-Bildschirm“.';cls='good'}
  else if(deferredInstallPrompt){text='Bereit zur Installation über den Browser.';cls='good'}
  else{text='Die App läuft im Browser. Nutze die Installationsschritte für dein Gerät.';cls='warn'}
  if(stateEl){stateEl.textContent=text;stateEl.className=`install-state ${cls}`}
  if(modalStatus){modalStatus.textContent=text;modalStatus.style.color=cls==='bad'?'var(--bad)':cls==='good'?'var(--good)':'var(--gold)'}
  const hero=$('#installHeroBtn');if(hero)hero.hidden=installed;
  const safariBtn=$('#openSafariMicBtn');if(safariBtn)safariBtn.hidden=!installed;
}
function showInstallGuide(){updateInstallUI();$('#installModal')?.classList.remove('hidden')}
function closeInstallGuide(){$('#installModal')?.classList.add('hidden')}
async function attemptInstall(){
  if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice.catch(()=>null);deferredInstallPrompt=null;updateInstallUI();return}
  showInstallGuide();
}
async function shareInstallLink(){
  const data={title:'Luca Guitar Quest',text:'Luca Guitar Quest auf dem iPad öffnen und installieren',url:location.href.split('#')[0]};
  try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);alert('App-Adresse wurde kopiert.')}}catch(err){if(err?.name!=='AbortError')showInstallGuide()}
}
function openMicrophoneInSafari(){
  const url=new URL(location.href);url.searchParams.set('mic','safari');
  const win=window.open(url.toString(),'_blank','noopener');
  if(!win)alert('Öffne diese App in Safari und starte dort das Stimmgerät.');
}
function bindInstallSupport(){
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;updateInstallUI()});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updateInstallUI()});
  $('#installHeroBtn')?.addEventListener('click',attemptInstall);
  $('#installGuideBtn')?.addEventListener('click',attemptInstall);
  $('#shareInstallLinkBtn')?.addEventListener('click',shareInstallLink);
  $('#closeInstallModal')?.addEventListener('click',closeInstallGuide);
  $('#closeInstallModalBottom')?.addEventListener('click',closeInstallGuide);
  $('#copyAppUrlBtn')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href.split('#')[0]);alert('Adresse kopiert.')}catch{prompt('Kopiere diese Adresse:',location.href.split('#')[0])}});
  $('#installModal')?.addEventListener('click',event=>{if(event.target.id==='installModal')closeInstallGuide()});
  $('#openSafariMicBtn')?.addEventListener('click',openMicrophoneInSafari);
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',updateInstallUI);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.player?.playing)requestWakeLock();else if(document.visibilityState==='hidden')releaseWakeLock()});
  const screenParam=new URLSearchParams(location.search).get('screen');if(screenParam&&['home','learn','library','kids','import','tuner','settings'].includes(screenParam))setTimeout(()=>openScreen(screenParam),0);
  updateInstallUI();
}
async function requestWakeLock(){
  if(!('wakeLock'in navigator)||document.visibilityState!=='visible'||wakeLockSentinel)return false;
  try{wakeLockSentinel=await navigator.wakeLock.request('screen');wakeLockSentinel.addEventListener('release',()=>{wakeLockSentinel=null});return true}catch{return false}
}
async function releaseWakeLock(){try{await wakeLockSentinel?.release()}catch{}wakeLockSentinel=null}

window.__LQ_TEST__={state,BUILTIN_SONGS,REFERENCE_SONGS,openScreen,openSongDetail,startPlayer,seekTo,runDiagnostics,parseChordPro,parseTextTab,parseMusicXML,parseLucaJSON,parseMidiFile,finishAttempt,detectPitchYIN,runPitchSelfTest,startMic,stopMic,isStandaloneMode,updateInstallUI,requestWakeLock,releaseWakeLock,openExternalUrl,updateNetworkUI,checkOfflineReadiness};

init().catch(err=>{console.error(err);document.body.insertAdjacentHTML('afterbegin',`<div style="background:#7b1f2d;color:white;padding:1rem">Startfehler: ${escapeHTML(err.message)}</div>`)})
