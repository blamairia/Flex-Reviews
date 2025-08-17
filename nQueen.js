function solveNQueensSimple(n, take = 1) {


    if (!Number.isInteger(n) || n < 1) throw new Error("n must be a positive integer");
  if (n === 2 || n === 3) return { count: 0, boards: [] };

  const cols  = new Set();   // used columns
  const diag1 = new Set();   // "\" diagonals, key = row - col
  const diag2 = new Set();   // "/"  diagonals, key = row + col

  const placement = new Array(n); // placement[row] = chosen column
  const boards = [];
  let count = 0;

  function toBoard() {
    const rows = new Array(n);
    for (let r = 0; r < n; r++) {
      const c = placement[r];
      rows[r] = ".".repeat(c) + "Q" + ".".repeat(n - c - 1);
    }
    return rows;
  }

  function dfs(row) {
    if (row === n) {
      count++;
      if (boards.length < take) boards.push(toBoard());
      return;
    }

    for (let col = 0; col < n; col++) {
      const k1 = row - col;
      const k2 = row + col;
      const safe = !cols.has(col) && !diag1.has(k1) && !diag2.has(k2);
      if (!safe) continue;

      // choose
      cols.add(col);
      diag1.add(k1);
      diag2.add(k2);
      placement[row] = col;

      // explore next row
      dfs(row + 1);

      // un-choose (backtrack)
      cols.delete(col);
      diag1.delete(k1);
      diag2.delete(k2);
    }
  }

  dfs(0);                    // ← start at first row
  return { count, boards };  // ← final results
}
