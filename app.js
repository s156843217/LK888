const $=s=>document.querySelector(s);
const initialPrompts=[
{title:'找出你的個人品牌定位',category:'個人品牌',desc:'從自己的經歷與特色開始，整理適合你的房仲定位。',body:'你是房仲個人品牌教練，請幫我找出適合我的個人IP定位。\n\n請用自然、簡單的方式，一次只問我一個問題，等我回答後再問下一題。若我不知道怎麼回答，請提供幾個例子讓我選擇。\n\n請依序了解：\n1. 我的服務區域、房仲年資與過去工作經驗。\n2. 我最想服務哪一類客戶，以及他們常遇到的問題。\n3. 我擅長處理什麼事情，請引導我分享實際案例。\n4. 客戶或同事通常怎麼形容我。\n5. 我的個性、興趣，以及願意公開分享的生活特色。\n6. 我希望客戶記住我什麼，以及我拍影片時最自在的表達方式。\n\n問完後，請依據我的回答，整理：\n① 一句話個人IP定位：我在＿＿，幫助＿＿，透過＿＿，解決＿＿。\n② 三個個人品牌關鍵字，並說明依據。\n③ 我的目標客群與可以提供的具體價值。\n④ 三個適合長期拍攝的短影音主題。\n⑤ 一段自然、不誇大的自我介紹，約20秒。\n⑥ 三個適合我拍第一支60秒口播影片的題目。\n\n不要替我編造經歷、專長或成交成績。如果資訊不足，請繼續問我。\n\n現在請開始問第一題。'},
{title:'室內照片・自然提亮',category:'房屋照片',desc:'提高空間明亮度，保留窗外景色與真實攝影質感。使用前請先上傳照片。',body:'提高整體曝光約 1～2 EV，讓室內更加明亮。保留窗外景色，不要過曝。提升自然日光效果，柔化陰影，均勻照亮整個空間。白平衡調整為自然中性色溫（約5000K～5500K），增加地板與牆面的細節，保持真實攝影質感，不要 HDR 過度效果，不改變格局、家具、門窗位置。'},
{title:'室內照片・清除生活雜物',category:'房屋照片',desc:'清除非固定式雜物，保留建築結構與固定設備。使用前請先上傳照片。',body:'請移除照片中所有非固定式雜物，使空間看起來乾淨整潔。 可移除： 生活用品、紙箱、垃圾袋、塑膠袋、衣物、鞋子、拖鞋、電線、延長線、充電器、清潔用品、瓶罐、玩具、包包、雜誌、文件、小型收納物、雜亂物品。 不得移除： 門窗、牆面、地板、天花板、柱體、樓梯、櫥櫃、流理台、衛浴設備、固定家具、家電、燈具、窗簾、插座及所有建築結構。 移除後請自然補齊背景與材質，保持原有光影、紋理與真實攝影質感，不產生修圖痕跡，不新增任何家具或裝飾品。'},
{title:'室內照片・調整拍攝角度',category:'房屋照片',desc:'以水平平移方式調整畫面，維持原有空間。使用前請先上傳照片。',body:'保持房屋格局、門窗、牆面、家具完全不變。僅將攝影機向右水平平移，使畫面更加端正。維持原始高度與鏡頭焦段，不改變透視、不新增或移除任何物件。'}];
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function save(key,data){try{localStorage.setItem(key,JSON.stringify(data))}catch{toast('本機儲存失敗，請確認瀏覽器儲存空間。')}}
let prompts=read('lk-prompts',initialPrompts),category='全部',editing=false,editIndex=-1;
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').style.display='none',2500)}
function route(){let id=location.hash.slice(1);if(!['home','prompts','schedule'].includes(id))id='home';document.querySelectorAll('.page').forEach(p=>p.hidden=p.id!==id);document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===id));$('#breadcrumb').textContent={home:'工作首頁',prompts:'AI 指令庫',schedule:'值班排表'}[id]}
window.addEventListener('hashchange',route);route();
function setScheduleView(view){
const horizontal=view==='traditional';
$('#calendar-view').hidden=horizontal;$('#traditional-view').hidden=!horizontal;
$('#view-calendar').setAttribute('aria-pressed',String(!horizontal));$('#view-traditional').setAttribute('aria-pressed',String(horizontal));
document.body.classList.toggle('horizontal-schedule',horizontal);save('lk-schedule-view',view);
let printStyle=$('#schedule-print-style');if(!printStyle){printStyle=element('style');printStyle.id='schedule-print-style';document.head.append(printStyle)}
printStyle.textContent=horizontal?'@page { size: A4 landscape; margin: 10mm; }':'';
}
$('#view-calendar').onclick=()=>setScheduleView('calendar');$('#view-traditional').onclick=()=>setScheduleView('traditional');
setScheduleView(read('lk-schedule-view','calendar'));
function element(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e}
async function copy(text){try{if(navigator.clipboard){await navigator.clipboard.writeText(text)}else{const t=element('textarea');t.value=text;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error()}toast('已複製完整指令')}catch{toast('無法自動複製，請展開指令後選取文字複製。')}}
function renderPrompts(){const categories=['全部',...new Set(prompts.map(p=>p.category))];if(!categories.includes(category))category='全部';$('#categories').replaceChildren(...categories.map(c=>{const b=element('button',c,c===category?'active':'');b.onclick=()=>{category=c;renderPrompts()};return b}));const q=$('#search').value.trim().toLowerCase();let count=0;$('#prompt-list').replaceChildren();prompts.forEach((p,index)=>{if((category!=='全部'&&p.category!==category)||!`${p.title}${p.desc}${p.body}`.toLowerCase().includes(q))return;count++;const card=element('article',null,'prompt-card');card.append(element('span',p.category,'eyebrow'),element('h3',p.title),element('p',p.desc));const details=element('details');details.append(element('summary','查看完整指令'),element('pre',p.body));card.append(details);const bottom=element('div',null,'card-bottom');bottom.append(element('span','複製後貼到 AI 使用'));const b=element('button','複製指令');b.onclick=()=>copy(p.body);bottom.append(b);if(editing){const edit=element('button','編輯');edit.onclick=()=>openEditor(index);bottom.append(edit);const del=element('button','刪除','secondary');del.onclick=()=>{if(confirm('確定刪除這則本機指令？')){prompts.splice(index,1);save('lk-prompts',prompts);renderPrompts()}};bottom.append(del)}card.append(bottom);$('#prompt-list').append(card)});$('#result-count').textContent=`共 ${count} 則指令`;if(!count)$('#prompt-list').append(element('p','找不到符合的指令，試試其他關鍵字。'));$('#add-prompt').hidden=!editing}
$('#search').oninput=renderPrompts;$('#manage').onclick=()=>{editing=!editing;$('#manage').textContent=editing?'結束本機編輯':'本機編輯示範';renderPrompts()};
function openEditor(index){editIndex=index;const p=prompts[index]||{title:'',category:'',desc:'',body:''};['title','category','desc','body'].forEach(k=>$('#edit-'+k).value=p[k]);$('#editor').showModal()}
$('#add-prompt').onclick=()=>openEditor(-1);$('#close-editor').onclick=()=>$('#editor').close();$('#editor-form').onsubmit=e=>{e.preventDefault();const p={};['title','category','desc','body'].forEach(k=>p[k]=$('#edit-'+k).value.trim());if(Object.values(p).some(v=>!v))return;editIndex<0?prompts.push(p):prompts[editIndex]=p;save('lk-prompts',prompts);renderPrompts();$('#editor').close();toast('已儲存到本機；尚未同步給同事')};renderPrompts();
let schedule=read('lk-schedule',{month:'2026-11',people:8,assignments:[],holidays:[],names:[]});$('#month').value=schedule.month;$('#people').value=schedule.people;
normaliseRules();
function daysInMonth(){const [y,m]=$('#month').value.split('-').map(Number);return new Date(y,m,0).getDate()}
function renderTraditional(){
const table=$('#traditional-table');if(!table)return;
const [y,m]=schedule.month.split('-').map(Number),total=daysInMonth();
const caption=element('caption',`太平洋房屋・林口捷運加盟店　${y-1911} 年 ${m} 月值班表`);
const head=element('thead'),dates=element('tr'),weeks=element('tr');
const person=element('th','人員／籤組');person.rowSpan=2;person.scope='col';dates.append(person);
for(let d=1;d<=total;d++){
const holiday=schedule.holidays.includes(d),th=element('th',String(d),holiday?'holiday':'');th.scope='col';dates.append(th);
weeks.append(element('th','日一二三四五六'[new Date(y,m-1,d).getDay()],holiday?'holiday':''));
}
const stats=element('th','總天數／假日');stats.rowSpan=2;stats.scope='col';dates.append(stats);head.append(dates,weeks);
const body=element('tbody');
for(let g=0;g<schedule.people;g++){
const row=element('tr'),label=`${String.fromCharCode(65+g)} 籤${schedule.names[g]?'・'+schedule.names[g]:''}`;
const name=element('th',label);name.scope='row';row.append(name);let count=0,holidays=0;
for(let d=1;d<=total;d++){
const assigned=schedule.assignments[d-1]===g,holiday=schedule.holidays.includes(d),cell=element('td',null,holiday?'holiday':'');
const button=element('button',assigned?'✓':'','duty-cell');button.setAttribute('aria-label',`${label}，${m}月${d}日，${assigned?'取消值班':'安排值班'}`);button.setAttribute('aria-pressed',String(assigned));
button.disabled=!canChangeDay(d,assigned?null:g);button.title=button.disabled?'已鎖定或此人當日不能值班':'';button.onclick=()=>changeDay(d,assigned?null:g);cell.append(button);row.append(cell);
if(assigned){count++;if(holiday)holidays++}
}
row.append(element('td',`${count}／${holidays}`,'totals'));body.append(row);
}
const foot=element('tfoot'),daily=element('tr');daily.append(element('th','當日值班'));
for(let d=1;d<=total;d++){const g=schedule.assignments[d-1];daily.append(element('td',Number.isInteger(g)?(schedule.names[g]||String.fromCharCode(65+g)+' 籤'):'待排',schedule.holidays.includes(d)?'holiday':''))}
daily.append(element('td'));foot.append(daily);table.replaceChildren(caption,head,body,foot);
}
function normaliseRules(){
schedule.rules=Array.from({length:schedule.people},(_,g)=>schedule.rules?.[g]||{special:false,target:null,blocked:[],locked:false});
}
function datesFor(g){return Array.from({length:daysInMonth()},(_,i)=>i+1).filter(d=>schedule.assignments[d-1]===g)}
function cannotWork(g,d){const r=schedule.rules[g];return r.blocked.includes(d)||(r.noHolidays&&schedule.holidays.includes(d))}
function hasPendingRules(except=null){return [...document.querySelectorAll('.rule-row')].some(form=>form!==except&&form.dataset.dirty==='true')}
function requireSavedRules(){if(!hasPendingRules())return true;const groups=[...document.querySelectorAll('.rule-row')].filter(f=>f.dataset.dirty==='true').map(f=>String.fromCharCode(65+Number(f.dataset.group))+' 組').join('、');feedback(`${groups} 尚未儲存，請先按各列「儲存設定」，再排班或鎖定。`,true);return false}
function feedback(message,error=false){$('#schedule-feedback').textContent=message;$('#schedule-feedback').classList.toggle('error',error);toast(message)}
function parseDates(value){
const dates=new Set();
for(const token of value.trim().split(/[、,，\s]+/).filter(Boolean)){
const match=token.match(/^(\d{1,2})(?:[-～~](\d{1,2}))?$/);
if(!match)throw new Error('日期請填如「12-18、25」，只填本月日期數字。');
const start=Number(match[1]),end=Number(match[2]||match[1]);
if(start<1||end>daysInMonth()||end<start)throw new Error(`日期必須介於 1～${daysInMonth()} 日，且起日不能大於迄日。`);
for(let d=start;d<=end;d++)dates.add(d);
}
return [...dates].sort((a,b)=>a-b);
}
function canChangeDay(d,g){
const old=schedule.assignments[d-1];
if(Number.isInteger(old)&&schedule.rules[old].locked)return false;
return g===null||(!schedule.rules[g].locked&&!cannotWork(g,d));
}
function changeDay(d,g){if(!requireSavedRules())return false;if(!canChangeDay(d,g)){feedback('這個日期已鎖定，或該同事當日不能值班。',true);return false}schedule.assignments[d-1]=g;renderSchedule();return true}
// 重畫表單前保留各列草稿，儲存其中一人時不清掉其他人的輸入。
function captureRuleDrafts(forms){
const drafts=new Map();
for(const form of forms){
if(form.dataset.dirty!=='true')continue;
drafts.set(form.dataset.group,[...form.querySelectorAll('[data-field]')].map(input=>({field:input.dataset.field,value:input.value,checked:input.checked})));
}
return drafts;
}
function restoreRuleDraft(form,draft){
if(!draft)return;
for(const input of form.querySelectorAll('[data-field]')){
const saved=draft.find(value=>value.field===input.dataset.field);if(!saved)continue;
if(input.type==='checkbox')input.checked=saved.checked;else input.value=saved.value;
}
form.dataset.dirty='true';
}
function renderRules(){
const drafts=captureRuleDrafts(document.querySelectorAll('.rule-row'));
const openGroups=[...document.querySelectorAll('.special-person[open]')].map(e=>Number(e.dataset.group));
const previous=$('#special-group').value;
$('#special-group').replaceChildren();
schedule.rules.forEach((r,g)=>{if(!r.special)$('#special-group').add(new Option(`${String.fromCharCode(65+g)} 組${schedule.names[g]?'・'+schedule.names[g]:''}`,g))});
if([...$('#special-group').options].some(o=>o.value===previous))$('#special-group').value=previous;
$('#add-special').disabled=$('#special-group').options.length===0;
$('#special-group').disabled=$('#special-group').options.length===0;
$('#special-rules').replaceChildren();
$('#special-count').textContent=`${schedule.rules.filter(r=>r.special).length} 人`;
schedule.rules.forEach((r,g)=>{
if(!r.special)return;
const detail=element('details',null,'special-person');detail.dataset.group=g;detail.open=openGroups.includes(g);
const conditions=[r.target!==null?`固定 ${r.target} 天`:'天數自動',r.blocked.length?`有 ${r.blocked.length} 天不能排`:'',r.noHolidays?'不排假日':'',r.locked?'已鎖定':'待確認'].filter(Boolean).join('・');
detail.append(element('summary',`${schedule.names[g]||String.fromCharCode(65+g)+' 組'}　${conditions}`));
const moveBar=element('div',null,'group-move');
const moveLabel=element('label','更換組別（姓名、日期與鎖定一併保留）');
const moveSelect=element('select');
for(let to=0;to<schedule.people;to++)moveSelect.add(new Option(`${String.fromCharCode(65+to)} 組${schedule.names[to]?'・'+schedule.names[to]:''}${to!==g?'（互換）':''}`,to));
moveSelect.value=String(g);moveLabel.append(moveSelect);
const moveButton=element('button','更換組別','secondary');moveButton.type='button';
moveButton.onclick=()=>{if(!requireSavedRules())return;const to=Number(moveSelect.value);if(to===g)return;try{schedule=swapScheduleGroups(schedule,g,to);renderSchedule();const moved=[...document.querySelectorAll('.special-person')].find(e=>Number(e.dataset.group)===to);if(moved)moved.open=true;feedback(`已互換 ${String.fromCharCode(65+g)}、${String.fromCharCode(65+to)} 組；兩組姓名、條件及日期完整保留。`)}catch(error){feedback(error.message,true)}};
moveBar.append(moveLabel,moveButton);detail.append(moveBar);
const form=element('form',null,'rule-row');
form.dataset.group=String(g);
form.oninput=()=>form.dataset.dirty='true';
form.append(element('strong',String.fromCharCode(65+g)+' 組'+(r.locked?'・已鎖定':'')));
function field(labelText,input){input.dataset.field=labelText;const label=element('label',labelText);label.append(input);form.append(label);return input}
const name=field('姓名（未抽籤可留白）',element('input'));name.value=schedule.names[g]||'';name.placeholder='例如：老闆';
const special=element('input');special.type='checkbox';special.checked=true;
const target=field('固定天數',element('select'));target.add(new Option('自動分配',''));for(let i=1;i<=daysInMonth();i++)target.add(new Option(i+' 天',i));target.value=r.target??'';
const blocked=field('不能值班日期',element('input'));blocked.value=r.blocked.join('、');blocked.placeholder='例如：12-18、25';
const noHolidays=element('input');noHolidays.type='checkbox';noHolidays.checked=!!r.noHolidays;field('不排假日',noHolidays);
const planned=field('預排日期（可手動改）',element('input'));planned.value=datesFor(g).join('、');planned.placeholder='先自動排，或填 3、14、26';
const saveButton=element('button','儲存設定','secondary');saveButton.type='submit';form.append(saveButton);
const lock=element('button',r.locked?'解鎖修改':datesFor(g).length?'確認並鎖定':'自動排班並鎖定',r.locked?'secondary':'');lock.type='button';lock.disabled=!r.special;
lock.onclick=()=>{
if(!requireSavedRules())return;
if(r.locked){r.locked=false;renderSchedule();feedback('已解鎖；修改設定後請重新鎖定。');return}
try{schedule=lockSpecialPerson(schedule,g,daysInMonth());renderSchedule();feedback(`${String.fromCharCode(65+g)} 組已排好並鎖定：${datesFor(g).join('、')} 日。其他特殊人員請繼續確認並鎖定。`)}catch(error){feedback(error.message,true)}
};form.append(lock);
for(const input of [name,blocked,planned])input.defaultValue=input.value;special.defaultChecked=special.checked;for(const option of target.options)option.defaultSelected=option.selected;
noHolidays.defaultChecked=noHolidays.checked;
const cancel=element('button','取消修改','secondary');cancel.type='button';cancel.onclick=()=>{form.reset();form.dataset.dirty='false'};form.append(cancel);
const remove=element('button','移除特殊設定','secondary');remove.type='button';remove.disabled=r.locked;remove.onclick=()=>{if(!requireSavedRules())return;schedule.rules[g]={special:false,target:null,blocked:[],noHolidays:false,locked:false};renderSchedule();feedback('已移除特殊條件，這一組回到一般抽籤名額。')};form.append(remove);
if(r.locked)[name,special,target,blocked,noHolidays,planned,saveButton].forEach(e=>e.disabled=true);
form.onsubmit=e=>{
e.preventDefault();try{
const unavailable=parseDates(blocked.value),count=target.value===''?null:Number(target.value);let ds=parseDates(planned.value);
const unavailableAll=[...new Set([...unavailable,...(noHolidays.checked?schedule.holidays:[])])];
const changed=ds.join(',')!==datesFor(g).join(',');
if(ds.some(d=>unavailableAll.includes(d))){if(changed)throw new Error('預排日期包含不能值班日或不允許的假日，請先調整。');ds=ds.filter(d=>!unavailableAll.includes(d))}
if(ds.some(d=>Number.isInteger(schedule.assignments[d-1])&&schedule.assignments[d-1]!==g&&schedule.rules[schedule.assignments[d-1]].locked))throw new Error('預排日期與其他已鎖定人員衝突，請改選日期。');
schedule.names[g]=name.value.trim();schedule.rules[g]={special:true,target:count,blocked:unavailable,noHolidays:noHolidays.checked,locked:false};
schedule.assignments=schedule.assignments.map(owner=>owner===g?null:owner);ds.forEach(d=>schedule.assignments[d-1]=g);
form.dataset.dirty='false';renderSchedule();feedback(hasPendingRules()?'這位同事已儲存；其他人的輸入已保留，請繼續儲存。':'設定已儲存；請按「先排特殊人員」，確認日期後鎖定。');
}catch(error){feedback(error.message,true)}
};restoreRuleDraft(form,drafts.get(String(g)));detail.append(form);$('#special-rules').append(detail);
});
}
function planSpecial(){
try{
if(!requireSavedRules())return;
if(!schedule.rules.some(r=>r.special&&!r.locked)){feedback('請先設定尚未鎖定的特殊人員。');return}
const plan=buildSchedulePlan({total:daysInMonth(),people:schedule.people,rules:schedule.rules,assignments:schedule.assignments,holidays:schedule.holidays});
schedule.assignments=plan.map(g=>schedule.rules[g].special?g:null);renderSchedule();feedback('特殊人員已預排，請逐一確認並鎖定，再編其餘籤組。');
}catch(error){feedback(error.message,true)}
}
function resetMonth(){
if(!$('#month').value)return;
if(!requireSavedRules()){$('#month').value=schedule.month;$('#people').value=schedule.people;return}
if((schedule.assignments.some(v=>Number.isInteger(v))||schedule.rules.some(r=>r.special))&&!confirm('切換月份或人數會清除本月排班、鎖定與特殊日期設定，確定繼續？')){$('#month').value=schedule.month;$('#people').value=schedule.people;return}
const names=[...schedule.names];schedule={month:$('#month').value,people:Number($('#people').value),assignments:[],holidays:[],names};normaliseRules();
const [y,m]=schedule.month.split('-').map(Number);for(let d=1;d<=daysInMonth();d++)if([0,6].includes(new Date(y,m-1,d).getDay()))schedule.holidays.push(d);
renderSchedule();$('#schedule-feedback').textContent='';
}
function generate(){
try{
if(!requireSavedRules())return;
if(schedule.rules.some(r=>r.special&&!r.locked))throw new Error('請先排好並鎖定所有特殊人員，再編其餘籤組。');
const plan=buildSchedulePlan({total:daysInMonth(),people:schedule.people,rules:schedule.rules,assignments:schedule.assignments,holidays:schedule.holidays});
schedule.assignments=plan;renderSchedule();feedback('其餘籤組已編排，特殊人員鎖定日期保持不變。');
}catch(error){feedback(error.message,true)}
}
function renderSchedule(){
const [y,m]=schedule.month.split('-').map(Number),total=daysInMonth(),n=schedule.people;
const missing=Array.from({length:total},(_,i)=>i).filter(i=>!Number.isInteger(schedule.assignments[i])).length;
$('#allocation').textContent=`本月 ${total} 天，${n} 人；尚有 ${missing} 天待排。特殊人員依固定天數，其餘組盡量平均分配。`;
$('#calendar-title').textContent=`${y} 年 ${m} 月`;$('#calendar').replaceChildren();
for(let i=0;i<(new Date(y,m-1,1).getDay()+6)%7;i++)$('#calendar').append(element('div'));
for(let d=1;d<=total;d++){
const owner=schedule.assignments[d-1],locked=Number.isInteger(owner)&&schedule.rules[owner].locked;
const cell=element('div',null,'day'+(schedule.holidays.includes(d)?' holiday':''));
const date=element('button',String(d)+(locked?' 🔒':''),'date-button');date.title='切換這一天是否為假日';date.setAttribute('aria-label',`${m}月${d}日，切換假日`);
date.onclick=()=>{if(!requireSavedRules())return;const adding=!schedule.holidays.includes(d);if(adding&&Number.isInteger(owner)&&schedule.rules[owner].noHolidays){feedback('這天已排給不排假日的人員，請先解鎖並移開該日值班，再改成假日。',true);return}schedule.holidays=adding?[...schedule.holidays,d]:schedule.holidays.filter(v=>v!==d);renderSchedule()};cell.append(date);
const select=element('select');select.setAttribute('aria-label',`${d}日籤組`);select.add(new Option('待安排',''));select.disabled=locked;
for(let g=0;g<n;g++){const option=new Option(`${String.fromCharCode(65+g)} 籤${schedule.names[g]?'・'+schedule.names[g]:''}`,g);option.disabled=!canChangeDay(d,g)&&g!==owner;select.add(option)}
select.value=owner??'';select.onchange=()=>{if(!changeDay(d,select.value===''?null:Number(select.value)))select.value=owner??''};cell.append(select);$('#calendar').append(cell);
}
$('#groups').replaceChildren();for(let g=0;g<n;g++){
const ds=datesFor(g),row=element('div',null,'group');const name=element('input');name.placeholder='填入姓名';name.setAttribute('aria-label',`${String.fromCharCode(65+g)}籤姓名`);name.value=schedule.names[g]||'';name.disabled=schedule.rules[g].locked;
name.onchange=()=>{if(!requireSavedRules()){name.value=schedule.names[g]||'';return}schedule.names[g]=name.value.trim();renderSchedule()};
row.append(element('strong',String.fromCharCode(65+g)+(schedule.rules[g].locked?' 🔒':' 籤')),name,element('span',ds.length?ds.join('、')+' 日':'尚未編排'),element('small',`${ds.length} 天／假日 ${ds.filter(d=>schedule.holidays.includes(d)).length} 天`));$('#groups').append(row);
}
save('lk-schedule',schedule);renderTraditional();renderRules();
}
$('#month').onchange=resetMonth;$('#people').onchange=resetMonth;$('#generate').onclick=generate;$('#prepare-special').onclick=planSpecial;
$('#add-special').onclick=()=>{const value=$('#special-group').value,g=Number(value);if(value===''||!Number.isInteger(g)||g<0||g>=schedule.people||schedule.rules[g].special){feedback('請選擇尚未設定特殊需求的組別。');return}schedule.rules[g].special=true;renderSchedule();const detail=[...document.querySelectorAll('.special-person')].find(e=>Number(e.dataset.group)===g);if(detail)detail.open=true};
if(!schedule.holidays.length&&!schedule.assignments.length&&!schedule.rules.some(r=>r.special)){
const [y,m]=schedule.month.split('-').map(Number);for(let d=1;d<=daysInMonth();d++)if([0,6].includes(new Date(y,m-1,d).getDay()))schedule.holidays.push(d);
}
renderSchedule();
