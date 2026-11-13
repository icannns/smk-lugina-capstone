import {test} from "node:test";
import assert from "node:assert/strict";
import {databaseAssessmentRepository} from "../src/lib/assessments/http-repository";
const original=globalThis.fetch;
const record=(id:string,source:string)=>({id,type:"UI_UX",status:"COMPLETED",studentId:"dimas",eventId:"kantin",title:"Hasil UI/UX",source,scoreValue:"91.25",scoreMaximum:"100",summary:"Ringkasan",feedback:null,completedAt:"2026-11-13T01:00:00.000Z"});

test("HTTP adapter follows pagination, maps exact decimal/source contracts and deduplicates IDs",async()=>{
 const calls:string[]=[];
 globalThis.fetch=async(input,options)=>{calls.push(String(input));assert.equal(options?.credentials,"same-origin");return Response.json({records:calls.length===1?[record("internal","INTERNAL")]:[record("internal","INTERNAL"),record("demo","DEMO")],pagination:{hasMore:calls.length===1}});};
 try{const records=await databaseAssessmentRepository.list({role:"student",studentId:"dimas"},new AbortController().signal);assert.equal(calls.length,2);assert.match(calls[1],/page=2/);assert.equal(records.length,2);assert.equal(records[0].result?.score?.value,91.25);assert.equal(records[0].source,"api");assert.equal(records[0].origin,"INTERNAL");assert.equal(records[1].source,"mock");}finally{globalThis.fetch=original;}
});
test("HTTP errors, malformed result enums and aborts fail without a fixture fallback",async()=>{
 try{
  globalThis.fetch=async()=>Response.json({error:{message:"Unavailable"}},{status:503});await assert.rejects(databaseAssessmentRepository.list({role:"teacher"},new AbortController().signal),/tidak tersedia/);
  globalThis.fetch=async()=>Response.json({records:[{...record("bad","INTERNAL"),type:"UNKNOWN"}]});await assert.rejects(databaseAssessmentRepository.list({role:"teacher"},new AbortController().signal),/tidak valid/);
  let called=false;globalThis.fetch=async()=>{called=true;return Response.json({records:[]});};const c=new AbortController();c.abort();await assert.rejects(databaseAssessmentRepository.list({role:"teacher"},c.signal),{name:"AbortError"});assert.equal(called,false);
 }finally{globalThis.fetch=original;}
});
