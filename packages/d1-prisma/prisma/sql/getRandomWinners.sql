-- @param {String} $1:giveaway_id ID of the giveaway
-- @param {Int} $2:winners Number of winners to select
SELECT *
FROM entries
WHERE ROWID IN (
    SELECT ROWID
    FROM entries
    WHERE giveaway_id = $1
      AND winner = 0
    ORDER BY RANDOM()
    LIMIT $2
  )
ORDER BY RANDOM();