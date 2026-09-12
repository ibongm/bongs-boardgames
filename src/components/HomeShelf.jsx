import GameCard from './GameCard.jsx';

export default function HomeShelf({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-gold">{title}</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
        {items.map((item) => (
          <GameCard key={item.id} id={item.id} copy={item.copy} hint={item.hint} />
        ))}
      </div>
    </section>
  );
}
