import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

let single = 0;
let married = 0;
let status;
let singleIncome = 0;
let marriedIncome = 0; 

do{
  status = await rl.question("Single or Married? Please enter s or m:");
}while (status != "s".toLowerCase() && status != "m".toLowerCase());

if (status == "s".toLowerCase()){
  single = true;
  married = false;
}
else if (status == "m".toLowerCase()){
  single = false;
  married = true;
}
  while (single == true) {
    let singleIncome = await rl.question("Please Enter Income:");
    let singleTaxOwed = 0;
    if (isNaN(singleIncome)) {
      console.log("That is not a number. Please try again.");
    } else if (singleIncome < 0) {
      console.log("That is an invalid entry. Please try again.");
    } else if (singleIncome <= 11925) {
      singleTaxOwed = singleIncome * 0.10;
      console.log(`The tax owed on an income of $${singleIncome} is $${singleTaxOwed.toFixed(2)}`);
    } else if (singleIncome > 11925 && singleIncome <= 48475) {
      singleTaxOwed = 1192.50 + 0.12 * (singleIncome - 11952);
      console.log(`The tax owed on an income of $${singleIncome} is $${singleTaxOwed.toFixed(2)}`);
    } else if (singleIncome > 48475 && singleIncome <= 103350) {
      singleTaxOwed = 5578.50 + 0.22 * (singleIncome - 48475);
      console.log(`The tax owed on an income of $${singleIncome} is $${singleTaxOwed.toFixed(2)}`);
    } else if (singleIncome > 103350 && singleIncome <= 197300) {
      singleTaxOwed = 17651 + 0.24 * (singleIncome - 103350);
      console.log(`The tax owed on an income of $${singleIncome} is $${singleTaxOwed.toFixed(2)}`);
    } else if (singleIncome > 197300 && singleIncome <= 250525) {
      singleTaxOwed = 40199 + 0.32 * (singleIncome - 197300);
      console.log(`The tax owed on an income of $${singleIncome} is $${singleTaxOwed.toFixed(2)}`);
    } else if (singleIncome > 250525 && singleIncome <= 626350) {
      singleTaxOwed = 57231 + 0.35 * (singleIncome - 250525);
      console.log(`The tax owed on an income of $${singleIncome} is $${singleTaxOwed.toFixed(2)}`);
    } else if(singleIncome > 626350) {
      singleTaxOwed = 188769.75 + 0.37 * (singleIncome - 626350);
      console.log(`The tax owed on an income of $${singleIncome} is $${singleTaxOwed.toFixed(2)}`);
    }

}

  while (married == true) {
    let marriedIncome = await rl.question("Please Enter Income:");
    let marriedTaxOwed;

    if (isNaN(marriedIncome)) {
      console.log("That is not a number. Please try again.");
    } else if (marriedIncome < 0) {
      console.log("That is an invalid entry. Please try again.");
    } else if (marriedIncome <= 23850) {
      marriedTaxOwed  = marriedIncome * 0.10;
      console.log(`The tax owed on an income of $${marriedIncome} is $${marriedTaxOwed.toFixed(2)}`);
    } else if (marriedIncome > 23850 && marriedIncome <= 96950) {
      marriedTaxOwed  = 2385 + 0.12 * (marriedIncome - 23850);
      console.log(`The tax owed on an income of $${marriedIncome} is $${marriedTaxOwed.toFixed(2)}`);
    } else if (marriedIncome > 96950 && marriedIncome <= 206700) {
      marriedTaxOwed  = 11157 + 0.22 * (marriedIncome - 96950);
      console.log(`The tax owed on an income of $${marriedIncome} is $${marriedTaxOwed.toFixed(2)}`);
    } else if (marriedIncome > 206700 && marriedIncome <= 394600) {
      marriedTaxOwed  = 35302 + 0.24 * (marriedIncome - 206700);
      console.log(`The tax owed on an income of $${marriedIncome} is $${marriedTaxOwed.toFixed(2)}`);
    } else if (marriedIncome > 304600 && marriedIncome <= 501050) {
      marriedTaxOwed  = 80398 + 0.32 * (marriedIncome - 394600);
      console.log(`The tax owed on an income of $${marriedIncome} is $${marriedTaxOwed.toFixed(2)}`);
    } else if (marriedIncome > 501050 && marriedIncome <= 751600) {
      marriedTaxOwed  = 114462 + 0.35 * (marriedIncome - 201050);
      console.log(`The tax owed on an income of $${marriedIncome} is $${marriedTaxOwed.toFixed(2)}`);
    } else if(marriedIncome > 75160) {
      marriedTaxOwed  = 202154.50 + 0.37 * (marriedIncome - 751600);
      console.log(`The tax owed on an income of $${marriedIncome} is $${marriedTaxOwed.toFixed(2)}`);
    }
  }



rl.close();