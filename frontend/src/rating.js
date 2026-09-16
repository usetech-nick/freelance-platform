/** Average of a user's ratings array (0 when they have none yet). */
export function averageRating(ratings) {
  if (!ratings || ratings.length === 0) return 0;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}
