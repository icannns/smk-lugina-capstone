import { endpoint } from "@/server/domain/common";
import { getDatabase } from "@/server/db";
export async function GET(request:Request){return endpoint(request,async(user)=>({enrollments:await getDatabase().enrollment.findMany({where:{studentId:user.student!.id},select:{id:true,eventId:true,enrolledAt:true}})}),"STUDENT");}
