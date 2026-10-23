import { currentUserId } from "@project/auth";
import { CreateAssignment, createAssignment, listAssignments } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await listAssignments(await currentUserId()));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await currentUserId();
    const input = CreateAssignment.parse(await req.json());
    return Response.json(await createAssignment(userId, input), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
