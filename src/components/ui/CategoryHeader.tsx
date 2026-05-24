interface CategoryHeaderProps {
  title: string;
  description?: string;
}

export function CategoryHeader({ title, description }: CategoryHeaderProps) {
  return (
    <header className="mb-8 border-l-4 border-sage-dark pl-4">
      <h2 className="font-serif text-3xl font-bold tracking-tight text-forest">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sand">{description}</p>
      ) : null}
    </header>
  );
}
