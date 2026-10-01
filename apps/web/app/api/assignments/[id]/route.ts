import { currentUserId } from "@project/auth";
import { getAssignment } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await getAssignment(await currentUserId(), id));
  } catch (err) {
    return errorResponse(err);
  }
}
