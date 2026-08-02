import { Card, CardHeader, CardBody } from "@/components/ui/card";

export function PendingBackendCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          {description}
        </div>
      </CardBody>
    </Card>
  );
}
