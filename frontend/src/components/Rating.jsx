import { FaStar, FaStarHalfStroke, FaRegStar } from "react-icons/fa6";
import { averageRating } from "../rating.js";

export function Stars({ value = 0, size = "1rem" }) {
  const stars = [1, 2, 3, 4, 5].map((slot) => {
    if (value >= slot - 0.25) return <FaStar key={slot} />;
    if (value >= slot - 0.75) return <FaStarHalfStroke key={slot} />;
    return <FaRegStar key={slot} />;
  });
  return (
    <span className="stars" style={{ fontSize: size }}>
      {stars}
    </span>
  );
}

/**
 * Compact rating line: stars, the score, and how many ratings it came from.
 * Shows a clear "not rated yet" state instead of a misleading 0.0.
 */
export function Rating({ ratings, size = "1rem", label }) {
  const count = ratings?.length || 0;
  const value = averageRating(ratings);

  if (count === 0)
    return (
      <span className="rating">
        <Stars value={0} size={size} />
        <span className="rating-meta">No ratings yet</span>
      </span>
    );

  return (
    <span className="rating">
      <Stars value={value} size={size} />
      <strong className="mono">{value.toFixed(1)}</strong>
      <span className="rating-meta">
        {label ? `${label} · ` : ""}
        {count} rating{count === 1 ? "" : "s"}
      </span>
    </span>
  );
}

/** Completed / failed / disputed counts — the same history the risk engine reads. */
export function TrackRecord({ user }) {
  if (!user) return null;
  const done = user.completedContracts || 0;
  const failed = user.failedContracts || 0;
  const disputes = user.disputeCount || 0;
  const total = done + failed;
  const successRate = total ? Math.round((done / total) * 100) : null;

  return (
    <span className="track-record">
      <span>{done} completed</span>
      <span>{failed} failed</span>
      <span>{disputes} disputed</span>
      {successRate !== null && <span>{successRate}% success</span>}
    </span>
  );
}
