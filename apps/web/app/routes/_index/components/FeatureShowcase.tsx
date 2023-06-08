export function FeatureShowcase({
  title,
  image,
  children,
}: {
  title: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-5 grid grid-cols-1 gap-12 p-6">
      <div className="grid-cols-7 gap-16">
        <div className="col-span-3 flex flex-col items-start justify-center text-center lg:text-left">
          <h2 className="mx-auto text-4xl font-black leading-[42px] lg:mx-0">
            {title}
          </h2>
          <p className="text-dark-300 my-8 whitespace-pre-line">{children}</p>
        </div>
        <div className="col-span-4 flex">
          <img
            src={image}
            className="w-full max-w-[560px] rounded-2xl shadow-xl"
            alt="GiveawayBot"
          />
        </div>
      </div>
    </div>
  );
}
