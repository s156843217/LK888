// 排班只在本機計算；先滿足不能值班、固定天數與鎖定日期，再比較分散程度。
function swapScheduleGroups(schedule, from, to) {
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=schedule.people||to>=schedule.people)throw new Error('請選擇有效的組別。');
  const names=Array.from({length:schedule.people},(_,g)=>schedule.names[g]||'');
  const rules=[...schedule.rules];
  [names[from],names[to]]=[names[to],names[from]];
  [rules[from],rules[to]]=[rules[to],rules[from]];
  return {...schedule,names,rules,assignments:schedule.assignments.map(g=>g===from?to:g===to?from:g)};
}
function lockSpecialPerson(state, group, total) {
  if(!state.rules[group]?.special)throw new Error('請先新增這位特殊人員並儲存設定。');
  const rule=state.rules[group];
  let assignments=[...state.assignments];
  let dates=Array.from({length:total},(_,i)=>i+1).filter(d=>assignments[d-1]===group);
  if(!dates.length){
    const plan=buildSchedulePlan({total,people:state.people,rules:state.rules,assignments,holidays:state.holidays});
    assignments=plan.map(g=>state.rules[g].special?g:null);
    dates=Array.from({length:total},(_,i)=>i+1).filter(d=>assignments[d-1]===group);
  }
  if(!dates.length)throw new Error('這位同事尚未排到日期，請檢查天數與限制。');
  if(dates.some(d=>rule.blocked.includes(d)||(rule.noHolidays&&state.holidays.includes(d))))throw new Error('目前預排日期與不能值班條件衝突，請先按「先排特殊人員」重新安排。');
  if(rule.target!==null&&dates.length!==rule.target)throw new Error(`目前預排 ${dates.length} 天，與固定 ${rule.target} 天不符，請先重新預排。`);
  const rules=state.rules.map((r,g)=>g===group?{...r,target:dates.length,locked:true}:r);
  return {...state,assignments,rules};
}
function buildSchedulePlan(config) {
  const {total, people, assignments, holidays} = config;
  const rules = config.rules.map(r=>({...r,blocked:[...new Set([...r.blocked,...(r.noHolidays?holidays:[])])]}));
  const fixed = Array(total).fill(null), used = Array(people).fill(0);
  const low = Math.floor(total / people), high = Math.ceil(total / people);
  for (let g = 0; g < people; g++) {
    const rule = rules[g];
    if (rule.locked) {
      assignments.forEach((owner, i) => {
        if (i < total && owner === g) { fixed[i] = g; used[g]++; }
      });
      if (used[g] !== rule.target) throw new Error(`${String.fromCharCode(65+g)} 組鎖定天數與設定不符，請先解鎖檢查。`);
    }
    if (fixed.some((owner, i) => owner === g && rule.blocked.includes(i+1)))
      throw new Error('鎖定日期與不能值班日期衝突，請先解鎖修改。');
  }
  const caps = Array(people).fill(0), possibilities = [];
  function capacities(g, remaining) {
    if (g === people) { if (!remaining) possibilities.push([...caps]); return; }
    const r = rules[g], choices = r.special && r.target !== null ? [r.target] : [...new Set([low, high])];
    for (const c of choices) {
      if (c < used[g] || c > total || c < 0 || c > remaining) continue;
      if (total - r.blocked.length < c) continue;
      caps[g] = c; capacities(g+1, remaining-c);
    }
  }
  capacities(0,total);
  if (!possibilities.length) throw new Error('天數無法分配：請檢查固定天數、可值班日期，或調整參與人數。');
  let best = null, bestScore = Infinity;
  // 以日期和可用名額配對，找得到完整方案才更新畫面，失敗時保留原班表。
  for (const capacity of possibilities) for (let trial=0; trial<3; trial++) {
    const slots=[];
    capacity.forEach((c,g)=>{for(let i=used[g];i<c;i++)slots.push(g)});
    const owners=Array(slots.length).fill(-1);
    const dates=Array.from({length:total},(_,i)=>i).filter(i=>fixed[i]===null);
    const options=dates.reduce((map,d)=>{
      map[d]=slots.map((g,s)=>({g,s,key:Math.random()})).filter(x=>!rules[x.g].blocked.includes(d+1)).sort((a,b)=>a.key-b.key).map(x=>x.s);return map;
    },{});
    dates.sort((a,b)=>options[a].length-options[b].length);
    function match(d,seen) {
      for(const s of options[d]) {
        if(seen.has(s))continue;seen.add(s);
        if(owners[s]===-1||match(owners[s],seen)){owners[s]=d;return true}
      }
      return false;
    }
    if(!dates.every(d=>match(d,new Set())))continue;
    const plan=[...fixed];owners.forEach((d,s)=>{if(d>=0)plan[d]=slots[s]});
    function score(a) {
      const holidayCounts=Array(people).fill(0);let value=0;
      for(let g=0;g<people;g++) {
        const ds=a.map((owner,i)=>owner===g?i+1:0).filter(Boolean);
        ds.forEach(d=>{if(holidays.includes(d))holidayCounts[g]++});
        const gap=total/(ds.length||1);
        for(let i=1;i<ds.length;i++)value+=(ds[i]-ds[i-1]-gap)**2;
        if(ds.length)value+=(ds[0]-gap/2)**2+(total+.5-ds[ds.length-1]-gap/2)**2;
      }
      const avg=holidays.length/people;
      return value+holidayCounts.reduce((sum,c)=>sum+(c-avg)**2*25,0);
    }
    // 交換未鎖定的日期，改善假日公平與間隔，同時保留所有限制。
    let current=score(plan);
    for(let k=0;k<220;k++) {
      const a=Math.floor(Math.random()*total),b=Math.floor(Math.random()*total),ga=plan[a],gb=plan[b];
      if(ga===gb||fixed[a]!==null||fixed[b]!==null||rules[ga].blocked.includes(b+1)||rules[gb].blocked.includes(a+1))continue;
      [plan[a],plan[b]]=[gb,ga];const next=score(plan);
      if(next<=current)current=next;else [plan[a],plan[b]]=[ga,gb];
    }
    if(current<bestScore){bestScore=current;best=plan}
  }
  if(!best)throw new Error('目前限制無法排滿整月，請減少不能值班日期或調整固定天數。原班表已保留。');
  return best;
}
