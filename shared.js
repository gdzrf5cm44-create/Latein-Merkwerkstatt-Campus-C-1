'use strict';
window.Workshop=(()=>{
 const centralKey='lernwerkstatt-profiles-v1',chapterKeys=['grammarworkshop-v1','latin56-v1'];
 const catalog=[{id:'latinVocab',subject:'latein',title:'Vokabeln',topics:'Feste Doppelpacks: 1 & 2 · 3 & 4 · 5 & 6',path:'latein/#vokabeln',key:'latin56-v1',section:'vocab'},{id:'latinGrammar',subject:'latein',title:'Grammatik',topics:'Formen und Regeln in drei Doppelpacks',path:'latein/#grammatik',key:'latin56-v1',section:'grammar'},{id:'latinAdverbs',subject:'latein',title:'Adverbien & kleine Wörter',topics:'Bildszenen · Merksätze · eigener Abruf',path:'latein/#adverbien',key:'latin56-v1',section:'adverbs'},{id:'englishfuture',subject:'englisch',title:'Going-to future & question tags',topics:'Satzbau · Bestätigungsfragen',path:'englisch/',key:'grammarworkshop-v1'}];
 const parse=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
 const put=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
 const defaults=key=>key==='latin56-v1'?{stats:{},notes:{},seen:[],history:[]}:{stats:{},started:false,history:[]};
 let hub=parse(centralKey,{profiles:[],active:null,migrated:{},last:{}});hub.migrated||={};hub.last||={};
 const canonical=name=>String(name).trim().toLowerCase();
 function register(name,id){let match=hub.profiles.find(p=>p.id===id);if(!match){match={id:id||('p'+Date.now()+'-'+Math.random().toString(36).slice(2)),name:name.trim()};hub.profiles.push(match)}return match}
 for(const key of chapterKeys){if(hub.migrated[key])continue;let old=parse(key,{profiles:[],active:null}),mapping={};let counts={};for(const p of old.profiles)counts[canonical(p.name)]=(counts[canonical(p.name)]||0)+1;for(const p of old.profiles){let candidates=hub.profiles.filter(x=>canonical(x.name)===canonical(p.name));let target=counts[canonical(p.name)]===1&&candidates.length===1?candidates[0]:register(p.name,p.id);mapping[p.id]=target.id;p.id=target.id;p.name=target.name}old.active=mapping[old.active]||old.active;if(!hub.active&&old.active)hub.active=old.active;if(old.profiles.length)put(key,old);hub.migrated[key]=true}
 if(!hub.migrated.legacy){let old=parse('merkwerkstatt',{});if(Object.keys(old).some(k=>k.startsWith('w:'))){let name=localStorage.getItem('merkname')||'Mein Lateinprofil',matches=hub.profiles.filter(p=>canonical(p.name)===canonical(name)),profile=matches.length===1?matches[0]:register(name);put('lernwerkstatt-legacy-'+profile.id,old);if(!hub.active)hub.active=profile.id}hub.migrated.legacy=true}
 put(centralKey,hub);
 function refresh(){hub=parse(centralKey,hub);return hub}
 function active(){refresh();return hub.profiles.find(p=>p.id===hub.active)}
 function profiles(){refresh();return hub.profiles}
 function select(id){refresh();if(hub.profiles.some(p=>p.id===id)){hub.active=id;put(centralKey,hub)}}
 function create(name){refresh();const p=register(name);hub.active=p.id;put(centralKey,hub);return p}
 function readChapter(key){refresh();let state=parse(key,{profiles:[],active:null});state.profiles=hub.profiles.map(p=>{let old=state.profiles.find(x=>x.id===p.id);return {...defaults(key),...old,id:p.id,name:p.name}});state.active=hub.active;return state}
 function saveChapter(key,state){refresh();for(const p of state.profiles)register(p.name,p.id);hub.active=state.active;put(centralKey,hub);let stored=parse(key,{profiles:[]});let merged={...state,profiles:state.profiles.map(p=>p.id===state.active?p:(stored.profiles.find(x=>x.id===p.id)||p))};const ok=put(key,merged);updateName();return ok}
 function legacy(){return parse('lernwerkstatt-legacy-'+(active()?.id||'guest'),{})}
 function saveLegacy(s){return put('lernwerkstatt-legacy-'+(active()?.id||'guest'),s)}
 function visit(id){let p=active();if(!p)return;hub.last[p.id]={id,time:Date.now()};put(centralKey,hub)}
 function last(){let p=active();return p?catalog.find(c=>c.id===({'latin13':'latinVocab','latin56':'latinVocab'}[hub.last[p.id]?.id]||hub.last[p.id]?.id)):null}
 function summary(chapter){if(chapter.section==='adverbs')return 'Merken · auswählen · selbst abrufen';let p=active();if(!p)return '';if(chapter.key==='legacy'){let values=Object.entries(legacy()).filter(([k])=>k.startsWith('w:')).map(([,v])=>v);return values.length?values.filter(v=>v>=3).length+' Wörter als bekannt markiert':'Bereit zum Lernen'}let data=readChapter(chapter.key).profiles.find(x=>x.id===p.id),stats=Object.entries(data.stats||{}).filter(([id])=>!chapter.section||(chapter.section==='grammar'?/^[fg]/.test(id):/^[wl]/.test(id))).map(([,v])=>v);if(!stats.length)return 'Bereit zum Lernen';let safe=stats.filter(s=>(s.ok??s.wins??0)>=2).length;return safe+' Aufgaben mehrfach abgerufen'}
 function updateName(){let el=document.querySelector('#wl-name');if(el)el.textContent=active()?.name||'Profil wählen'}
 function nav(actions){for(const button of document.querySelectorAll('[data-wl-nav]')){button.onclick=()=>{for(const b of document.querySelectorAll('[data-wl-nav]'))b.classList.toggle('active',b===button);actions[button.dataset.wlNav]?.();if(button.dataset.wlNav!=='tests')window.scrollTo({top:0,behavior:'auto'})}}updateName()}
 function share(button){let url=new URL(location.href);url.search='';url.hash='';return (navigator.share?navigator.share({title:'Lernwerkstatt',url:url.href}):navigator.clipboard.writeText(url.href).then(()=>button.textContent='Link kopiert')).catch(e=>{if(e.name!=='AbortError'){let input=document.createElement('input');input.value=url.href;input.readOnly=true;button.after(input);input.select()}})}
 return {catalog,active,profiles,select,create,readChapter,saveChapter,legacy,saveLegacy,visit,last,summary,nav,updateName,share};
})();
