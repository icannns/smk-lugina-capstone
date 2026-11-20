import "dotenv/config";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {randomBytes} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {requireDevelopmentDatabase} from "../prisma/development-safety.ts";
import {createDatabaseClient} from "../src/server/db/client.ts";
const target=requireDevelopmentDatabase(process.env);assert(target.databaseName.startsWith("bojong_united_test"));
const database=createDatabaseClient(target.connectionString),require=createRequire(import.meta.url),{chromium,expect}=require(process.env.PLAYWRIGHT_MODULE||"@playwright/test");
const base=process.env.AUDIT_BASE_URL||"http://localhost:3000";assert(["localhost","127.0.0.1"].includes(new URL(base).hostname));
const output=process.env.AUDIT_OUTPUT_DIR||path.join(os.tmpdir(),"lugina-persisted-audit-regressions");mkdirSync(output,{recursive:true});
const suffix=randomBytes(5).toString("hex"),eventId=`audit-${suffix}`,milestoneId=crypto.randomUUID(),checks=[],errors=[],failed=[];
// Test-only DB fixture. No mock browser store, test API, real student data, or production writes.
await database.$transaction(async tx=>{
 const rubric=await tx.rubricVersion.findFirstOrThrow({where:{rubricId:"uiux"},include:{criteria:true}});
 await tx.event.create({data:{id:eventId,ownerTeacherId:"rina",title:`Event Regresi PostgreSQL ${suffix}`,status:"ONGOING",startsAt:new Date("2026-01-01Z"),endsAt:new Date("2030-12-31Z"),publishedAt:new Date(),rubricVersionId:rubric.id}});
 await tx.milestone.create({data:{eventId,id:milestoneId,title:"Milestone UUID Regresi",position:1,deadline:new Date("2030-12-01Z"),acceptedFormats:["Teks"]}});
 await tx.milestoneCriterion.createMany({data:rubric.criteria.map(c=>({eventId,milestoneId,rubricVersionId:rubric.id,criterionId:c.id}))});
 await tx.milestoneSurveyReference.create({data:{eventId,milestoneId,surveyReferenceId:"demo-learning-survey"}});
 await tx.enrollment.create({data:{eventId,studentId:"dimas"}});
 for(let i=1;i<=39;i++){const id=`audit-${suffix}-${i}`;await tx.user.create({data:{id:`user-${id}`,name:`Peserta Fiktif ${String(i).padStart(2,"0")} ${i===39?"NamaPanjang".repeat(9):""}`.trim(),email:`${id}@example.com`,role:"STUDENT",isDemo:true,student:{create:{id}}}});await tx.enrollment.create({data:{eventId,studentId:id}});}
 const submission=await tx.submission.create({data:{eventId,studentId:"dimas",milestoneId}});
 const v1=await tx.submissionVersion.create({data:{submissionId:submission.id,eventId,version:1,submittedAt:new Date("2026-11-08T09:00+07:00"),note:"Riwayat pekerjaan fiktif"}});
 const assessment=await tx.assessment.create({data:{submissionVersionId:v1.id,eventId,rubricVersionId:rubric.id,assessedByTeacherId:"rina"}});
 await tx.assessmentScore.createMany({data:rubric.criteria.map(c=>({assessmentId:assessment.id,rubricVersionId:rubric.id,criterionId:c.id,value:4}))});
 await tx.submissionVersion.create({data:{submissionId:submission.id,eventId,version:2,submittedAt:new Date(),note:"Revisi belum dinilai"}});
},{timeout:30000});
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||"msedge",headless:true}),context=await browser.newContext({viewport:{width:1440,height:1024},acceptDownloads:true}),page=await context.newPage();page.setDefaultTimeout(15000);
page.on("pageerror",e=>errors.push(e.message));page.on("response",r=>{if(r.status()>=400)failed.push([r.url(),r.status()])});
const main=()=>page.locator("main:visible").last(),button=name=>page.getByRole("button",{name,exact:true});
const ok=name=>{checks.push(name);console.log("PASS",name)};
async function go(route){await page.goto(base+route);await expect(page.locator("main:visible").last()).not.toHaveAttribute("aria-label","Memuat ruang belajar");}
async function login(identifier,password){await go("/login");await page.locator("#login-email").fill(identifier);await page.locator("#login-password").fill(password);await button("Masuk").click();await page.waitForURL(identifier==="rina.guru"?"**/guru/dashboard":"**/siswa/dashboard");await expect(page.getByRole("heading",{name:identifier==="rina.guru"?/^Selamat (pagi|siang|sore|malam), Rina$/:/^Selamat (pagi|siang|sore|malam), Dimas$/,exact:true})).toBeVisible();}
let studentLoggedIn=false;
try{
 await login("rina.guru",process.env.TEST_TEACHER_PASSWORD);
 await go(`/guru/reports?event=${eventId}&work=working`);await expect(main().locator("tbody tr")).toHaveCount(1);await expect(main().locator("tbody")).toContainText("Dalam pengerjaan");await expect(main().locator("tbody")).toContainText("Belum dinilai");await expect(main().locator("thead")).toContainText("M1 (tugas");assert(!(await main().innerText()).includes(milestoneId));ok("B01/B03/B08: DB-backed incomplete survey and ungraded revision remain working; UUID remains internal");
 await go(`/guru/work?event=${eventId}`);const dimas=main().locator("tbody tr").filter({hasText:"Dimas Saputra"});await expect(dimas.getByText("Belum dinilai",{exact:true})).toHaveCount(2);await page.getByLabel("Status penilaian",{exact:true}).selectOption("partial");await expect(main().locator("tbody tr")).toHaveCount(0);ok("B03: historical grade is not the current revision grade in Student Work filters");
 await go(`/guru/students?event=${eventId}&student=dimas`);const note=page.getByRole("textbox",{name:"Catatan Guru untuk Dimas Saputra",exact:true});await note.fill("Catatan regresi PostgreSQL.");await button("Simpan Catatan").click();await expect(main()).toContainText("Catatan tersimpan");await page.reload();await expect(note).toHaveValue("Catatan regresi PostgreSQL.");ok("B04: Teacher note survives actual DB write and full refresh");
 await go(`/guru/reports?event=${eventId}&assessment=none`);await expect(main().locator("tbody tr")).toHaveCount(20);const pd=page.waitForEvent("download");await button("Unduh PDF").click();const pdfPath=path.join(output,"report-40-students.pdf");await(await pd).saveAs(pdfPath);const pdf=readFileSync(pdfPath,"utf8");assert((pdf.match(/\/Type \/Page\b/g)||[]).length>1);assert(pdf.includes("Peserta Fiktif 39"));for(const m of pdf.matchAll(/1 0 0 1 50 (\d+) Tm/g))assert(Number(m[1])>=46);const xd=page.waitForEvent("download");await button("Unduh Excel").click();await(await xd).saveAs(path.join(output,"report-40-students.xlsx"));ok("B06: real 40-enrollment PDF paginates and preserves final long-name row; XLSX downloaded");
 await go("/guru/rubrics?mode=create");await page.locator("#rubric-name").fill("Rubrik Regresi API");await button("Simpan Rubrik").click();const invalid=main().locator('textarea[aria-invalid="true"]');await expect(invalid).toHaveCount(5);assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")),"Kriteria 2 skor 1");for(const f of await invalid.all()){const id=await f.getAttribute("aria-describedby");assert(id);await expect(page.locator(`[id="${id}"]`)).toBeVisible();}ok("B10: rubric validation identifies and focuses accessible score errors");
 await page.locator("summary[aria-label^='Menu akun']:visible").click();await button("Keluar").click();await page.waitForURL("**/login");await login("dimas",process.env.TEST_DIMAS_PASSWORD);studentLoggedIn=true;
 for(const length of [110,120]){await go("/siswa/profile");await page.locator("#student-profile-name").fill("N".repeat(length));await button("Simpan Perubahan").click();await expect(main()).toContainText("Perubahan profil berhasil disimpan.");await page.reload();await expect(page.locator("#student-profile-name")).toHaveValue("N".repeat(length));}ok("B07: 110/120-character profile names survive server persistence and reload");
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:1024});for(const route of ["/siswa/dashboard","/siswa/profile",`/siswa/portfolio?event=${eventId}`]){await go(route);await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{message:route+width}).toBe(true);}await page.screenshot({path:path.join(output,`long-name-${width}.png`),fullPage:true});}ok("B07 responsive: long-name Dashboard/Profile/Portfolio at 320/768/1440");
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);writeFileSync(path.join(output,"results.json"),JSON.stringify({checks,errors,failed,pdfPages:(pdf.match(/\/Type \/Page\b/g)||[]).length,eventId},null,2));console.log(JSON.stringify({passed:checks.length}));
}catch(error){await page.screenshot({path:path.join(output,"failure.png"),fullPage:true});writeFileSync(path.join(output,"overflow.json"),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,80),right:e.getBoundingClientRect().right}))),null,2));writeFileSync(path.join(output,"failure.json"),JSON.stringify({error:String(error),checks,errors,failed},null,2));throw error;}
finally{if(studentLoggedIn)await context.request.put(base+"/api/profile",{headers:{Origin:base},data:{name:"Dimas Saputra",email:"dimas@example.com",phone:""}});await browser.close();await database.$disconnect();}
