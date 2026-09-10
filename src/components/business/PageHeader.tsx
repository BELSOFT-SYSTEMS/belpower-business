export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 min-w-0">
      <h1 className="text-xl font-semibold break-words text-gray-900 sm:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm break-words text-gray-600">{description}</p>}
    </div>
  );
}
