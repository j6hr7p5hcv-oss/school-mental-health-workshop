import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  try{
    const {room_id,pin,action,patch}=await req.json();
    if(typeof room_id!=="string"||typeof pin!=="string")return json({error:"Missing room or PIN."},400);
    const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:secret}=await db.from("workshop_moderators").select("pin_hash").eq("room_id",room_id).maybeSingle();
    if(!secret||secret.pin_hash!==await sha256(pin))return json({error:"Unauthorized."},401);
    if(action==="verify")return json({ok:true});
    if(action!=="update"||!patch||!Number.isInteger(patch.active_question)||patch.active_question<0||patch.active_question>13)return json({error:"Invalid moderator action."},400);
    const q=patch.active_question;
    const status=q===0?"lobby":q===13?"finished":"live";
    const {data:room,error}=await db.from("workshop_rooms").update({active_question:q,status}).eq("id",room_id).select("id,code,title,active_question,status,created_at").single();
    if(error)return json({error:"Could not update room."},500);
    return json({room});
  }catch{return json({error:"Invalid request."},400);}
});
