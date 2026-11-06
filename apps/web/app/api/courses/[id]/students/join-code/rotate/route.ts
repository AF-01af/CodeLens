import { currentUserId } from "@project/auth";
import { rotateJoinCode } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await rotateJoinCode(await currentUserId(), id));
  } catch (err) {
    return errorResponse(err);
  }
}
