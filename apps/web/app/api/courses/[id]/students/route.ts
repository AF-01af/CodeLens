import { currentUserId } from "@project/auth";
import { listCourseStudents } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await listCourseStudents(await currentUserId(), id));
  } catch (err) {
    return errorResponse(err);
  }
}
