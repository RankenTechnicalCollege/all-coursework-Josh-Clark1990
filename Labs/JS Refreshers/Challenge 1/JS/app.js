// This file needs to import the getNumber() and getColor() functions.
import { getRandomNumber as getNumber, getRandomColor as getColor } from '../Utils.js';

// Call the imported functions and get the results
const randomNumber = getNumber();
const randomColor = getColor();

// Get the HTML elements to display the results
const numberElement = document.getElementById('random-number');
const colorElement = document.getElementById('color-name');

// Set the text content of the elements
numberElement.textContent = `Random Number: ${randomNumber}`;
colorElement.textContent = `Random Color: ${randomColor}`;
document.getElementById(color-name).innerText = `Random Color: ${randomColor}`;
document.getElementById(random-number).innerText = `Random Number: ${randomNumber}`;
