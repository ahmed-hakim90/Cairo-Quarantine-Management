type PageHeadingProps = {
  title: string;
  description?: string;
};

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <header className="border-b border-gov-gray-200 bg-gov-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="font-heading text-3xl font-bold text-gov-navy md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gov-gray-600">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
