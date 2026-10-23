import { currentUserId } from "@project/auth";
import { requireViewer } from "@project/domain";
import { errorResponse } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await requireViewer(await currentUserId()));
  } catch (err) {
    return errorResponse(err);
  }
}
