// ══ CONSTANTS ══
const EMOJI_OPTIONS=["💼","📚","🎨","✡️","🎯","💡","🏋️","❤️","💰","🌍","🎵","🔬","✈️","🏠","🤝","⭐","🔥","💎","🧠","📝","🗓","🎓","🏆","🌱","🌊","🦁","🐉","🌸","🍀","🎭","🚀","⚡","🕍","📖","🙏","🌟","🎶","💪","🔑","🎪","🧩","🎲","🏄","🌺","🦅","🌈","🔮","🧘","🏗","🎬","📷","🍎","☕","🎸","🛡","🌙","🌞","🗺","🎁","🧲"];
const COLOR_OPTIONS=["#E8A838","#9B6FE8","#E87C3E","#4CAF7D","#E85D75","#5DA8E8","#F06292","#26C6DA","#AB47BC","#66BB6A","#FF7043","#78909C","#D4AC0D","#1ABC9C","#E74C3C","#3498DB","#9B59B6","#F39C12","#2ECC71","#E67E22"];
const DEFAULT_CATS=[{id:"work",label:"עבודה / קריירה",emoji:"💼",color:"#E8A838"},{id:"learning",label:"לימודים",emoji:"📚",color:"#9B6FE8"},{id:"creative",label:"פרויקטים יצירתיים",emoji:"🎨",color:"#E87C3E"},{id:"torah",label:"לימוד תורה",emoji:"✡️",color:"#4CAF7D"},{id:"goals",label:"מטרות שונות",emoji:"🎯",color:"#E85D75"}];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const today=()=>new Date().toLocaleDateString("he-IL");

// ══ THEMES ══
const THEMES={
  purple:{name:"סגול",bg:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)",card:"rgba(255,255,255,0.07)",accent:"#9B6FE8"},
  dark:{name:"שחור",bg:"linear-gradient(160deg,#0a0a0a,#1a1a2e,#16213e)",card:"rgba(255,255,255,0.06)",accent:"#5DA8E8"},
  green:{name:"ירוק",bg:"linear-gradient(160deg,#0a1f0a,#1a3a1a,#0d2b0d)",card:"rgba(255,255,255,0.07)",accent:"#4CAF7D"},
  navy:{name:"כחול",bg:"linear-gradient(160deg,#020b18,#0a2540,#0d3b6e)",card:"rgba(255,255,255,0.07)",accent:"#5DA8E8"},
  midnight:{name:"לילה",bg:"linear-gradient(160deg,#1a0533,#2d0b5a,#1a0533)",card:"rgba(255,255,255,0.07)",accent:"#c084fc"},
  warm:{name:"חם",bg:"linear-gradient(160deg,#1a0a00,#3d1a00,#2a1200)",card:"rgba(255,255,255,0.07)",accent:"#E8A838"},
};

// ══ STATE ══
function load(key,def){try{const v=localStorage.getItem(key);return v!=null?JSON.parse(v):def;}catch{return def;}}
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch{}}

let S={
  cats:load("cats",DEFAULT_CATS),
  catsTrash:load("catsTrash",[]),
  data:load("data",(()=>{const d={};DEFAULT_CATS.forEach(c=>{d[c.id]={goals:[]}});return d;})()),
  goalsTrash:load("goalsTrash",[]),
  torahBooks:load("torahBooks",[]),
  torahTrash:load("torahTrash",[]),
  npFolders:load("npFolders",[{id:"default",name:"כללי"}]),
  npNotes:load("npNotes",[]),
  npTrash:load("npTrash",[]),
  // FIX: Images stored with compression to survive page reload
  bookImages:load("bookImages",{}),
  homeOrder:load("homeOrder",["notepad","torah","goals-grid"]),
  appTitle:load("appTitle","לוח המטרות שלי"),
  torahSectionTitle:load("torahSectionTitle","התקדמות בלימוד התורה"),
  theme:load("theme","purple"),
  fontSize:load("fontSize","medium"),
  compactMode:load("compactMode",false),
  // UI state
  view:"home",activeCat:null,activeGoalId:null,activeFolderId:"default",
  fullNote:null,reorderMode:false,editingTitle:false,titleDraft:"",
  editingTorahTitle:false,
  folderMenuOpen:false,npMenuOpen:false,showSearch:false,searchQuery:"",sortMode:"date",
  addingFolder:false,newFolderName:"",editFolderId:null,editFolderName:"",
  addingNpNote:false,npNoteText:"",editNpNoteId:null,moveNoteId:null,shareNoteId:null,
  newGoal:"",addingGoal:false,editGoalId:null,editGoalText:"",
  newNote:"",addingNote:false,noteExp:{},
  showCatForm:false,editCatId:null,catForm:{label:"",emoji:"🎯",color:"#E85D75"},
  addingBook:false,bookForm:{name:"",chapter:"",page:"",lastText:""},editBookId:null,
  pendingPhotoBookId:null,viewingImg:null,
  showSettings:false,showBackupModal:false,
};

function setState(patch){Object.assign(S,patch);persist();render();}

function persist(){
  save("cats",S.cats);save("catsTrash",S.catsTrash);save("data",S.data);
  save("goalsTrash",S.goalsTrash);save("torahBooks",S.torahBooks);save("torahTrash",S.torahTrash);
  save("npFolders",S.npFolders);save("npNotes",S.npNotes);save("npTrash",S.npTrash);
  save("bookImages",S.bookImages);save("homeOrder",S.homeOrder);save("appTitle",S.appTitle);
  save("torahSectionTitle",S.torahSectionTitle);
  save("theme",S.theme);save("fontSize",S.fontSize);save("compactMode",S.compactMode);
}

function applyTheme(){
  const t=THEMES[S.theme]||THEMES.purple;
  document.getElementById("bg-layer").style.background=t.bg;
  const shell=document.getElementById("shell");
  if(shell){shell.style.background="rgba(255,255,255,0.04)";}
  // font size
  const sizes={small:"13px",medium:"15px",large:"17px"};
  document.body.style.fontSize=sizes[S.fontSize]||"15px";
}

// ══ HELPERS ══

// FIX 3: Hebrew-safe download — use BOM + UTF-8 encoding
function downloadTXT(content, filename){
  // Add UTF-8 BOM so Windows Notepad shows Hebrew correctly
  const bom="\uFEFF";
  const blob=new Blob([bom+content],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

// FIX 2: Compress image before saving to localStorage (resize to max 800px, quality 0.7)
function compressImage(dataUrl, callback){
  const img=new Image();
  img.onload=()=>{
    const MAX=800;
    let w=img.width, h=img.height;
    if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r);}
    const canvas=document.createElement("canvas");
    canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext("2d");
    ctx.drawImage(img,0,0,w,h);
    callback(canvas.toDataURL("image/jpeg",0.7));
  };
  img.src=dataUrl;
}

function shareWA(text){window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");}
function shareEmail(subject,body){window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,"_blank");}

function exportGoalsTXT(){
  let t=S.appTitle+"\n"+"=".repeat(30)+"\n\n";
  S.cats.forEach(c=>{
    t+=`${c.emoji} ${c.label}\n${"─".repeat(25)}\n`;
    const gs=S.data[c.id]?.goals||[];
    if(!gs.length)t+="  (אין מטרות)\n";
    gs.forEach((g,gi)=>{t+=`  ${gi+1}. ${g.title}\n`;g.notes.forEach((n,ni)=>{t+=`     #${ni+1} ${n.done?"[✓]":"[ ]"} ${n.text}\n`;});});
    t+="\n";
  });
  return t;
}
function exportTorahTXT(){
  let t=S.torahSectionTitle+"\n"+"=".repeat(30)+"\n\n";
  S.torahBooks.forEach((b,i)=>{
    t+=`${i+1}. ${b.name}\n   פרק: ${b.chapter||"—"}  |  עמוד: ${b.page||"—"}\n`;
    if(b.lastText)t+=`   עצרתי ב: "${b.lastText}"\n`;
    t+="\n";
  });
  return t;
}
function exportNpTXT(){
  let t="📓 NOTEPAD\n"+"=".repeat(30)+"\n\n";
  S.npFolders.forEach(f=>{
    t+=`📁 ${f.name}\n${"─".repeat(20)}\n`;
    const fn=S.npNotes.filter(n=>n.folderId===f.id);
    if(!fn.length)t+="  (אין פתקים)\n";
    fn.forEach(n=>{t+=`  ${n.star?"⭐ ":""}[${n.date}]\n  ${n.text}\n\n`;});
  });
  return t;
}

// ══ BACKUP & RESTORE ══
function createBackup(){
  const backup={
    version:2,
    date:today(),
    appTitle:S.appTitle,
    torahSectionTitle:S.torahSectionTitle,
    cats:S.cats,
    catsTrash:S.catsTrash,
    data:S.data,
    goalsTrash:S.goalsTrash,
    torahBooks:S.torahBooks,
    torahTrash:S.torahTrash,
    npFolders:S.npFolders,
    npNotes:S.npNotes,
    npTrash:S.npTrash,
    bookImages:S.bookImages,
    homeOrder:S.homeOrder,
    theme:S.theme,
    fontSize:S.fontSize,
    compactMode:S.compactMode,
  };
  // FIX: Use Blob with explicit UTF-8 encoding for JSON too
  const json=JSON.stringify(backup,null,2);
  const blob=new Blob([json],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  const d=new Date();
  const dateStr=`${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
  a.download=`גיבוי-אפליקציה-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restoreFromBackup(json){
  try{
    const b=JSON.parse(json);
    if(!b.version||!b.cats)throw new Error("קובץ גיבוי לא תקין");
    if(S.cats)S.cats=b.cats||S.cats;
    S.cats=b.cats||DEFAULT_CATS;
    S.catsTrash=b.catsTrash||[];
    S.data=b.data||(()=>{const d={};DEFAULT_CATS.forEach(c=>{d[c.id]={goals:[]}});return d;})();
    S.goalsTrash=b.goalsTrash||[];
    S.torahBooks=b.torahBooks||[];
    S.torahTrash=b.torahTrash||[];
    S.npFolders=b.npFolders||[{id:"default",name:"כללי"}];
    S.npNotes=b.npNotes||[];
    S.npTrash=b.npTrash||[];
    S.bookImages=b.bookImages||{};
    S.homeOrder=b.homeOrder||["notepad","torah","goals-grid"];
    S.appTitle=b.appTitle||"לוח המטרות שלי";
    S.torahSectionTitle=b.torahSectionTitle||"התקדמות בלימוד התורה";
    if(b.theme)S.theme=b.theme;
    if(b.fontSize)S.fontSize=b.fontSize;
    if(b.compactMode!==undefined)S.compactMode=b.compactMode;
    setState({view:"home",showBackupModal:false});
    alert("✅ הגיבוי שוחזר בהצלחה! "+b.date);
  }catch(e){
    alert("❌ שגיאה בטעינת הגיבוי: "+e.message);
  }
}

function richHTML(text,clampClass){
  const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let html="";
  text.split(/(==.+?==)|(https?:\/\/[^\s]+)/g).forEach(part=>{
    if(!part)return;
    if(part.startsWith("==")&&part.endsWith("==")){html+=`<mark>${esc(part.slice(2,-2))}</mark>`;}
    else if(/^https?:\/\//.test(part)){html+=`<a href="${esc(part)}" target="_blank" class="rich-link" onclick="event.stopPropagation()">${esc(part)}</a>`;}
    else{html+=esc(part);}
  });
  return `<div class="${clampClass||""}" style="font-size:14px;line-height:1.7;white-space:pre-wrap">${html}</div>`;
}

function getFolderNotes(){
  let ns=S.npNotes.filter(n=>n.folderId===S.activeFolderId);
  if(S.searchQuery)ns=ns.filter(n=>n.text.toLowerCase().includes(S.searchQuery.toLowerCase()));
  if(S.sortMode==="star")ns=[...ns].sort((a,b)=>(b.star?1:0)-(a.star?1:0));
  else if(S.sortMode==="az")ns=[...ns].sort((a,b)=>a.text.localeCompare(b.text,"he"));
  else ns=[...ns].sort((a,b)=>{if(b.star!==a.star)return(b.star?1:0)-(a.star?1:0);return b.id>a.id?1:-1;});
  return ns;
}

// ══ LOGIC ══
function resetForms(){Object.assign(S,{addingGoal:false,editGoalId:null,addingNote:false,addingBook:false,showCatForm:false,editCatId:null,addingNpNote:false,addingFolder:false,editNpNoteId:null,folderMenuOpen:false,npMenuOpen:false,showSearch:false,searchQuery:"",shareNoteId:null,moveNoteId:null,reorderMode:false,editingTorahTitle:false});}
function goBack(){
  resetForms();
  if(S.showSettings){setState({showSettings:false});return;}
  if(S.fullNote){setState({fullNote:null});return;}
  const nav={
    "goal-detail":()=>setState({view:"goals",activeGoalId:null}),
    "goals-trash":()=>setState({view:"goals"}),
    "goals":()=>setState({view:"home",activeCat:null}),
    "cat-trash":()=>setState({view:"manage-cats"}),
    "manage-cats":()=>setState({view:"home"}),
    "torah-trash":()=>setState({view:"torah-progress"}),
    "torah-progress":()=>setState({view:"home"}),
    "np-trash":()=>setState({view:"notepad"}),
    "notepad":()=>setState({view:"home"}),
  };
  if(nav[S.view])nav[S.view]();
}

// Cat
function saveCat(){if(!S.catForm.label.trim())return;if(S.editCatId){S.cats=S.cats.map(c=>c.id===S.editCatId?{...c,...S.catForm}:c);S.editCatId=null;}else{const id=uid();S.cats=[...S.cats,{id,...S.catForm}];S.data={...S.data,[id]:{goals:[]}};}S.catForm={label:"",emoji:"🎯",color:"#E85D75"};S.showCatForm=false;setState({});}
function deleteCat(id){const cat=S.cats.find(c=>c.id===id);const gs=S.data[id]?.goals||[];S.catsTrash=[...S.catsTrash,{...cat,goals:gs,deletedAt:today()}];S.cats=S.cats.filter(c=>c.id!==id);delete S.data[id];setState({});}
function restoreCat(id){const it=S.catsTrash.find(c=>c.id===id);if(!it)return;const{deletedAt,goals,...cat}=it;S.cats=[...S.cats,cat];S.data={...S.data,[cat.id]:{goals}};S.catsTrash=S.catsTrash.filter(c=>c.id!==id);setState({});}

// Goals
function addGoal(){if(!S.newGoal.trim())return;S.data[S.activeCat].goals=[...S.data[S.activeCat].goals,{id:uid(),title:S.newGoal.trim(),notes:[]}];setState({newGoal:"",addingGoal:false});}
function saveEditGoal(){if(!S.editGoalText.trim())return;S.data[S.activeCat].goals.find(g=>g.id===S.editGoalId).title=S.editGoalText.trim();setState({editGoalId:null,editGoalText:""});}
function deleteGoal(id){const g=S.data[S.activeCat].goals.find(g=>g.id===id);if(g)S.goalsTrash=[...S.goalsTrash,{...g,deletedAt:today(),catId:S.activeCat}];S.data[S.activeCat].goals=S.data[S.activeCat].goals.filter(g=>g.id!==id);setState({});}
function restoreGoal(id){const g=S.goalsTrash.find(g=>g.id===id);if(g){const{deletedAt,catId,...r}=g;if(!S.data[catId])S.data[catId]={goals:[]};S.data[catId].goals=[...S.data[catId].goals,r];}S.goalsTrash=S.goalsTrash.filter(g=>g.id!==id);setState({});}
function addGoalNote(){if(!S.newNote.trim())return;S.data[S.activeCat].goals.find(g=>g.id===S.activeGoalId).notes.push({id:uid(),text:S.newNote.trim(),done:false});setState({newNote:"",addingNote:false});}
function toggleGoalNote(nid){const g=S.data[S.activeCat].goals.find(g=>g.id===S.activeGoalId);const n=g.notes.find(n=>n.id===nid);n.done=!n.done;setState({});}
function deleteGoalNote(nid){const g=S.data[S.activeCat].goals.find(g=>g.id===S.activeGoalId);g.notes=g.notes.filter(n=>n.id!==nid);setState({});}

// Torah
function saveBook(){if(!S.bookForm.name.trim())return;if(S.editBookId){S.torahBooks=S.torahBooks.map(b=>b.id===S.editBookId?{...b,...S.bookForm}:b);S.editBookId=null;}else{S.torahBooks=[...S.torahBooks,{id:uid(),...S.bookForm}];}S.bookForm={name:"",chapter:"",page:"",lastText:""};setState({addingBook:false});}
function deleteBook(id){const b=S.torahBooks.find(b=>b.id===id);if(b)S.torahTrash=[...S.torahTrash,{...b,deletedAt:today()}];S.torahBooks=S.torahBooks.filter(b=>b.id!==id);setState({});}
function restoreBook(id){const b=S.torahTrash.find(b=>b.id===id);if(b){const{deletedAt,...r}=b;S.torahBooks=[...S.torahBooks,r];}S.torahTrash=S.torahTrash.filter(b=>b.id!==id);setState({});}
function saveTorahTitle(){const v=document.getElementById("torahTitleInp")?.value?.trim();if(v)S.torahSectionTitle=v;setState({editingTorahTitle:false});}

// Notepad
function addFolder(){if(!S.newFolderName.trim())return;S.npFolders=[...S.npFolders,{id:uid(),name:S.newFolderName.trim()}];setState({newFolderName:"",addingFolder:false});}
function saveRenameFolder(){if(!S.editFolderName.trim())return;S.npFolders=S.npFolders.map(f=>f.id===S.editFolderId?{...f,name:S.editFolderName.trim()}:f);setState({editFolderId:null,editFolderName:""});}
function deleteFolder(id){if(id==="default")return;S.npFolders=S.npFolders.filter(f=>f.id!==id);S.npNotes=S.npNotes.map(n=>n.folderId===id?{...n,folderId:"default"}:n);if(S.activeFolderId===id)S.activeFolderId="default";setState({});}
function saveNpNote(){if(!S.npNoteText.trim())return;if(S.editNpNoteId){S.npNotes=S.npNotes.map(n=>n.id===S.editNpNoteId?{...n,text:S.npNoteText.trim()}:n);S.editNpNoteId=null;}else{S.npNotes=[...S.npNotes,{id:uid(),folderId:S.activeFolderId,text:S.npNoteText.trim(),date:today(),star:false}];}setState({npNoteText:"",addingNpNote:false});}
function toggleStar(id){S.npNotes=S.npNotes.map(n=>n.id===id?{...n,star:!n.star}:n);setState({});}
function deleteNpNote(id){const n=S.npNotes.find(n=>n.id===id);if(n)S.npTrash=[...S.npTrash,{...n,deletedAt:today()}];S.npNotes=S.npNotes.filter(n=>n.id!==id);setState({});}
function restoreNote(id){const n=S.npTrash.find(n=>n.id===id);if(n){const{deletedAt,...r}=n;S.npNotes=[...S.npNotes,r];}S.npTrash=S.npTrash.filter(n=>n.id!==id);setState({});}
function permanentDelete(id){S.npTrash=S.npTrash.filter(n=>n.id!==id);setState({});}
function moveNote(nid,fid){S.npNotes=S.npNotes.map(n=>n.id===nid?{...n,folderId:fid}:n);setState({moveNoteId:null});}
function duplicateNote(id){const n=S.npNotes.find(n=>n.id===id);if(n)S.npNotes=[...S.npNotes,{...n,id:uid(),date:today(),star:false}];setState({});}

// ══ HTML BUILDERS ══
function hb(label,onclick,style=""){return `<button class="hb" onclick="${onclick}" style="${style}">${label}</button>`;}
function ib(label,onclick,bg="rgba(255,255,255,0.1)",style=""){return `<button class="ib" onclick="${onclick}" style="background:${bg};${style}">${label}</button>`;}
function btn(label,onclick,color,flex=""){return `<button class="btn" onclick="${onclick}" style="background:${color||"rgba(255,255,255,0.12)"};${flex?"flex:1;":""}">${label}</button>`;}
function card(inner,border="",bg="rgba(255,255,255,0.07)"){return `<div class="card" style="border:${border||"1px solid rgba(255,255,255,0.1)"};background:${bg}">${inner}</div>`;}
function tag(text,color){return `<span class="tag" style="background:${color}30;color:${color}">${text}</span>`;}
function inp(id,placeholder,val="",type="text",extra=""){return `<input id="${id}" class="inp" type="${type}" placeholder="${placeholder}" value="${val}" ${extra}/>`;}
function textarea(id,placeholder,val="",rows=4){const safe=(val||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");return `<textarea id="${id}" class="inp" rows="${rows}" placeholder="${placeholder}">${safe}</textarea>`;}

function trashSection(items,emptyFn,renderItem){
  if(!items.length)return`<div class="empty-state"><div class="icon">🗑</div>סל ריק</div>`;
  let h=`<div class="row" style="margin-bottom:12px"><span style="font-size:12px;color:rgba(255,255,255,0.4)">${items.length} פריטים</span><button class="ib" onclick="${emptyFn}" style="background:rgba(255,80,80,0.2);color:#ff9090;font-size:12px">רוקן סל 🗑</button></div>`;
  [...items].reverse().forEach(it=>{h+=renderItem(it);});
  return h;
}

function buildHeader(){
  const cur=S.cats.find(c=>c.id===S.activeCat);
  const curGoal=S.activeGoalId&&S.activeCat?S.data[S.activeCat]?.goals.find(g=>g.id===S.activeGoalId):null;
  const curFolder=S.npFolders.find(f=>f.id===S.activeFolderId);

  let title="";
  if(S.showSettings)title="⚙️ הגדרות";
  else if(S.fullNote)title="📄 צפייה";
  else{
    const map={
      home:`🗂 ${S.appTitle}`,
      "manage-cats":"⚙️ קטגוריות",
      "cat-trash":"🗑 סל קטגוריות",
      goals:`${cur?.emoji||""} ${cur?.label||""}`,
      "goal-detail":`📝 ${curGoal?.title||""}`,
      "goals-trash":"🗑 סל מטרות",
      "torah-progress":S.torahSectionTitle,
      "torah-trash":"🗑 סל ספרים",
      notepad:`📁 ${curFolder?.name||"כללי"}`,
      "np-trash":"🗑 סל פתקים",
    };
    title=map[S.view]||"";
  }

  let back=(S.view!=="home"||S.fullNote||S.showSettings)?`<button class="hb" onclick="goBack()" style="font-size:16px;padding:4px 11px">←</button>`:"";

  // FIX 1: Torah title editable inline
  let titleEl="";
  if(S.view==="home"&&S.editingTitle){
    titleEl=`<input id="titleInp" class="inp" value="${S.appTitle.replace(/"/g,'&quot;')}" style="flex:1;font-size:15px;font-weight:700;padding:4px 10px" onblur="finishTitle()" onkeydown="if(event.key==='Enter')finishTitle()"/>`;
  } else if(S.view==="torah-progress"&&S.editingTorahTitle){
    titleEl=`<input id="torahTitleInp" class="inp" value="${S.torahSectionTitle.replace(/"/g,'&quot;')}" style="flex:1;font-size:15px;font-weight:700;padding:4px 10px" onblur="saveTorahTitle()" onkeydown="if(event.key==='Enter')saveTorahTitle()"/>`;
  } else {
    const clickable=S.view==="home"||S.view==="torah-progress";
    const clickFn=S.view==="home"?"startEditTitle()":S.view==="torah-progress"?"setState({editingTorahTitle:true})":"";
    titleEl=`<div class="hdr-title" onclick="${clickFn}" ${clickable?'title="לחץ לעריכת הכותרת"':""}>${title}${clickable?" <span style='font-size:11px;opacity:0.35'>✎</span>":""}</div>`;
  }

  let actions="";
  if(!S.showSettings&&!S.fullNote){
    if(S.view==="home"&&!S.editingTitle){
      actions+=`${hb(S.reorderMode?"✓ סיום":"↕ סדר","toggleReorder()",S.reorderMode?"background:rgba(255,200,0,0.25);color:#FFD700;font-weight:700":"")}`;
      actions+=`${hb("⚙️","setState({view:'manage-cats'})")}`;
      actions+=`${hb("☰","setState({showSettings:true})")}`;
    }
    if(S.view==="manage-cats"){const cnt=S.catsTrash.length;actions+=`<button class="hb" onclick="setState({view:'cat-trash'})" style="background:${cnt?"rgba(255,80,80,0.22)":"rgba(255,255,255,0.08)"};color:${cnt?"#ff9090":"rgba(255,255,255,0.45)"}">🗑${cnt?" "+cnt:""}</button>`;}
    if(S.view==="goals"){const cnt=S.goalsTrash.filter(g=>g.catId===S.activeCat).length;actions+=`${hb("⬇","downloadTXT(exportGoalsTXT(),'מטרות.txt')")}<button class="hb" onclick="setState({view:'goals-trash'})" style="background:${cnt?"rgba(255,80,80,0.22)":"rgba(255,255,255,0.08)"};color:${cnt?"#ff9090":"rgba(255,255,255,0.45)"}">🗑${cnt?" "+cnt:""}</button>`;}
    if(S.view==="goal-detail"&&curGoal){
      const wtxt=encodeURIComponent(curGoal.title+"\n"+curGoal.notes.map((n,i)=>`${i+1}. ${n.text}`).join("\n"));
      actions+=`<button class="hb" onclick="shareWA(decodeURIComponent('${wtxt}'))" style="color:#25D366;background:rgba(37,211,102,0.12)">📱</button>`;
    }
    if(S.view==="torah-progress"){
      const cnt=S.torahTrash.length;
      actions+=`${hb("⬇","downloadTXT(exportTorahTXT(),'לימוד-תורה.txt')")}`;
      actions+=`<button class="hb" onclick="setState({view:'torah-trash'})" style="background:${cnt?"rgba(255,80,80,0.22)":"rgba(255,255,255,0.08)"};color:${cnt?"#ff9090":"rgba(255,255,255,0.45)"}">🗑${cnt?" "+cnt:""}</button>`;
    }
    if(S.view==="notepad"){
      actions+=`${hb("🔍","toggleSearch()",S.showSearch?"color:#FFD700":"")}`;
      actions+=`${hb("📁▾","toggleFolderMenu()",S.folderMenuOpen?"color:#5DA8E8":"")}`;
      actions+=`${hb("⋯","toggleNpMenu()",S.npMenuOpen?"color:#9B6FE8":"")}`;
    }
  }

  return `<div class="hdr">${back}${titleEl}${actions}</div>`;
}

function buildFooter(){
  const items=[["home","🏠"],["notepad","📓"],["torah-progress","📖"],...S.cats.map(c=>[c.id+"_g",c.emoji])].slice(0,8);
  return`<div class="footer">${items.map(([v,e])=>{
    const active=v==="home"?S.view==="home":v==="notepad"?(S.view==="notepad"||S.view==="np-trash"):v==="torah-progress"?(S.view==="torah-progress"||S.view==="torah-trash"):S.activeCat===v.replace("_g","")&&["goals","goal-detail","goals-trash"].includes(S.view);
    const nav=v==="home"?"navHome()":v==="notepad"?"navNotepad()":v==="torah-progress"?"navTorah()":"navCat('"+v.replace("_g","")+"')";
    return`<button onclick="${nav}" style="opacity:${active?1:0.35};transform:${active?"scale(1.2)":"scale(1)"};transition:all 0.15s;background:none;border:none;cursor:pointer;font-size:18px">${e}</button>`;
  }).join("")}</div>`;
}

function navHome(){resetForms();setState({view:"home",activeCat:null,fullNote:null,showSettings:false});}
function navNotepad(){resetForms();setState({view:"notepad",activeFolderId:"default",fullNote:null,showSettings:false});}
function navTorah(){resetForms();setState({view:"torah-progress",fullNote:null,showSettings:false});}
function navCat(id){resetForms();setState({view:"goals",activeCat:id,fullNote:null,showSettings:false});}
function toggleReorder(){setState({reorderMode:!S.reorderMode});}
function startEditTitle(){setState({editingTitle:true,titleDraft:S.appTitle});}
function finishTitle(){const v=document.getElementById("titleInp")?.value||S.appTitle;setState({appTitle:v||S.appTitle,editingTitle:false});}
function toggleSearch(){setState({showSearch:!S.showSearch,searchQuery:""});}
function toggleFolderMenu(){setState({folderMenuOpen:!S.folderMenuOpen,npMenuOpen:false});}
function toggleNpMenu(){setState({npMenuOpen:!S.npMenuOpen,folderMenuOpen:false});}

// ══ SETTINGS PAGE ══
function buildSettings(){
  const t=THEMES[S.theme]||THEMES.purple;
  const accent=t.accent;
  let h=``;

  // Appearance
  h+=`<div class="settings-section">
    <h4>🎨 ערכת צבעים</h4>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px">`;
  Object.entries(THEMES).forEach(([key,th])=>{
    const isActive=S.theme===key;
    const mid=th.bg.match(/#[0-9a-f]{6}/gi)?.[1]||"#333";
    h+=`<div style="text-align:center;cursor:pointer" onclick="setTheme('${key}')">
      <div class="theme-btn ${isActive?"active":""}" style="background:${th.bg};box-shadow:${isActive?"0 0 0 3px #fff":"none"}"></div>
      <div style="font-size:10px;color:rgba(255,255,255,${isActive?1:0.5});margin-top:4px">${th.name}</div>
    </div>`;
  });
  h+=`</div></div>`;

  // Font size
  h+=`<div class="settings-section">
    <h4>✏️ גודל טקסט</h4>
    <div style="display:flex;gap:8px">
      ${["small","medium","large"].map(f=>`<button class="font-btn ${S.fontSize===f?"active":""}" onclick="setFontSize('${f}')">${f==="small"?"קטן":f==="medium"?"רגיל":"גדול"}</button>`).join("")}
    </div>
  </div>`;

  // Compact mode
  h+=`<div class="settings-section">
    <h4>📱 נראות</h4>
    <div class="toggle-row">
      <div>
        <div style="font-size:14px;font-weight:600">מצב קומפקטי</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px">כרטיסים קצרים יותר</div>
      </div>
      <button class="toggle" onclick="setState({compactMode:!S.compactMode})" style="background:${S.compactMode?accent:"rgba(255,255,255,0.15)"}"><span style="position:absolute;width:20px;height:20px;border-radius:50%;background:#fff;top:2px;left:${S.compactMode?"22px":"2px"};transition:left 0.2s;display:block"></span></button>
    </div>
  </div>`;

  // Backup & Restore
  h+=`<div class="settings-section">
    <h4>💾 גיבוי ושחזור</h4>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button onclick="createBackup()" style="width:100%;background:rgba(76,175,125,0.2);border:1px solid rgba(76,175,125,0.4);border-radius:12px;color:#4CAF7D;padding:13px;font-size:14px;font-weight:600;cursor:pointer;text-align:right">
        💾 צור קובץ גיבוי (JSON)
        <div style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.5);margin-top:3px">מוריד את כל הנתונים לקובץ</div>
      </button>
      <button onclick="document.getElementById('backupInput').click()" style="width:100%;background:rgba(93,168,232,0.2);border:1px solid rgba(93,168,232,0.4);border-radius:12px;color:#5DA8E8;padding:13px;font-size:14px;font-weight:600;cursor:pointer;text-align:right">
        📂 שחזר מקובץ גיבוי
        <div style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.5);margin-top:3px">טען קובץ JSON לשחזור הכל</div>
      </button>
    </div>
  </div>`;

  // Data export
  h+=`<div class="settings-section">
    <h4>📤 ייצוא נתונים</h4>
    <div style="display:flex;flex-direction:column;gap:7px">
      <button onclick="downloadTXT(exportGoalsTXT(),'מטרות.txt')" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;padding:11px 14px;font-size:13px;cursor:pointer;text-align:right">📋 ייצוא מטרות TXT</button>
      <button onclick="downloadTXT(exportTorahTXT(),'לימוד-תורה.txt')" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;padding:11px 14px;font-size:13px;cursor:pointer;text-align:right">📖 ייצוא לימוד תורה TXT</button>
      <button onclick="downloadTXT(exportNpTXT(),'פתקים.txt')" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;padding:11px 14px;font-size:13px;cursor:pointer;text-align:right">📓 ייצוא פתקים TXT</button>
    </div>
  </div>`;

  // Reset
  h+=`<div class="settings-section">
    <h4>⚠️ אזור מתקדם</h4>
    <button onclick="if(confirm('האם אתה בטוח? כל הנתונים ימחקו!')){localStorage.clear();location.reload();}" style="width:100%;background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);border-radius:10px;color:#ff9090;padding:11px 14px;font-size:13px;cursor:pointer;text-align:right">🗑 איפוס מלא של האפליקציה</button>
  </div>`;

  return h;
}
function setTheme(key){S.theme=key;persist();applyTheme();render();}
function setFontSize(f){S.fontSize=f;persist();applyTheme();render();}

// ══ PAGE BUILDERS ══
function buildHome(){
  let h=S.reorderMode?`<div class="reorder-banner">↕ לחץ ארוך וגרור · או השתמש בחצים ▲▼</div>`:"";
  S.homeOrder.forEach((item,idx)=>{
    if(item==="notepad"){
      const cnt=S.npFolders.reduce((a,f)=>a+S.npNotes.filter(n=>n.folderId===f.id).length,0);
      if(S.reorderMode){
        h+=`<div class="card" style="display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.18);margin-bottom:10px"><span style="opacity:0.4">☰</span><span style="flex:1;font-weight:600">NOTEPAD 📓</span>${ib("▲",`moveHomeItem(${idx},-1)`)}${ib("▼",`moveHomeItem(${idx},1)`)}</div>`;
      }else{
        h+=`<button onclick="navNotepad()" style="width:100%;background:linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05));border:1px solid rgba(255,255,255,0.18);border-radius:16px;padding:14px 16px;color:#fff;cursor:pointer;text-align:right;display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:26px">📓</span><div><div style="font-weight:700;font-size:15px">NOTEPAD</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">${cnt} פתקים · ${S.npFolders.length} תיקיות</div></div><span style="margin-right:auto;font-size:18px;opacity:0.4">›</span></button>`;
      }
    }else if(item==="torah"){
      if(S.reorderMode){
        h+=`<div class="card" style="display:flex;align-items:center;gap:10px;border:1px solid rgba(76,175,125,0.3);margin-bottom:10px"><span style="opacity:0.4">☰</span><span style="flex:1;font-weight:600">${S.torahSectionTitle} 📖</span>${ib("▲",`moveHomeItem(${idx},-1)`)}${ib("▼",`moveHomeItem(${idx},1)`)}</div>`;
      }else{
        h+=`<button onclick="navTorah()" style="width:100%;background:linear-gradient(135deg,rgba(76,175,125,0.18),rgba(76,175,125,0.08));border:1px solid rgba(76,175,125,0.3);border-radius:16px;padding:14px 16px;color:#fff;cursor:pointer;text-align:right;display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:26px">📖</span><div><div style="font-weight:700;font-size:15px">${S.torahSectionTitle}</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">${S.torahBooks.length} ספרים</div></div><span style="margin-right:auto;font-size:18px;opacity:0.4">›</span></button>`;
      }
    }else if(item==="goals-grid"){
      if(S.reorderMode){
        h+=`<div class="card" style="display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.18)"><span style="opacity:0.4">☰</span><span style="flex:1;font-weight:600">🎯 קטגוריות מטרות</span>${ib("▲",`moveHomeItem(${idx},-1)`)}${ib("▼",`moveHomeItem(${idx},1)`)}</div>`;
      }else{
        h+=`<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:8px">תחומים ומטרות</div><div class="grid2">`;
        S.cats.forEach(cat=>{
          const cnt=S.data[cat.id]?.goals.length||0;
          h+=`<button onclick="navCat('${cat.id}')" class="cat-tile" style="background:linear-gradient(135deg,${cat.color}22,${cat.color}0a);border:1px solid ${cat.color}44"><div style="font-size:22px;margin-bottom:5px">${cat.emoji}</div><div style="font-size:12px;font-weight:700;line-height:1.3;margin-bottom:5px">${cat.label}</div>${tag(cnt+" מטרות",cat.color)}</button>`;
        });
        h+=`</div>`;
      }
    }
  });
  return h;
}
function moveHomeItem(idx,dir){const ni=idx+dir;if(ni<0||ni>=S.homeOrder.length)return;const a=[...S.homeOrder];[a[idx],a[ni]]=[a[ni],a[idx]];setState({homeOrder:a});}

function buildManageCats(){
  let h=`<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:10px">✏️ לשינוי שם · 🗑 למחיקה</div>`;
  S.cats.forEach(cat=>{
    h+=`<div class="card" style="border:1px solid ${cat.color}33;display:flex;align-items:center;gap:9px">
      <span style="font-size:20px">${cat.emoji}</span>
      <div style="flex:1"><div style="font-weight:700;font-size:14px">${cat.label}</div><div style="font-size:11px;color:rgba(255,255,255,0.4)">${S.data[cat.id]?.goals.length||0} מטרות</div></div>
      ${ib("✏️",`editCat('${cat.id}')`)}${ib("🗑",`deleteCat('${cat.id}')`, "rgba(255,80,80,0.15)")}
    </div>`;
  });
  if(S.showCatForm){
    h+=`<div class="card" style="border:1px solid ${S.catForm.color}55">
      <div style="font-size:13px;font-weight:700;color:${S.catForm.color};margin-bottom:10px">${S.editCatId?"עריכת קטגוריה":"קטגוריה חדשה"}</div>
      <input id="catLabel" class="inp" placeholder="שם הקטגוריה *" value="${(S.catForm.label||"").replace(/"/g,'&quot;')}" style="margin-bottom:10px"/>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:5px">סמל:</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-height:110px;overflow-y:auto;margin-bottom:10px">
        ${EMOJI_OPTIONS.map(em=>`<button onclick="setCatEmoji('${em}')" style="font-size:18px;background:${S.catForm.emoji===em?"rgba(255,255,255,0.2)":"transparent"};border:${S.catForm.emoji===em?"2px solid rgba(255,255,255,0.5)":"2px solid transparent"};border-radius:8px;padding:2px 4px;cursor:pointer">${em}</button>`).join("")}
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:5px">צבע:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
        ${COLOR_OPTIONS.map(col=>`<button onclick="setCatColor('${col}')" style="width:26px;height:26px;border-radius:50%;background:${col};border:${S.catForm.color===col?"3px solid #fff":"3px solid transparent"};cursor:pointer"></button>`).join("")}
      </div>
      <div style="display:flex;gap:8px">${btn("שמור ✓","saveCatFromForm()",S.catForm.color,"flex")}${btn("ביטול","setState({showCatForm:false,editCatId:null})")}</div>
    </div>`;
  }else{
    h+=`<button class="dashed-btn" onclick="setState({showCatForm:true,catForm:{label:'',emoji:'🎯',color:'#E85D75'},editCatId:null})" style="background:#9B6FE818;border-color:#9B6FE855;color:#9B6FE8">+ קטגוריה חדשה</button>`;
  }
  return h;
}
function editCat(id){const c=S.cats.find(x=>x.id===id);setState({showCatForm:true,editCatId:id,catForm:{label:c.label,emoji:c.emoji,color:c.color}});}
function setCatEmoji(e){S.catForm.emoji=e;setState({});}
function setCatColor(c){S.catForm.color=c;setState({});}
function saveCatFromForm(){const lbl=document.getElementById("catLabel")?.value||"";if(!lbl.trim())return;S.catForm.label=lbl;saveCat();}

function buildCatTrash(){
  return trashSection(S.catsTrash,"setState({catsTrash:[]})",cat=>`
    <div class="card" style="border:1px solid ${cat.color}44;background:${cat.color}0a">
      <div class="row" style="margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">${cat.emoji}</span><div><div style="font-weight:700;font-size:14px">${cat.label}</div><div style="font-size:11px;color:rgba(255,255,255,0.4)">נמחק: ${cat.deletedAt} · ${cat.goals.length} מטרות</div></div></div>
        <div style="display:flex;gap:6px">${ib("↩ שחזר",`restoreCat('${cat.id}')`, "rgba(76,175,125,0.25)")} ${ib("🗑",`setState({catsTrash:S.catsTrash.filter(c=>c.id!=='${cat.id}')})`, "rgba(255,80,80,0.2)")}</div>
      </div>
      ${cat.goals.length>0?`<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08)">${cat.goals.map((g,i)=>`<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:2px">${i+1}. ${g.title}</div>`).join("")}</div>`:""}
    </div>`
  );
}

function buildGoals(){
  const cat=S.cats.find(c=>c.id===S.activeCat);if(!cat)return"";
  let h="";
  const goals=S.data[S.activeCat]?.goals||[];
  if(!goals.length&&!S.addingGoal)h=`<div class="empty-state"><div class="icon">🌟</div>הוסף מטרה ראשונה!</div>`;
  goals.forEach((g,i)=>{
    if(S.editGoalId===g.id){
      h+=`<div class="card" style="border:1px solid ${cat.color}66">${inp("editGoalInp","שם המטרה...",g.title.replace(/"/g,'&quot;'),"text","style='margin-bottom:8px'")}<div style="display:flex;gap:8px">${btn("שמור ✓","saveGoalFromForm()",cat.color,"flex")}${btn("ביטול","setState({editGoalId:null})")}</div></div>`;
    }else{
      h+=`<div class="card" style="border:1px solid ${cat.color}33;display:flex;align-items:center;gap:9px;cursor:pointer" onclick="setState({view:'goal-detail',activeGoalId:'${g.id}'})">
        <span style="background:${cat.color};color:#fff;border-radius:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${i+1}</span>
        <div style="flex:1"><div style="font-weight:600;font-size:14px">${g.title}</div><div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px">${g.notes.length} הערות</div></div>
        <span style="font-size:16px;opacity:0.4">›</span>
        ${ib("✏️",`startEditGoal('${g.id}')`)} ${ib("🗑",`deleteGoal('${g.id}')`, "rgba(255,80,80,0.15)")}
      </div>`;
    }
  });
  if(S.addingGoal){
    h+=`<div class="card">${inp("newGoalInp","שם המטרה...","","text","style='margin-bottom:10px'")}<div style="display:flex;gap:8px">${btn("הוסף ✓","addGoalFromForm()",cat.color,"flex")}${btn("ביטול","setState({addingGoal:false})")}</div></div>`;
  }else{
    h+=`<button class="dashed-btn" onclick="setState({addingGoal:true})" style="background:${cat.color}18;border-color:${cat.color}55;color:${cat.color}">+ הוסף מטרה</button>`;
  }
  return h;
}
function startEditGoal(id){const g=S.data[S.activeCat].goals.find(g=>g.id===id);setState({editGoalId:id,editGoalText:g.title});}
function addGoalFromForm(){S.newGoal=document.getElementById("newGoalInp")?.value||"";addGoal();}
function saveGoalFromForm(){S.editGoalText=document.getElementById("editGoalInp")?.value||"";saveEditGoal();}

function buildGoalDetail(){
  const cat=S.cats.find(c=>c.id===S.activeCat);
  const goal=S.data[S.activeCat]?.goals.find(g=>g.id===S.activeGoalId);
  if(!cat||!goal)return"";
  let h="";
  if(!goal.notes.length&&!S.addingNote)h=`<div class="empty-state"><div class="icon">📋</div>הוסף הערה ראשונה!</div>`;
  goal.notes.forEach((n,i)=>{
    const exp=S.noteExp[n.id]||0;
    h+=`<div class="card" style="border:1px solid ${cat.color}33;opacity:${n.done?0.5:1}">
      <div style="display:flex;align-items:flex-start;gap:9px">
        <button onclick="toggleGoalNote('${n.id}')" style="width:22px;height:22px;border-radius:7px;border:2px solid ${n.done?cat.color:"rgba(255,255,255,0.3)"};background:${n.done?cat.color:"transparent"};cursor:pointer;flex-shrink:0;margin-top:2px;color:#fff;font-size:12px">${n.done?"✓":""}</button>
        <div style="flex:1;cursor:pointer" onclick="toggleNoteExp('${n.id}')">
          ${tag("#"+(i+1),cat.color)}
          <div style="text-decoration:${n.done?"line-through":"none"};margin-top:4px">${richHTML(n.text,exp===0?"clamp1":"clamp4")}</div>
          ${exp===0&&n.text.length>50?`<span style="font-size:11px;color:rgba(255,255,255,0.35)">לחץ להרחבה…</span>`:""}
        </div>
        ${ib("⤢",`setState({fullNote:{type:'goal',id:'${n.id}'}})`, "rgba(255,255,255,0.07)")}
        ${ib("🗑",`deleteGoalNote('${n.id}')`, "rgba(255,80,80,0.15)")}
      </div>
    </div>`;
  });
  if(S.addingNote){
    h+=`<div class="card"><div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px">💡 ==טקסט== = הדגשה צהובה</div>${textarea("newNoteTA","כתוב הערה...",S.newNote,3)}<div style="display:flex;gap:8px;margin-top:8px">${btn("הוסף ✓","addNoteFromForm()",cat.color,"flex")}${btn("ביטול","setState({addingNote:false})")}</div></div>`;
  }else{
    h+=`<button class="dashed-btn" onclick="setState({addingNote:true})" style="background:${cat.color}18;border-color:${cat.color}55;color:${cat.color}">+ הוסף הערה</button>`;
  }
  return h;
}
function toggleNoteExp(id){const cur=S.noteExp[id]||0;S.noteExp={...S.noteExp,[id]:Math.min(cur+1,1)};setState({});}
function addNoteFromForm(){S.newNote=document.getElementById("newNoteTA")?.value||"";addGoalNote();}

function buildGoalsTrash(){
  return trashSection(S.goalsTrash,"setState({goalsTrash:[]})",g=>{
    const cat=S.cats.find(c=>c.id===g.catId)||S.catsTrash.find(c=>c.id===g.catId);
    return`<div class="card" style="border:1px solid rgba(255,80,80,0.2);background:rgba(255,50,50,0.06)">
      <div class="row" style="margin-bottom:6px">
        <div><div style="font-size:11px;color:rgba(255,255,255,0.35)">📅 ${g.deletedAt}</div>${cat?tag(cat.emoji+" "+cat.label,cat.color):""}</div>
        <div style="display:flex;gap:6px">${ib("↩ שחזר",`restoreGoal('${g.id}')`, "rgba(76,175,125,0.25)")} ${ib("🗑",`setState({goalsTrash:S.goalsTrash.filter(x=>x.id!=='${g.id}')})`, "rgba(255,80,80,0.2)")}</div>
      </div>
      <div style="font-weight:600;font-size:14px">${g.title}</div>
      ${g.notes.length?`<div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:4px">${g.notes.length} הערות</div>`:""}
    </div>`;
  });
}

function buildTorah(){
  let h="";
  if(!S.torahBooks.length&&!S.addingBook)h=`<div class="empty-state"><div class="icon">📖</div>הוסף ספר ראשון!</div>`;
  S.torahBooks.forEach((b,i)=>{
    const hasImg=!!S.bookImages[b.id];
    const pad=S.compactMode?"8px 12px":"12px 14px";
    h+=`<div class="card" style="border:1px solid rgba(76,175,125,0.3);padding:${pad}">
      <div class="row" style="margin-bottom:8px">
        <div style="font-weight:700;font-size:15px">${i+1}. ${b.name}</div>
        <div style="display:flex;gap:5px">
          ${hasImg?ib("🖼",`setViewingImg('${b.id}')`, "rgba(93,168,232,0.2)"):""}
          ${ib("📷",`capturePhoto('${b.id}')`)}
          ${ib("✏️",`editBook('${b.id}')`)}
          ${ib("🗑",`deleteBook('${b.id}')`, "rgba(255,80,80,0.15)")}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${b.chapter?tag("פרק "+b.chapter,"#4CAF7D"):""}
        ${b.page?tag("עמוד "+b.page,"#5DA8E8"):""}
      </div>
      ${b.lastText?`<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.08);padding-top:8px">עצרתי ב: <em>"${b.lastText}"</em></div>`:""}
      ${hasImg&&!S.compactMode?`<img src="${S.bookImages[b.id]}" onclick="setViewingImg('${b.id}')" style="margin-top:10px;width:100%;max-height:130px;object-fit:cover;border-radius:10px;cursor:pointer" alt="page"/>`:""}
    </div>`;
  });
  if(S.addingBook){
    h+=`<div class="card" style="border:1px solid rgba(76,175,125,0.4)">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:#4CAF7D">${S.editBookId?"עריכת ספר":"ספר חדש"}</div>
      ${inp("bookName","שם הספר *",S.bookForm.name.replace(/"/g,'&quot;'),"text","style='margin-bottom:8px'")}
      ${inp("bookChapter","פרק",S.bookForm.chapter,"text","style='margin-bottom:8px'")}
      ${inp("bookPage","עמוד",S.bookForm.page,"text","style='margin-bottom:8px'")}
      ${textarea("bookLastText","הטקסט שעצרתי בו...",S.bookForm.lastText,2)}
      <div style="display:flex;gap:8px;margin-top:8px">${btn("שמור ✓","saveBookFromForm()","#4CAF7D","flex")}${btn("ביטול","setState({addingBook:false,editBookId:null,bookForm:{name:'',chapter:'',page:'',lastText:''}})") }</div>
    </div>`;
  }else{
    h+=`<button class="dashed-btn" onclick="setState({addingBook:true})" style="background:#4CAF7D18;border-color:#4CAF7D55;color:#4CAF7D">+ הוסף ספר</button>`;
  }
  return h;
}
function editBook(id){const b=S.torahBooks.find(b=>b.id===id);setState({addingBook:true,editBookId:id,bookForm:{name:b.name,chapter:b.chapter,page:b.page,lastText:b.lastText}});}
function saveBookFromForm(){S.bookForm={name:document.getElementById("bookName")?.value||"",chapter:document.getElementById("bookChapter")?.value||"",page:document.getElementById("bookPage")?.value||"",lastText:document.getElementById("bookLastText")?.value||""};saveBook();}
function capturePhoto(id){S.pendingPhotoBookId=id;document.getElementById("cameraInput").click();}
function setViewingImg(bookId){setState({viewingImg:bookId});}

function buildTorahTrash(){
  return trashSection(S.torahTrash,"setState({torahTrash:[]})",b=>`
    <div class="card" style="border:1px solid rgba(255,80,80,0.2);background:rgba(255,50,50,0.06)">
      <div class="row" style="margin-bottom:6px">
        <span style="font-size:11px;color:rgba(255,255,255,0.35)">📅 ${b.deletedAt}</span>
        <div style="display:flex;gap:6px">${ib("↩ שחזר",`restoreBook('${b.id}')`, "rgba(76,175,125,0.25)")} ${ib("🗑",`setState({torahTrash:S.torahTrash.filter(x=>x.id!=='${b.id}')})`, "rgba(255,80,80,0.2)")}</div>
      </div>
      <div style="font-weight:600;font-size:14px;margin-bottom:6px">${b.name}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${b.chapter?tag("פרק "+b.chapter,"#4CAF7D"):""}${b.page?tag("עמוד "+b.page,"#5DA8E8"):""}</div>
      ${b.lastText?`<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px">עצרתי ב: <em>"${b.lastText}"</em></div>`:""}
    </div>`
  );
}

function buildFolderMenu(){
  let h=`<div class="slide-menu">
    <div class="row" style="margin-bottom:8px"><span style="font-size:12px;color:rgba(255,255,255,0.4)">תיקיות</span><span style="font-size:11px;color:rgba(255,200,0,0.55)">לחץ ארוך = גרירה</span></div>`;
  S.npFolders.forEach((f,idx)=>{
    const cnt=S.npNotes.filter(n=>n.folderId===f.id).length;
    const isActive=f.id===S.activeFolderId;
    if(S.editFolderId===f.id){
      h+=`<div style="display:flex;gap:6px;margin-bottom:6px">${inp("editFolderInp","שם...",f.name.replace(/"/g,'&quot;'),"text","style='padding:6px 10px;font-size:13px'")}<button class="ib" onclick="saveRenameFolderFromForm()" style="background:#4CAF7D;font-size:12px">✓</button><button class="ib" onclick="setState({editFolderId:null})">✕</button></div>`;
    }else{
      h+=`<div class="folder-row" style="background:${isActive?"rgba(93,168,232,0.18)":"transparent"}" onclick="selectFolder('${f.id}')">
        <span style="font-size:13px;opacity:0.4">☰</span>
        <span style="font-size:15px">📁</span>
        <span style="flex:1;font-size:13px;font-weight:${isActive?700:400}">${f.name}</span>
        <span style="font-size:11px;color:rgba(255,255,255,0.38)">${cnt}</span>
        ${ib("▲",`moveFolderItem(${idx},-1)`, "rgba(255,255,255,0.1)", "padding:2px 5px;font-size:11px")}
        ${ib("▼",`moveFolderItem(${idx},1)`, "rgba(255,255,255,0.1)", "padding:2px 5px;font-size:11px")}
        ${f.id!=="default"?ib("✏️",`setState({editFolderId:'${f.id}',editFolderName:'${f.name.replace(/'/g,"\\'")}'})`,"rgba(255,255,255,0.1)","padding:3px 6px;font-size:12px"):""}
        ${f.id!=="default"?ib("🗑",`deleteFolder('${f.id}')`, "rgba(255,80,80,0.15)","padding:3px 6px;font-size:12px"):""}
      </div>`;
    }
  });
  if(S.addingFolder){
    h+=`<div style="display:flex;gap:6px;margin-top:6px">${inp("newFolderInp","שם התיקייה...","","text","style='padding:6px 10px;font-size:13px'")}<button class="ib" onclick="addFolderFromForm()" style="background:#5DA8E8;font-size:12px">✓</button><button class="ib" onclick="setState({addingFolder:false})">✕</button></div>`;
  }else{
    h+=`<button class="hb" onclick="setState({addingFolder:true})" style="margin-top:7px;width:100%;text-align:center;font-size:12px;color:#5DA8E8;background:rgba(93,168,232,0.1)">+ תיקייה חדשה</button>`;
  }
  h+=`<div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:9px;padding-top:8px;display:flex;flex-direction:column;gap:5px">
    <button class="hb" onclick="importTxt()" style="font-size:12px;text-align:center;color:#5DA8E8;background:rgba(93,168,232,0.1)">⬆ ייבוא TXT → תיקיית "העלאה"</button>
    <button class="hb" onclick="importFnp()" style="font-size:12px;text-align:center;color:#c4a0f5;background:rgba(155,111,232,0.1)">⬆ ייבוא Fast Notepad</button>
    <button class="hb" onclick="setState({view:'np-trash',folderMenuOpen:false})" style="font-size:12px;text-align:center;color:#ff9090;background:rgba(255,80,80,0.08)">🗑 סל מיחזור (${S.npTrash.length})</button>
    <button class="hb" onclick="downloadTXT(exportNpTXT(),'פתקים.txt')" style="font-size:12px;text-align:center">⬇ ייצוא TXT</button>
  </div></div>`;
  return h;
}
function selectFolder(id){setState({activeFolderId:id,folderMenuOpen:false,searchQuery:"",showSearch:false});}
function moveFolderItem(idx,dir){const ni=idx+dir;if(ni<0||ni>=S.npFolders.length)return;const a=[...S.npFolders];[a[idx],a[ni]]=[a[ni],a[idx]];setState({npFolders:a});}
function addFolderFromForm(){S.newFolderName=document.getElementById("newFolderInp")?.value||"";addFolder();}
function saveRenameFolderFromForm(){S.editFolderName=document.getElementById("editFolderInp")?.value||"";saveRenameFolder();}
function importTxt(){setState({folderMenuOpen:false});document.getElementById("txtInput").click();}
function importFnp(){setState({folderMenuOpen:false});document.getElementById("fnpInput").click();}

function buildNpMenu(){
  return`<div class="slide-menu">
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:8px">מיון פתקים</div>
    ${[["date","לפי תאריך 📅"],["star","מסומנים קודם ⭐"],["az","א-ב 🔤"]].map(([m,l])=>`<button onclick="setState({sortMode:'${m}',npMenuOpen:false})" style="width:100%;text-align:right;background:${S.sortMode===m?"rgba(155,111,232,0.25)":"transparent"};border:none;border-radius:8px;color:${S.sortMode===m?"#c4a0f5":"rgba(255,255,255,0.7)"};font-size:13px;padding:8px 10px;cursor:pointer;margin-bottom:3px">${S.sortMode===m?"✓ ":""}${l}</button>`).join("")}
    <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:5px;padding-top:6px">
      <button onclick="exportCurrentFolder()" style="width:100%;text-align:right;background:transparent;border:none;border-radius:8px;color:rgba(255,255,255,0.65);font-size:13px;padding:8px 10px;cursor:pointer">⬇ ייצוא תיקייה זו</button>
    </div>
  </div>`;
}
function exportCurrentFolder(){const f=S.npFolders.find(x=>x.id===S.activeFolderId);const t=S.npNotes.filter(n=>n.folderId===S.activeFolderId).map(n=>n.text).join("\n\n---\n\n");downloadTXT(t,`${f?.name||"פתקים"}.txt`);setState({npMenuOpen:false});}

function buildNotepad(){
  let h=`<div class="tabs">${S.npFolders.map(f=>`<button class="tab ${f.id===S.activeFolderId?"active":""}" onclick="setState({activeFolderId:'${f.id}',searchQuery:''})">${f.name} <span style="opacity:0.6">(${S.npNotes.filter(n=>n.folderId===f.id).length})</span></button>`).join("")}</div>`;
  const notes=getFolderNotes();
  if(!notes.length&&!S.addingNpNote)h+=`<div class="empty-state"><div class="icon">🗒</div>${S.searchQuery?"אין תוצאות":"הוסף את הפתק הראשון!"}</div>`;
  const pad=S.compactMode?"8px 12px":"12px 14px";
  notes.forEach(n=>{
    const exp=S.noteExp[n.id]||0;
    if(S.editNpNoteId===n.id){
      h+=`<div class="card" style="padding:${pad}"><div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:5px">💡 ==טקסט== = הדגשה צהובה</div>${textarea("editNoteTA","",n.text,4)}<div style="display:flex;gap:7px;margin-top:8px">${btn("שמור ✓","saveEditNoteFromForm()","#5DA8E8","flex")}${btn("ביטול","setState({editNpNoteId:null,npNoteText:''})")}</div></div>`;
    }else{
      h+=`<div class="card" style="border:1px solid ${n.star?"rgba(255,210,0,0.4)":"rgba(255,255,255,0.1)"};background:${n.star?"rgba(255,210,0,0.05)":"rgba(255,255,255,0.07)"};padding:${pad}">
        <div class="row" style="margin-bottom:5px">
          <span style="font-size:11px;color:rgba(255,255,255,0.38)">📅 ${n.date}</span>
          <div style="display:flex;gap:4px">
            ${ib("⭐",`toggleStar('${n.id}')`, n.star?"rgba(255,210,0,0.25)":"rgba(255,255,255,0.08)", n.star?"color:#FFD700":"color:rgba(255,255,255,0.4)")}
            ${ib("✏️",`setState({editNpNoteId:'${n.id}',npNoteText:''})`)}
            ${ib("⧉",`duplicateNote('${n.id}')`)}
            ${ib("📂",`setState({moveNoteId:'${n.id}'})`)}
            ${ib("↗",`setState({shareNoteId:'${n.id}'})`)}
            ${ib("⤢",`setState({fullNote:{type:'np',id:'${n.id}'}})`, "rgba(255,255,255,0.07)")}
            ${ib("🗑",`deleteNpNote('${n.id}')`, "rgba(255,80,80,0.15)")}
          </div>
        </div>
        <div style="cursor:pointer" onclick="tapNote('${n.id}')">
          ${richHTML(n.text,exp===0?"clamp1":"clamp4")}
          ${exp===0&&(n.text.includes("\n")||n.text.length>55)?`<span style="font-size:11px;color:rgba(255,255,255,0.3)">לחץ להרחבה…</span>`:""}
          ${exp===1?`<span style="font-size:11px;color:rgba(93,168,232,0.6)">לחץ שוב למסך מלא ⤢</span>`:""}
        </div>
      </div>`;
    }
  });
  if(S.addingNpNote){
    h+=`<div class="card"><div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:5px">💡 ==טקסט== = הדגשה צהובה · קישורים מזוהים אוטומטית</div>${textarea("newNotepadTA","כתוב פתק...",S.npNoteText,5)}<div style="display:flex;gap:8px;margin-top:8px">${btn("שמור ✓","saveNpNoteFromForm()","#5DA8E8","flex")}${btn("ביטול","setState({addingNpNote:false,npNoteText:''})")}</div></div>`;
  }else if(!S.searchQuery){
    h+=`<button class="dashed-btn" onclick="setState({addingNpNote:true})" style="background:#5DA8E818;border-color:#5DA8E855;color:#5DA8E8">+ פתק חדש</button>`;
  }
  return h;
}
function tapNote(id){
  const cur=S.noteExp[id]||0;
  if(cur===0){S.noteExp={...S.noteExp,[id]:1};setState({});}
  else setState({fullNote:{type:"np",id}});
}
function saveNpNoteFromForm(){S.npNoteText=document.getElementById("newNotepadTA")?.value||"";saveNpNote();}
function saveEditNoteFromForm(){const v=document.getElementById("editNoteTA")?.value||"";if(!v.trim())return;S.npNotes=S.npNotes.map(n=>n.id===S.editNpNoteId?{...n,text:v.trim()}:n);setState({editNpNoteId:null,npNoteText:""});}

function buildNpTrash(){
  return trashSection(S.npTrash,"setState({npTrash:[]})",n=>{
    const folder=S.npFolders.find(f=>f.id===n.folderId);
    return`<div class="card" style="border:1px solid rgba(255,80,80,0.2);background:rgba(255,50,50,0.06)">
      <div class="row" style="margin-bottom:6px">
        <div><span style="font-size:11px;color:rgba(255,255,255,0.35)">📅 ${n.deletedAt}</span>${folder?`<span style="font-size:11px;color:rgba(255,255,255,0.35);margin-right:6px"> · 📁 ${folder.name}</span>`:""}</div>
        <div style="display:flex;gap:6px">${ib("↩ שחזר",`restoreNote('${n.id}')`, "rgba(76,175,125,0.25)")} ${ib("🗑",`permanentDelete('${n.id}')`, "rgba(255,80,80,0.2)")}</div>
      </div>
      <div style="font-size:13px;line-height:1.5;color:rgba(255,255,255,0.7);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${n.text}</div>
    </div>`;
  });
}

// ══ MODALS ══
function buildShareModal(){
  const n=S.npNotes.find(x=>x.id===S.shareNoteId);if(!n)return"";
  const wtxt=encodeURIComponent(n.text);
  return`<div class="modal-bg" onclick="setState({shareNoteId:null})"><div class="modal" onclick="event.stopPropagation()">
    <h3>שתף פתק</h3>
    <button onclick="shareWA(decodeURIComponent('${wtxt}'))" style="width:100%;background:rgba(37,211,102,0.13);border:1px solid rgba(37,211,102,0.3);border-radius:10px;color:#25D366;padding:12px;font-size:14px;cursor:pointer;margin-bottom:8px">📱 שלח בווצאפ</button>
    <button onclick="shareEmail('פתק',decodeURIComponent('${wtxt}'))" style="width:100%;background:rgba(234,67,53,0.13);border:1px solid rgba(234,67,53,0.3);border-radius:10px;color:#EA4335;padding:12px;font-size:14px;cursor:pointer;margin-bottom:8px">✉️ שלח במייל</button>
    <button onclick="downloadTXT(decodeURIComponent('${wtxt}'),'פתק.txt')" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;padding:12px;font-size:14px;cursor:pointer;margin-bottom:12px">⬇ ייצא TXT</button>
    <button class="hb" onclick="setState({shareNoteId:null})" style="width:100%;text-align:center">ביטול</button>
  </div></div>`;
}

function buildMoveModal(){
  return`<div class="modal-bg" onclick="setState({moveNoteId:null})"><div class="modal" onclick="event.stopPropagation()">
    <h3>העבר פתק לתיקייה</h3>
    ${S.npFolders.filter(f=>f.id!==S.activeFolderId).map(f=>`<button onclick="moveNote('${S.moveNoteId}','${f.id}')" style="width:100%;text-align:right;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;padding:11px 14px;font-size:14px;cursor:pointer;margin-bottom:7px;display:flex;align-items:center;gap:10px"><span>📁</span><span>${f.name}</span></button>`).join("")}
    <button class="hb" onclick="setState({moveNoteId:null})" style="width:100%;text-align:center">ביטול</button>
  </div></div>`;
}

function buildImgModal(){
  if(!S.viewingImg)return"";
  const src=S.bookImages[S.viewingImg]||"";
  return`<div class="modal-bg" onclick="setState({viewingImg:null})" style="z-index:200"><img src="${src}" style="max-width:100%;max-height:82vh;border-radius:12px;object-fit:contain"/></div>`;
}

function buildFullNote(){
  let text="",title="",date="";
  if(S.fullNote.type==="np"){const n=S.npNotes.find(x=>x.id===S.fullNote.id);text=n?.text||"";date=n?.date||"";title="פתק";}
  if(S.fullNote.type==="goal"){const n=S.data[S.activeCat]?.goals.find(g=>g.id===S.activeGoalId)?.notes.find(x=>x.id===S.fullNote.id);text=n?.text||"";title="הערה";}
  const wtxt=encodeURIComponent(text);
  return`<div class="hdr"><button class="hb" onclick="setState({fullNote:null})" style="font-size:16px;padding:4px 11px">←</button><div class="hdr-title">${title}</div>
    <button class="hb" onclick="shareWA(decodeURIComponent('${wtxt}'))" style="color:#25D366;background:rgba(37,211,102,0.15)">📱 WA</button>
    <button class="hb" onclick="shareEmail('${title}',decodeURIComponent('${wtxt}'))" style="color:#EA4335;background:rgba(234,67,53,0.12)">✉️</button>
  </div>
  <div class="content" style="padding:20px">
    ${date?`<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:14px">📅 ${date}</div>`:""}
    ${richHTML(text)}
  </div>`;
}

// ══ MAIN RENDER ══
function render(){
  const shell=document.getElementById("shell");
  if(!shell)return;
  applyTheme();

  if(S.fullNote){
    shell.innerHTML=buildFullNote()+buildFooter();
    return;
  }

  if(S.showSettings){
    shell.innerHTML=buildHeader()+`<div class="content">${buildSettings()}</div>`+buildFooter();
    return;
  }

  let content="";
  if(S.view==="home")content=buildHome();
  else if(S.view==="manage-cats")content=buildManageCats();
  else if(S.view==="cat-trash")content=buildCatTrash();
  else if(S.view==="goals")content=buildGoals();
  else if(S.view==="goal-detail")content=buildGoalDetail();
  else if(S.view==="goals-trash")content=buildGoalsTrash();
  else if(S.view==="torah-progress")content=buildTorah();
  else if(S.view==="torah-trash")content=buildTorahTrash();
  else if(S.view==="notepad")content=buildNotepad();
  else if(S.view==="np-trash")content=buildNpTrash();

  let extras="";
  if(S.view==="home"&&S.reorderMode)extras=`<div class="reorder-banner">↕ לחץ ארוך וגרור · או השתמש בחצים ▲▼</div>`;
  if(S.view==="notepad"&&S.showSearch)extras+=`<div style="padding:8px 13px;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(255,255,255,0.08)"><input id="searchInp" class="inp" placeholder="חיפוש..." value="${S.searchQuery.replace(/"/g,'&quot;')}" oninput="S.searchQuery=this.value;persist();renderContent()"/></div>`;
  if(S.view==="notepad"&&S.folderMenuOpen)extras+=buildFolderMenu();
  if(S.view==="notepad"&&S.npMenuOpen)extras+=buildNpMenu();

  let modals="";
  if(S.shareNoteId)modals+=buildShareModal();
  if(S.moveNoteId)modals+=buildMoveModal();
  if(S.viewingImg)modals+=buildImgModal();

  shell.innerHTML=buildHeader()+extras+`<div class="content" onclick="closeMenus(event)">${content}</div>`+buildFooter()+modals;

  if(S.view==="home"&&S.editingTitle){const el=document.getElementById("titleInp");if(el){el.focus();el.select();}}
  if(S.view==="torah-progress"&&S.editingTorahTitle){const el=document.getElementById("torahTitleInp");if(el){el.focus();el.select();}}
  if(S.view==="notepad"&&S.showSearch){const el=document.getElementById("searchInp");if(el){el.focus();}}
}

function renderContent(){
  let content="";
  if(S.view==="notepad")content=buildNotepad();
  const c=document.querySelector(".content");
  if(c)c.innerHTML=content;
}

function closeMenus(e){
  if(S.folderMenuOpen||S.npMenuOpen){setState({folderMenuOpen:false,npMenuOpen:false});}
}

// ══ FILE INPUTS ══

// FIX 2: Compress image before saving → survives localStorage across reloads
document.getElementById("cameraInput").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f||!S.pendingPhotoBookId)return;
  const r=new FileReader();
  r.onload=ev=>{
    compressImage(ev.target.result, compressed=>{
      S.bookImages={...S.bookImages,[S.pendingPhotoBookId]:compressed};
      setState({});
    });
  };
  r.readAsDataURL(f);e.target.value="";
});

// FIX 3+4: Hebrew-safe TXT import using UTF-8 with fallback
document.getElementById("txtInput").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    const text=ev.target.result;
    let fid=S.npFolders.find(x=>x.name==="העלאה")?.id;
    if(!fid){fid=uid();S.npFolders=[...S.npFolders,{id:fid,name:"העלאה"}];}
    const parts=text.split(/\n\n---\n\n|\n\n/).filter(p=>p.trim());
    S.npNotes=[...S.npNotes,...parts.map(x=>({id:uid(),folderId:fid,text:x.trim(),date:today(),star:false}))];
    setState({activeFolderId:fid,view:"notepad",folderMenuOpen:false});
    alert("יובאו "+parts.length+" פתקים לתיקיית העלאה");
  };
  r.readAsText(f,"utf-8");e.target.value="";
});

// FIX 4: Fast Notepad import — UTF-8 with Hebrew support
document.getElementById("fnpInput").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    const lines=ev.target.result.split("\n");
    const folderMap={},newFolders=[],newNotes=[];
    let curFolder="העלאה",curText="";
    const ensureF=name=>{
      const ex=S.npFolders.find(x=>x.name===name)||newFolders.find(x=>x.name===name);
      if(ex){folderMap[name]=ex.id;return ex.id;}
      const id=uid();newFolders.push({id,name});folderMap[name]=id;return id;
    };
    lines.forEach(line=>{
      if(/^\[.+\]$/.test(line.trim())||/^##\s+/.test(line.trim())){
        if(curText.trim())newNotes.push({id:uid(),folderId:ensureF(curFolder),text:curText.trim(),date:today(),star:false});
        curFolder=line.replace(/^\[|\]$/g,"").replace(/^##\s+/,"").trim()||"העלאה";curText="";
      }else if(line.trim()==="---"){
        if(curText.trim())newNotes.push({id:uid(),folderId:ensureF(curFolder),text:curText.trim(),date:today(),star:false});
        curText="";
      }else{curText+=line+"\n";}
    });
    if(curText.trim())newNotes.push({id:uid(),folderId:ensureF(curFolder),text:curText.trim(),date:today(),star:false});
    if(newFolders.length)S.npFolders=[...S.npFolders,...newFolders];
    if(newNotes.length)S.npNotes=[...S.npNotes,...newNotes];
    setState({view:"notepad",folderMenuOpen:false});
    alert("יובאו "+newNotes.length+" פתקים");
  };
  r.readAsText(f,"utf-8");e.target.value="";
});

// BACKUP RESTORE
document.getElementById("backupInput").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>restoreFromBackup(ev.target.result);
  r.readAsText(f,"utf-8");e.target.value="";
});

// ══ INIT ══
applyTheme();
render();
