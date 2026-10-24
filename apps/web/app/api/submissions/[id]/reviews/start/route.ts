import { currentUserId } from "@project/auth";
import { startReview } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json(await startReview(await currentUserId(), id), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
