import { currentUserId } from "@project/auth";
import { CreateSubmission, createSubmission, listSubmissions } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    return Response.json(await listSubmissions(await currentUserId(), id));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await currentUserId();
    const { id } = await params;
    const input = CreateSubmission.parse(await req.json());
    return Response.json(await createSubmission(userId, id, input), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
