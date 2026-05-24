interface CategoryHeaderProps {
  title: string;
  description?: string;
}

export function CategoryHeader({ title, description }: CategoryHeaderProps) {
  return (
    <header className="mb-8 border-l-4 border-forest-500 pl-4">
      <h2 className="font-serif text-3xl font-bold tracking-tight text-forest-700">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-ink/60">{description}</p>
      ) : null}
    </header>
  );
}
