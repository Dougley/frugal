export function FeatureShowcase({
  title,
  image,
  children,
  flipped,
}: {
  title: string;
  image: string;
  children: React.ReactNode;
  flipped?: boolean;
}) {
  return (
    <div className="my-5 grid grid-cols-1 gap-12 lg:gap-36">
      <div className="grid-cols-7 gap-16 lg:grid">
        {/* on mobile, the image must always be at the bottom */}
        {!flipped ? (
          <div className="col-span-4 hidden md:block">
            <img
              src={image}
              className="ml-auto mr-auto w-full max-w-[560px] rounded-2xl shadow-xl lg:ml-0 lg:mr-auto"
              alt="GiveawayBot"
            />
          </div>
        ) : null}
        <div className="col-span-3 flex flex-col items-start justify-center text-center lg:text-left">
          <h2 className="mx-auto text-4xl font-black leading-[42px] lg:mx-0">
            {title}
          </h2>
          <p className="text-dark-300 my-8 whitespace-pre-line">{children}</p>
        </div>
        {flipped ? (
          <div className="col-span-4">
            <img
              src={image}
              className="ml-auto mr-auto w-full max-w-[560px] rounded-2xl shadow-xl lg:ml-0 lg:mr-auto"
              alt="GiveawayBot"
            />
          </div>
        ) : (
          <div className="col-span-4 block md:hidden">
            <img
              src={image}
              className="ml-auto mr-auto w-full max-w-[560px] rounded-2xl shadow-xl lg:ml-0 lg:mr-auto"
              alt="GiveawayBot"
            />
          </div>
        )}
      </div>
    </div>
  );
}
