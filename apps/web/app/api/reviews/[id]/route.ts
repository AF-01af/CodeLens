import { currentUserId } from "@project/auth";
import { getReview, PatchReview, updateReview } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await getReview(await currentUserId(), id));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await currentUserId();
    const { id } = await params;
    const input = PatchReview.parse(await req.json());
    return Response.json(await updateReview(userId, id, input));
  } catch (err) {
    return errorResponse(err);
  }
}
