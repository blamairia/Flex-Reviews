let fs = require("fs");

function n_queens(n ,take = 1) {
 
  if(!Number.isInteger(n) || n < 1 || n > 12) throw "n must be 1<=n<=12";
  let board = "";
  const placement = new Array(n);
  
  const cols = new Set();
  const diag1 = new Set();
  const diag2 = new Set();

  function toBoard(){
    // Build a single space-separated string across all rows, no leading/trailing spaces
    const parts = [];
    for(let r = 0; r < n; r++){
      const c = placement[r];
      // row digits as array of '0'/'1'
      for (let i = 0; i < n; i++) {
        parts.push(i === c ? '1' : '0');
      }
    }
    return parts.join(' ');
  }
  function solve(row){
    if(row == n){
      board += toBoard();
      return;
    }
    for(let col = 0; col <n ; col++){
      const k1 = row-col;
      const k2 = row+col;

      const safe = !diag1.has(k1) && !diag2.has(k2) && !cols.has(col);

      if(!safe) continue;

      diag1.add(k1);
      diag2.add(k2);
      cols.add(col);
      placement[row] = col;

      solve(row+1);

      diag1.delete(k1);
      diag2.delete(k2);
      cols.delete(col);
    }
  }
  solve(0);
  return board;  
}

function Main(input) {
  // Parse input to get n
  let n = parseInt(input.trim());
  // Call the n_queens function
 
  const boardString = n_queens(n);
  console.log(boardString);
}

// keep this function call here
let stdinBuffer = fs.readFileSync(0);
Main(stdinBuffer.toString());
