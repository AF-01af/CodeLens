import { currentUserId } from "@project/auth";
import { JoinCourse, joinCourse } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const userId = await currentUserId();
    const input = JoinCourse.parse(await req.json());
    return Response.json(await joinCourse(userId, input));
  } catch (err) {
    return errorResponse(err);
  }
}