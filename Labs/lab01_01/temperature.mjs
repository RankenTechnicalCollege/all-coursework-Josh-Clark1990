import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

let fahrenheit = 0;
let celsius = 0;
let tempFormat;
do {
  tempFormat = await rl.question("Celsius or Fahrenheit? Please enter c or f:");
  tempFormat = tempFormat.trim().toLowerCase();
} while (tempFormat !== "c" && tempFormat !== "f");
    console.log("Invalid Input. Please Try Again")
    tempFormat = await rl.question("Celsius or Fahrenheit? Please enter c or f:");


while (true) {
  if (tempFormat === "f") {
    let fahrenheitTemp;
    do {
      fahrenheitTemp = await rl.question("Please Enter Temperature in Fahrenheit:");
      if (isNaN(fahrenheitTemp)) {
        console.log("That is not a number. Please try again.");
      }
    } while (isNaN(fahrenheitTemp));
    let fConvertedTemp = (fahrenheitTemp - 32) * (5 / 9);
    console.log(`The fahrenheit temperature of ${fahrenheitTemp} is ${fConvertedTemp.toFixed(2)} degrees celsius`);
  } else if (tempFormat === "c") {
    let celsiusTemp;
    do {
      celsiusTemp = await rl.question("Please Enter Temperature in Celsius:");
      if (isNaN(celsiusTemp)) {
        console.log("That is not a number. Please try again.");
      }
    } while (isNaN(celsiusTemp));
    let cConvertedTemp = (celsiusTemp * (9 / 5)) + 32;
    console.log(`The celsius temperature of ${celsiusTemp} is ${cConvertedTemp.toFixed(2)} degrees fahrenheit`);
  }

  do {
    tempFormat = await rl.question("Celsius or Fahrenheit? Please enter c or f:");
    tempFormat = tempFormat.trim().toLowerCase();
  } while (tempFormat !== "c" && tempFormat !== "f");
}

rl.close();


