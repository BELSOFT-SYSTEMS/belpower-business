import Link from 'next/link';

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-gray-300 bg-white p-8">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">{description}</p>
      <Link href="/business" className="mt-6 inline-block text-sm font-medium text-blue-normal hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
