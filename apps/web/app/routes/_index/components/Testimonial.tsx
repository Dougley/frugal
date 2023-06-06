export function Testimonial({
  user,
  server,
  avatar,
  children,
}: {
  user: string;
  server: string;
  avatar: string;
  children: React.ReactNode;
}) {
  return (
    <div className="col-span-4 flex w-full lg:col-span-2">
      <div className="card col-span-3 m-4 h-auto w-full flex-col place-content-end bg-base-300 p-4 normal-case shadow-xl">
        <p className="text-dark-300 mb-8 mt-2 whitespace-pre-line">
          {children}
        </p>
        <div className="flex items-center">
          <img
            src={avatar}
            className="h-12 w-12 rounded-full"
            alt="GiveawayBot"
          />
          <div className="ml-4">
            <h3 className="text-dark-300 font-bold">{user}</h3>
            <p className="text-dark-300">{server}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
