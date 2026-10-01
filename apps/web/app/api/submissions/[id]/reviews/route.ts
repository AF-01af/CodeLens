import { currentUserId } from "@project/auth";
import { CreateReview, createReview, listReviews } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    return Response.json(await listReviews(await currentUserId(), id));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await currentUserId();
    const { id } = await params;
    const input = CreateReview.parse(await req.json());
    return Response.json(await createReview(userId, id, input), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
