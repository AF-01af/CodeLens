import { ReviewForm } from "@/components/ReviewForm";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Review submission</h1>
      <ReviewForm submissionId={id} />
    </main>
  );
}