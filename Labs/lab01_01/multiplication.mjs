import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { table } from 'node:console';

const rl = readline.createInterface({ input, output });

let tableSize = 0;
let row = tableSize;
let column = tableSize;
tableSize = await rl.question("How Big Would You Like Your Multiplication Table? Please enter a number between 1 and 12:");


      if (isNaN(tableSize) || tableSize < 1 || tableSize > 12){
        console.log("That is not a valid entry. Please try again.");
        tableSize = await rl.question("How Big Would You Like Your Multiplication Table? Please enter a number between 1 and 12:");
      }
      else (console.log("Multiplication Table:"));
      for (let i = 1; i <= tableSize; i++) { 
        let row = "";
        for (let j = 1; j <= tableSize; j++) {
          row += (i * j).toFixed().padStart(4, ' ');
        }
        console.log(row);
    }
      
    

        

  rl.close()