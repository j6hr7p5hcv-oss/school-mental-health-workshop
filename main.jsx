import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";
import { Activity, ArrowLeft, ArrowRight, BarChart3, Check, Copy, Download, ExternalLink, Eye, EyeOff, LockKeyhole, LogOut, Monitor, Radio, RefreshCw, ShieldCheck, Smartphone, Users } from "lucide-react";
import { questions, factorLabels, leadershipDomains } from "./questions";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({length:6},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join("");
const getRoom = () => new URLSearchParams(location.search).get("room")?.toUpperCase() || "";
const pct = (n,total) => total ? Math.round(n/total*100) : 0;

function App(){
  const [tab,setTab] = useState(getRoom() ? "join" : "home");
  const [roomCode,setRoomCode] = useState(getRoom());
  const [room,setRoom] = useState(null);
  const [participant,setParticipant] = useState(null);
  const [activeQuestion,setActiveQuestion] = useState(null);
  const [answers,setAnswers] = useState({});
  const [responses,setResponses] = useState([]);
  const [submitted,setSubmitted] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [adminPassword,setAdminPassword] = useState("");
  const [adminUnlocked,setAdminUnlocked] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const [roomTitle,setRoomTitle] = useState("School Mental Health Leadership Workshop");
  const [moderatorPin,setModeratorPin] = useState("");
  const [participantCount,setParticipantCount] = useState(0);\n  const [showFinalReport,setShowFinalReport] = useState(false);

  const ready = !!supabase;
  const publicJoinUrl = useMemo(()=>room ? `${location.origin}${location.pathname}?room=${room.code}` : "",[room]);

  useEffect(()=>{
    if(!ready) return;
    if(getRoom()) loadRoom(getRoom());
  },[ready]);

  async function loadRoom(code){
    setError(""); setBusy(true);
    const {data,error} = await supabase.from("workshop_rooms").select("*").eq("code",code).maybeSingle();
    setBusy(false);
    if(error || !data){setError("Workshop code not found. Please check the QR code or ask the moderator.");return;}
    setRoom(data);
    setActiveQuestion(data.active_question);
    setTab("join");
    subscribeRoom(data.id);
  }
  function subscribeRoom(id){
    supabase.channel("room-"+id)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"workshop_rooms",filter:`id=eq.${id}`},payload=>{
        setRoom(payload.new); setActiveQuestion(payload.new.active_question);
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"workshop_responses",filter:`room_id=eq.${id}`},()=>refreshResponses(id))
      .subscribe();
  }
  async function refreshResponses(id=room?.id){
    if(!id)return;
    const {data} = await supabase.from("workshop_responses").select("question_id,choice,participant_token,created_at").eq("room_id",id);
    setResponses(data||[]);
    setParticipantCount(new Set((data||[]).map(x=>x.participant_token)).size);
  }
  useEffect(()=>{if(room?.id) refreshResponses(room.id)},[room?.id]);

  async function createRoom(){
    setBusy(true);setError("");
    const {data,error}=await supabase.functions.invoke("create-room",{body:{title:roomTitle,pin:moderatorPin}});
    setBusy(false);
    const roomData=data?.room;
    if(error || !roomData){setError(error?.message || data?.error || "Could not create workshop room.");return;}
    setRoom(roomData);setAdminPassword(moderatorPin);setResponses([]);setActiveQuestion(0);setAdminUnlocked(true);setTab("moderator");subscribeRoom(roomData.id);
    history.replaceState({}, "", `${location.pathname}?room=${roomData.code}`);
  }
  async function enterRoom(){
    setBusy(true);setError("");
    await loadRoom(roomCode.trim().toUpperCase());
  }
  async function unlockModerator(){
    if(!room){setError("Create or open a workshop first.");return;}
    const {data,error}=await supabase.functions.invoke("moderator-action",{body:{room_id:room.id,pin:adminPassword,action:"verify"}});
    if(error||!data?.ok){setError("Incorrect moderator PIN.");return;}
    setAdminUnlocked(true);setTab("moderator");await refreshResponses(room.id);
  }
  async function updateRoom(patch){
    const {data,error}=await supabase.functions.invoke("moderator-action",{body:{room_id:room.id,pin:adminPassword,action:"update",patch}});
    if(error || !data?.room){setError(error?.message || data?.error || "Moderator action failed.");return;}
    setRoom(data.room);setActiveQuestion(data.room.active_question);
  }
  async function releaseQuestion(n){
    await updateRoom({active_question:n,status:n===0?"lobby":n>questions.length?"finished":"live"});
    setNotice(n===0?"Lobby opened.":n>questions.length?"Workshop completed.":`Question ${n} is now live.`);
  }
  async function submitAnswer(){
    if(!participant || !room || !activeQuestion)return;
    const q=questions[activeQuestion-1];
    const value=answers[activeQuestion];
    if(!value || (q.type==="multi" && value.length!==2)){setError(q.type==="multi"?"Please select exactly two options.":"Please choose an answer.");return;}
    setBusy(true);setError("");
    const token=participant;
    const rows=(Array.isArray(value)?value:[value]).map(choice=>({room_id:room.id,question_id:activeQuestion,choice,participant_token:token}));
    const {error}=await supabase.from("workshop_responses").insert(rows);
    setBusy(false);
    if(error){setError(error.code==="23505"?"Your answer for this question has already been submitted.":"Could not submit: "+error.message);return;}
    setSubmitted(true);setNotice("Your answer has been submitted.");
  }
  function toggleChoice(qid,letter){
    const q=questions[qid-1];
    if(q.type==="single"){setAnswers(a=>({...a,[qid]:letter}));return;}
    setAnswers(a=>{
      const old=a[qid]||[];
      const next=old.includes(letter)?old.filter(x=>x!==letter):old.length<2?[...old,letter]:old;
      return {...a,[qid]:next};
    });
  }
  function joinAsParticipant(){
    const token=crypto.randomUUID();
    setParticipant(token);setAnswers({});setSubmitted(false);setTab("participant");setError("");
  }
  const currentQ=activeQuestion>=1&&activeQuestion<=12?questions[activeQuestion-1]:null;
  const qResponses=responses.filter(r=>r.question_id===activeQuestion);
  const totalParticipants=participantCount;
  const currentCounts=currentQ?currentQ.options.map(([letter])=>({letter,count:qResponses.filter(r=>r.choice===letter).length})):[];
  const factorResponses = responses.filter(r=>r.question_id>=1 && r.question_id<=6);
  const factorTotal = factorResponses.length;
  const factorResults = factorLabels.map(f=>({
    ...f,
    count: factorResponses.filter(r=>questions[r.question_id-1]?.factorMap?.[r.choice]===f.id).length
  }));
  const leadershipResponses = responses.filter(r=>r.question_id>=7 && r.question_id<=12);
  const leadershipTotal = leadershipResponses.length;
  const leadershipResults = leadershipDomains.map(d=>{
    const domainQuestion = questions.find(q=>q.domain===d.id);
    const domainResponses = leadershipResponses.filter(r=>r.question_id===domainQuestion?.id);
    const correct = domainResponses.filter(r=>r.choice===domainQuestion?.correct).length;
    return {...d, correct, total:domainResponses.length, score:pct(correct,domainResponses.length)};
  });
  const leadershipCorrect = leadershipResponses.filter(r=>questions[r.question_id-1]?.correct===r.choice).length;
  const leadershipAverage = pct(leadershipCorrect,leadershipTotal);
  const topFactor = [...factorResults].sort((a,b)=>b.count-a.count)[0];
  const lowestLeadership = [...leadershipResults].filter(d=>d.total>0).sort((a,b)=>a.score-b.score)[0];

  if(!ready) return <SetupScreen/>;

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setTab("home")}}><span className="brand-icon"><Activity size={20}/></span><span>LEADING SCHOOL MENTAL HEALTH<small>LEADERSHIP WORKSHOP</small></span></a>
      <div className="top-actions"><span className="live-dot"></span><span>Workshop platform</span></div>
    </header>
    <main className="container">
      {error&&<div className="alert error">{error}<button onClick={()=>setError("")}>×</button></div>}
      {notice&&<div className="alert success">{notice}<button onClick={()=>setNotice("")}>×</button></div>}

      {tab==="home"&&<section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">INTERACTIVE CASE STUDY</span>
          <h1>Lead with care.<br/><em>Decide with evidence.</em></h1>
          <p>A live, anonymous workshop exploring factors that may influence student wellbeing and the leadership practices schools can use to respond. Participants answer from their own devices while the moderator releases each question and reviews collective results.</p>
          <div className="hero-buttons"><button className="btn primary" onClick={()=>setTab("create")}>Create a workshop <ArrowRight size={17}/></button><button className="btn secondary" onClick={()=>setTab("join")}>Join a workshop</button></div>
          <div className="feature-row"><span><ShieldCheck/> Anonymous participation</span><span><Radio/> Live results</span><span><BarChart3/> Visual analytics</span></div>
        </div>
        <div className="hero-card"><div className="mock-top"><span></span><span></span><span></span><b>LIVE SESSION PREVIEW</b></div><div className="mock-content"><div className="mock-label">QUESTION 05 / 12</div><h3>Which indicators should school leaders use to evaluate progress?</h3>{["Examination results only","Attendance, student feedback, safety and teacher confidence","Number of school events only"].map((x,i)=><div className={"mock-option "+(i===1?"selected":"")} key={x}><b>{String.fromCharCode(65+i)}</b>{x}</div>)}<div className="mock-chart"><span style={{height:"38%"}}/><span style={{height:"85%"}}/><span style={{height:"53%"}}/><span style={{height:"24%"}}/><span style={{height:"66%"}}/></div><small>Illustrative dashboard preview</small></div></div>
      </section>}

      {tab==="create"&&<section className="narrow panel">
        <button className="back" onClick={()=>setTab("home")}><ArrowLeft size={16}/> Back</button><span className="eyebrow">MODERATOR SETUP</span><h2>Create a workshop room</h2><p className="muted">Create a room and share its QR code or six-character code with participants.</p>
        <label>Workshop title<input value={roomTitle} onChange={e=>setRoomTitle(e.target.value)} /></label>
        <label>Moderator PIN <input type="password" value={moderatorPin} onChange={e=>setModeratorPin(e.target.value)} placeholder="Create a private PIN" /></label>
        <p className="hint">Keep this PIN private. It is used to control the session.</p>
        <button className="btn primary full" disabled={busy||moderatorPin.length<6} onClick={createRoom}>{busy?"Creating…":"Create workshop room"} <ArrowRight size={17}/></button>
      </section>}

      {tab==="join"&&<section className="narrow panel">
        <button className="back" onClick={()=>setTab("home")}><ArrowLeft size={16}/> Back</button><span className="eyebrow">PARTICIPANT ACCESS</span><h2>Join the workshop</h2><p className="muted">Enter the code shown by your moderator. No account or personal name is required.</p>
        <label>Workshop code<input className="code-input" maxLength="6" value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder="E.G. 7KQ2MP"/></label>
        <button className="btn primary full" disabled={busy||roomCode.trim().length!==6} onClick={enterRoom}>{busy?"Checking…":"Continue"} <ArrowRight size={17}/></button>
        {room&&<div className="room-found"><Check/> Connected to: {room.title}<button className="btn primary full" onClick={joinAsParticipant}>Join anonymously</button></div>}
      </section>}

      {tab==="participant"&&<section className="narrow">
        <div className="participant-head"><span className="eyebrow">ANONYMOUS PARTICIPANT</span><span className="pill"><span className="live-dot"></span>{room?.status==="live"?"LIVE":"WAITING"}</span><h2>{room?.title}</h2><p className="muted">Your responses are anonymous. The next question will appear when the moderator releases it.</p></div>
        {!currentQ&&<div className="waiting panel"><div className="pulse-icon"><Radio size={28}/></div><h3>{room?.status==="finished"?"Thank you for participating!":"Waiting for the moderator"}</h3><p className="muted">{room?.status==="finished"?"The workshop has ended.":"Please stay on this page. A question will appear here when the moderator starts the activity."}</p></div>}
        {currentQ&&<div className="panel question-panel"><div className="question-meta"><span>QUESTION {currentQ.id} OF 12</span><span>{currentQ.section}</span></div><div className="progress"><span style={{width:`${currentQ.id/12*100}%`}}/></div><h2>{currentQ.prompt}</h2>{currentQ.type==="multi"&&<p className="hint">Choose exactly TWO answers.</p>}<div className="options">{currentQ.options.map(([letter,text])=>{const chosen=(answers[currentQ.id]||[]).includes?.(letter)||answers[currentQ.id]===letter;return <button disabled={submitted} className={"option "+(chosen?"chosen":"")} onClick={()=>toggleChoice(currentQ.id,letter)} key={letter}><b>{letter}</b><span>{text}</span>{chosen&&<Check size={18}/>}</button>})}</div>{submitted?<div className="submitted"><Check/> Answer submitted. Please wait for the next question.</div>:<button className="btn primary full" disabled={busy||!answers[currentQ.id]||(currentQ.type==="multi"&&answers[currentQ.id].length!==2)} onClick={submitAnswer}>{busy?"Submitting…":"Submit answer"}</button>}</div>}
      </section>}

      {tab==="moderator"&&room&&<section>
        {!adminUnlocked?<div className="narrow panel"><span className="eyebrow">MODERATOR ACCESS</span><h2>Unlock dashboard</h2><label>Moderator PIN<input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)}/></label><button className="btn primary full" onClick={unlockModerator}>Unlock dashboard</button></div>:
        <div className="dashboard">
          <div className="dashboard-title"><div><span className="eyebrow">MODERATOR CONTROL ROOM</span><h2>{room.title}</h2><p className="muted">Room code <b>{room.code}</b> · {room.status}</p></div><button className="btn secondary" onClick={()=>{setAdminUnlocked(false);setTab("home")}}><LogOut size={16}/> Exit</button></div>
          <div className="stats"><div className="stat-card"><Users/><span>Participants</span><strong>{totalParticipants}</strong></div><div className="stat-card"><Activity/><span>Responses</span><strong>{responses.length}</strong></div><div className="stat-card"><Radio/><span>Question</span><strong>{activeQuestion||"—"} / 12</strong></div></div>
          <div className="dash-grid">
            <div className="panel controls"><div className="panel-title"><Monitor/><h3>Session controls</h3></div><div className="share-box"><div><b>Participant join link</b><small>Scan the QR code or share this link</small></div><QRCodeSVG value={publicJoinUrl} size={138} level="H" includeMargin/><button className="btn secondary full" onClick={()=>navigator.clipboard.writeText(publicJoinUrl)}><Copy size={16}/> Copy join link</button><div className="room-code">{room.code}</div></div><div className="control-actions"><button className="btn secondary full" onClick={()=>releaseQuestion(0)}>Open lobby</button>{questions.map(q=><button key={q.id} className={`question-control ${activeQuestion===q.id?"active":""}`} onClick={()=>releaseQuestion(q.id)}>Q{q.id}<span>{q.section}</span></button>)}<button className="btn primary full" onClick={()=>releaseQuestion(13)}>End workshop</button></div></div>
            <div className="panel results"><div className="panel-title"><BarChart3/><h3>Live response results</h3><span className="pill"><span className="live-dot"/> LIVE</span></div>
              {currentQ?<><div className="result-question"><span className="eyebrow">QUESTION {currentQ.id} · {currentQ.section}</span><h3>{currentQ.prompt}</h3><small>{qResponses.length} selections received · {totalParticipants} participants joined</small></div><div className="bar-results">{currentCounts.map(({letter,count})=>{const option=currentQ.options.find(o=>o[0]===letter);const denominator=currentQ.type==="multi"?Math.max(1,qResponses.length):Math.max(1,totalParticipants);return <div className="bar-item" key={letter}><div className="bar-label"><b>{letter}. {option[1]}</b><span>{count} · {pct(count,denominator)}%</span></div><div className="bar-track"><span style={{width:`${pct(count,denominator)}%`}}/></div></div>})}</div><div className="result-note">Results are descriptive, not a clinical assessment or a measure of individual competence.</div></>:<div className="waiting compact"><Radio size={26}/><h3>{room.status==="finished"?"Workshop ended":"No question is live"}</h3><p className="muted">Select a question in Session Controls to display it to participants and start collecting answers.</p></div>}
            </div>
          </div>
          {room.status==="finished"&&<div className="final-report-entry panel">
            <div><span className="eyebrow">WORKSHOP COMPLETE</span><h3>Generate the collective findings report</h3><p className="muted">Analyse participants' factor selections and their alignment with six evidence-informed leadership practices.</p></div>
            <button className="btn primary" onClick={()=>setShowFinalReport(v=>!v)}><BarChart3 size={17}/>{showFinalReport?"Hide final report":"View final report"}</button>
          </div>}
          {room.status==="finished"&&showFinalReport&&<FinalReport
            factorResults={factorResults}
            factorTotal={factorTotal}
            leadershipResults={leadershipResults}
            leadershipTotal={leadershipTotal}
            leadershipAverage={leadershipAverage}
            topFactor={topFactor}
            lowestLeadership={lowestLeadership}
            participantCount={participantCount}
          />}
        </div>}
      </section>}
    </main>
    <footer><span>LEADING SCHOOL MENTAL HEALTH</span><span>Respect privacy · Protect safety · Lead collaboratively</span></footer>
  </div>;
}

function FinalReport({factorResults,factorTotal,leadershipResults,leadershipTotal,leadershipAverage,topFactor,lowestLeadership,participantCount}){
  const maxFactor=Math.max(1,...factorResults.map(x=>x.count));
  const answeredDomains=leadershipResults.filter(x=>x.total>0);
  return <section className="final-report">
    <div className="report-heading">
      <div><span className="eyebrow">COLLECTIVE WORKSHOP ANALYSIS</span><h2>School Mental Health: Factors & Leadership Priorities</h2><p className="muted">Generated from submitted anonymous responses. Results describe this workshop group only.</p></div>
      <div className="report-stamp"><BarChart3 size={22}/><b>DATA-DRIVEN<br/>SUMMARY</b></div>
    </div>
    <div className="report-metrics">
      <div className="report-metric"><span>Participants</span><strong>{participantCount}</strong></div>
      <div className="report-metric"><span>Factor responses</span><strong>{factorTotal} / {participantCount*6}</strong></div>
      <div className="report-metric"><span>Leadership responses</span><strong>{leadershipTotal} / {participantCount*6}</strong></div>
      <div className="report-metric"><span>Leadership alignment</span><strong>{leadershipTotal?`${leadershipAverage}%`:"—"}</strong></div>
    </div>
    <div className="report-grid">
      <article className="report-card">
        <div className="report-card-title"><span className="report-index">01</span><div><h3>Perceived influencing factors</h3><p>How often each factor was selected in Questions 1–6</p></div></div>
        {factorTotal===0?<p className="muted">No factor responses have been submitted.</p>:<div className="report-bars">{factorResults.map(f=><div className="report-bar-row" key={f.id}>
          <div className="report-bar-top"><b>{f.label}</b><strong>{f.count} <small>({pct(f.count,factorTotal)}%)</small></strong></div>
          <div className="report-track"><span style={{width:`${pct(f.count,factorTotal)}%`}}/></div>
          <small className="report-description">{f.description}</small>
        </div>)}</div>}
        <p className="report-footnote">Share of all factor selections. Each submitted response contributes one selection; this is not a measure of how common a condition is among students.</p>
      </article>
      <article className="report-card">
        <div className="report-card-title"><span className="report-index">02</span><div><h3>Leadership practice alignment</h3><p>Share choosing the recommended response in Questions 7–12</p></div></div>
        {leadershipTotal===0?<p className="muted">No leadership responses have been submitted.</p>:<div className="report-bars">{leadershipResults.map(d=><div className="report-bar-row" key={d.id}>
          <div className="report-bar-top"><b>{d.label}</b><strong>{d.total?`${d.score}%`:"—"}</strong></div>
          <div className="report-track leadership-track"><span style={{width:`${d.score}%`}}/></div>
          <small className="report-description">{d.total?`${d.correct} of ${d.total} responses selected the recommended practice.`:"No responses yet."} {d.description}</small>
        </div>)}</div>}
        <p className="report-footnote">This is response alignment on workshop scenarios, not a validated measure of a participant's leadership competence or school effectiveness.</p>
      </article>
    </div>
    <article className="report-card report-interpretation">
      <div className="report-card-title"><span className="report-index">03</span><div><h3>Discussion prompts generated from the results</h3><p>Use these patterns to guide the workshop debrief.</p></div></div>
      {factorTotal>0&&topFactor?<p><b>Most frequently selected factor:</b> {topFactor.label} ({topFactor.count} of {factorTotal} factor selections, {pct(topFactor.count,factorTotal)}%). Ask participants what school-level evidence could help the school understand this concern more clearly.</p>:<p>Collect factor responses to identify the most frequently selected influencing factor.</p>}
      {lowestLeadership?<p><b>Leadership practice to discuss:</b> {lowestLeadership.label} had the lowest recommended-response alignment ({lowestLeadership.score}% of {lowestLeadership.total} responses). Explore what training, procedures or resources could strengthen this area.</p>:<p>Collect leadership responses to identify which practice areas may need further discussion.</p>}
      <p><b>Next step:</b> Agree on one realistic action, a responsible person, a review date and a safe indicator of progress.</p>
    </article>
    <div className="report-caution"><ShieldCheck size={18}/><p><b>Interpret carefully.</b> These questions capture participants' views about scenarios and their selected leadership responses. They do not diagnose students, establish causes of mental health difficulties, or measure the prevalence of mental health concerns. Consider local context, student voice and appropriate professional guidance before making school-wide decisions.</p></div>
  </section>;
}

function SetupScreen(){return <div className="setup-screen"><div className="setup-card"><span className="eyebrow">ONE-TIME SETUP REQUIRED</span><h1>Connect your shared workshop database</h1><p>This website package is ready to configure, but it needs your Supabase project URL and public anon/publishable key before participants on separate devices can share live results.</p><ol><li>Create a Supabase project.</li><li>Run the SQL setup script included in this package.</li><li>Copy your project URL and anon/publishable key into a local <code>.env</code> file.</li><li>Deploy the project to Vercel or another static hosting provider.</li></ol><p className="hint">Never put a Supabase service-role key in the browser or in this project.</p><a href="/README.md">Read the setup guide</a></div></div>}
createRoot(document.getElementById("root")).render(<App/>);
