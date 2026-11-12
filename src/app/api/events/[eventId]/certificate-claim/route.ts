import { endpoint } from "@/server/domain/common";
import { claimCertificate } from "@/server/domain/learning";
import { getDatabase } from "@/server/db";
export async function POST(request:Request,context:{params:Promise<{eventId:string}>}){return endpoint(request,async(user)=>claimCertificate(user,(await context.params).eventId),"STUDENT");}
export async function PUT(request:Request,context:{params:Promise<{eventId:string}>}){return endpoint(request,async(user)=>{const {eventId}=await context.params;const claim=await claimCertificate(user,eventId);await getDatabase().prototypeCertificateClaim.update({where:{id:claim.id},data:{downloadedAt:new Date()}});return {recorded:true,prototype:true};},"STUDENT");}
