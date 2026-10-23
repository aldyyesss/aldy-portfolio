import Experiences from "../../ui/Experiences";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="shell page-content">
      <Experiences slug={slug} />
    </div>
  );
}
