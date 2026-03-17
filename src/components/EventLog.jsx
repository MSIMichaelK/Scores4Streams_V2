import { useState } from "react";

const EventLog = ({ events }) => {
  const [expanded, setExpanded] = useState(false);

  const activeEvents = events.filter((e) => !e.undone);
  const displayEvents = [...events].reverse();

  if (events.length === 0) return null;

  const inningLabel = (event) => {
    return `${event.isTop ? "\u25B2" : "\u25BC"}${event.inning}`;
  };

  return (
    <div className="event-log-section">
      <button
        className="event-log-toggle"
        onClick={() => setExpanded(!expanded)}
        data-testid="event-log-toggle"
      >
        {expanded ? "Hide" : "Show"} Play-by-Play ({activeEvents.length})
      </button>

      {expanded && (
        <div className="event-log" data-testid="event-log-list">
          {displayEvents.length === 0 ? (
            <div className="event-empty">No plays recorded yet</div>
          ) : (
            displayEvents.map((event) => (
              <div
                key={event.seq}
                className={`event-entry ${event.undone ? "undone" : ""}`}
              >
                <span className="event-inning">{inningLabel(event)}</span>
                <span className="event-description">{event.description}</span>
                {event.runsScored > 0 && !event.undone && (
                  <span className="event-runs">+{event.runsScored}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EventLog;
