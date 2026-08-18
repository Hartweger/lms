import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('/Users/natasahartweger/Documents/Claude/sajt/LMS/lms/.env.local','utf8')
  .split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY

async function q(path){
  const r = await fetch(`${URL}/rest/v1/${path}`, {headers:{apikey:KEY, Authorization:`Bearer ${KEY}`}})
  if(!r.ok) throw new Error(path+' -> '+r.status+' '+await r.text())
  return r.json()
}
async function all(table, select, extra=''){
  let out=[], from=0, step=1000
  for(;;){
    const r = await fetch(`${URL}/rest/v1/${table}?select=${select}${extra}`, {headers:{apikey:KEY, Authorization:`Bearer ${KEY}`, Range:`${from}-${from+step-1}`}})
    if(!r.ok) throw new Error(table+' -> '+r.status+' '+await r.text())
    const j = await r.json(); out=out.concat(j); if(j.length<step) break; from+=step
  }
  return out
}

const courses = await all('courses','id,slug,title')
const cmap = Object.fromEntries(courses.map(c=>[c.id,c.slug||c.title]))
const lessons = await all('lessons','id,course_id,order_index,title,sections')
const exercises = await all('exercises','id,lesson_id,title,exercise_type,order_index')
const eqs = await all('exercise_questions','id,exercise_id,question,question_type,options,correct_answer')
console.error(`kurseva ${courses.length}, lekcija ${lessons.length}, vezbi ${exercises.length}, pitanja ${eqs.length}`)

const INSEP = ['be','emp','ent','er','ge','miss','ver','zer','wider']
const SEP = ['ab','an','auf','aus','bei','ein','mit','nach','vor','zu','zurück','zurueck','weg','los','her','hin','fest','statt','teil','zusammen','fern','frei','heim','nieder','empor','vorbei','vorbei','entlang','aufeinander','durcheinander','kennen','spazieren','wieder','wegkennen']
const REFL = ['mich','dich','sich','uns','euch','mir','dir']

function blanks(q){ return (q.match(/_{2,}/g)||[]).length }
function parts(a){
  return String(a).split(/\s*(?:…|\.\.\.|…)\s*/).map(s=>s.trim()).filter(Boolean)
}
function hintVerb(q){
  const m = String(q).match(/\(([^)]*)\)\s*$/)
  if(!m) return null
  let v = m[1].trim()
  v = v.replace(/^sich\s+/,'').split(/[,;/]/)[0].trim()
  return /^[a-zäöüß]+$/i.test(v) ? v : null
}
function words(s){ return (String(s).toLowerCase().match(/[a-zäöüß]+/g)||[]) }

const findings = []
function add(f){ findings.push(f) }

// --- spoiler sekcije ---
for(const l of lessons){
  const secs = Array.isArray(l.sections)? l.sections : []
  secs.forEach((s,i)=>{
    if(s?.type!=='spoiler' || !Array.isArray(s.items)) return
    const secTitle = s.title||''
    s.items.forEach((it,j)=>{
      const Q = it.question||'', A = it.answer||''
      const nb = blanks(Q)
      if(nb===0) return
      const ap = parts(A)
      const loc = {kurs:cmap[l.course_id], lekcija:l.title, oi:l.order_index, lesson_id:l.id, gde:`sections[${i}] "${secTitle}" item ${j}`, Q, A}
      // 1. broj praznina vs delovi resenja
      if(ap.length !== nb && !/^(Richtig|Falsch)/i.test(A)){
        // ako resenje ima zarez-listu, probaj i to
        const cp = String(A).split(/\s*,\s*/).filter(Boolean)
        if(cp.length !== nb) add({tip:'BROJ_PRAZNINA', detalj:`${nb} praznina, ${ap.length} deo/delova rešenja`, ...loc})
      }
      // 2. rec iz resenja vec postoji u recenici
      const qw = words(Q.replace(/\([^)]*\)\s*$/,''))
      for(const p of ap){
        const pw = words(p)
        for(const w of pw){
          if(w.length>1 && qw.includes(w)) add({tip:'DUPLA_REC', detalj:`„${w}" je već napisano u rečenici, a stoji i u rešenju`, ...loc})
        }
      }
      // 3. neodvojiv glagol prikazan kao razdvojiv
      const v = hintVerb(Q)
      if(v && ap.length>1){
        const pre = INSEP.find(p=>v.toLowerCase().startsWith(p) && !SEP.some(sp=>v.toLowerCase().startsWith(sp)))
        if(pre) add({tip:'NEODVOJIV_KAO_RAZDVOJIV', detalj:`„${v}" ima neodvojiv prefiks „${pre}-", a rešenje ga cepa na ${ap.length} dela`, ...loc})
        else if(REFL.includes(ap[ap.length-1].toLowerCase())) add({tip:'ZAMENICA_KAO_PREFIKS', detalj:`u drugu prazninu ide povratna zamenica „${ap[ap.length-1]}", nije prefiks`, ...loc})
      }
      // 4. naslov kaze razdvojivi, a glagol nije
      if(/razdvoj|trennbar/i.test(secTitle) && v){
        const pre = INSEP.find(p=>v.toLowerCase().startsWith(p) && !SEP.some(sp=>v.toLowerCase().startsWith(sp)))
        if(pre) add({tip:'NASLOV_RAZDVOJIVI_ALI_NIJE', detalj:`sekcija „${secTitle}", a „${v}" nije razdvojiv (${pre}-)`, ...loc})
      }
    })
  })
}

// --- exercise_questions ---
const exById = Object.fromEntries(exercises.map(e=>[e.id,e]))
const lById = Object.fromEntries(lessons.map(l=>[l.id,l]))
for(const q0 of eqs){
  const ex = exById[q0.exercise_id]; if(!ex) continue
  const l = lById[ex.lesson_id]; if(!l) continue
  const Q = q0.question||'', A = q0.correct_answer||''
  const nb = blanks(Q); if(nb===0) continue
  if(q0.question_type!=='fill_blank') continue
  const cp = String(A).split(/\s*,\s*/).map(s=>s.trim()).filter(Boolean)
  const loc = {kurs:cmap[l.course_id], lekcija:l.title, oi:l.order_index, lesson_id:l.id, gde:`vežba "${ex.title}" (${ex.exercise_type}) q=${q0.id}`, Q, A}
  if(cp.length!==nb) add({tip:'VEZBA_BROJ_PRAZNINA', detalj:`${nb} praznina, ${cp.length} odgovora`, ...loc})
  const bad = (Q.match(/_{2,}/g)||[]).filter(b=>b!=='______')
  if(bad.length) add({tip:'VEZBA_MARKER', detalj:`marker nije ______ nego ${[...new Set(bad)].map(b=>b.length+' crta').join(', ')}`, ...loc})
  const qw = words(Q.replace(/\([^)]*\)\s*$/,''))
  for(const p of cp) for(const w of words(p)) if(w.length>1 && qw.includes(w))
    add({tip:'VEZBA_DUPLA_REC', detalj:`„${w}" već postoji u rečenici`, ...loc})
}

fs.writeFileSync('/private/tmp/claude-501/-Users-natasahartweger-Documents-Claude-sajt/d9bd58be-da95-4e73-9f84-a2cb785569b9/scratchpad/nalazi.json', JSON.stringify(findings,null,2))
const byTip = {}
for(const f of findings) byTip[f.tip]=(byTip[f.tip]||0)+1
console.log(JSON.stringify(byTip,null,2))
console.log('ukupno', findings.length)
