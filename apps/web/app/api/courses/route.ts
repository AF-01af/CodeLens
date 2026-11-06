import { currentUserId } from "@project/auth";
import { CreateCourse, createCourse, listCourses } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await listCourses(await currentUserId()));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await currentUserId();
    const input = CreateCourse.parse(await req.json());
    return Response.json(await createCourse(userId, input), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
