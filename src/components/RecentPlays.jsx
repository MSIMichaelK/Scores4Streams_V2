/**
 * RecentPlays — compact ticker showing last 3 plays above the action bar.
 * Tapping opens the full event log drawer.
 */
const RecentPlays = ({ events, onOpenLog }) => {
  const active = events.filter(e => !e.undone);
  const recent = active.slice(-3).reverse();

  if (active.length === 0) return null;

  return (
    <div className="recent-plays" onClick={onOpenLog} data-testid="recent-plays">
      {recent.map((event, i) => (
        <div key={event.seq} className={`recent-play ${i === 0 ? "latest" : ""}`}>
          <span className="recent-inning">
            {event.isTop ? "\u25B2" : "\u25BC"}{event.inning}
          </span>
          <span className="recent-desc">{event.description}</span>
          {event.runsScored > 0 && (
            <span className="recent-runs">+{event.runsScored}</span>
          )}
        </div>
      ))}
      {active.length > 3 && (
        <div className="recent-more">{active.length - 3} more plays...</div>
      )}
    </div>
  );
};

export default RecentPlays;
