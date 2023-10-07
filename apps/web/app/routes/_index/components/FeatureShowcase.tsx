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
    <div className="mx-auto w-full max-w-[560px] xl:p-6">
      <div className="my-5 grid h-full grid-cols-1 items-stretch p-3">
        <div className="flex h-full flex-col">
          <div className="flex h-full flex-col text-center lg:text-left">
            <h2 className="mx-auto text-4xl font-black leading-[42px] lg:mx-0">
              {title}
            </h2>
            <span className="my-4 self-center whitespace-pre-line">
              {children}
            </span>
          </div>
          <div className="col-span-4 flex justify-center">
            <img
              src={image}
              className="w-full max-w-[560px] self-end rounded-2xl shadow-xl"
              alt="GiveawayBot"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
