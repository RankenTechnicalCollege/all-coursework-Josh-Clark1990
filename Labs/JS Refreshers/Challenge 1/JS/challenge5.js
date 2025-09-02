// //functions

// //Function Declaration - most common syntax
// function add (a,b){
//   return a + b;
// }

// //Function Expression - storing a function in a variable and calling it through said variable
// const addExpression = function add3(a,b,c,){
//   return a + b + c;
// }

// //Arrow Function - alternative to a function expression
// //6 ways to declare an arrow function
// //Arrow Functions are anonymous functions - they do not have a name

// //No Parameters - must use parentheses
// const greet = () => "Hello There!";

// //One Parameter
// const add100 = a => a + 100;

// //Multiple Parameters
// const multiply3 = (a,b,c) => a * b * c;

// //function body with multiple statements - must use curly braces and a return statement
// const greet2 = (name = "Guest") => {
//   const greeting = `Hello, ${name}!`;
//   return greeting;
// }

// //return an object from arrow function
// const createUser = (name, age) => ({name, age});

// //Higher order functions - a function can be an argument
// function doMathOperation(a, b, operation){
//   return operation(a,b);
// }

// function add(x,y){
//   return x + y;
// }

// function multiply(x,y){
//   return x * y;
// }


function vowelCount(wordInput) {
  let count = 0;
  for (const char of wordInput) {
    if (char == "a" || char == "e" || char == "i" || char == "o" || char == "u") {
      count++;
    }
  }
  return count;
  
}


function reverseString(wordInput){
  let reversedWord = "";
  for (char of wordInput){
    reversedWord = char + reversedWord;
  

  }
    return reversedWord;

 }


 function capitalizeWord(wordInput){
  return wordInput.charAt(0).toUpperCase() + wordInput.slice(1).toUpperCase();
 }

 function countWords(wordInput){
  let words = wordInput.trim().split(" ");
  for(let word of words){
    if(word > 0){
      wordCount++;
    }
  }

  return words.length;
}

const concatenateStrings = (wordInput, wordInput2) => {
  return wordInput + " " + wordInput2;

}
   

// document.getElementById("btnVowel").addEventListener("click", function(){
//   let userInput = document.getElementById("wordInput").value.toLowerCase();
//   let count = vowelCount(userInput);
//   document.getElementById("output").innerText = `Your word contains ${count} vowels.`;
// });

// document.getElementById("btnVowel").addEventListener("click", function(){
//   let userInput = document.getElementById("wordInput").value.toLowerCase();
//   let reversedWord = reverseString(userInput);
//   document.getElementById("output").innerText = `Your word reversed is ${reversedWord}.`;
// }
// );

// document.getElementById("btnVowel").addEventListener("click", function(){
//   let userInput = document.getElementById("wordInput").value;
//   let capitalizedWord = capitalizeWord(userInput);
//   document.getElementById("output").innerText = `Your word capitalized is ${capitalizedWord}.`;
// })

// document.getElementById("btnVowel").addEventListener("click", function(){
//   let userInput = document.getElementById("wordInput").value;
//   let wordCount = countWords(userInput);
//   document.getElementById("output").innerText = `Your input contains ${wordCount} words.`;
// })

document.getElementById("btnVowel").addEventListener("click", function(){
  let userInput = document.getElementById("wordInput").value;
  let userInput2 = document.getElementById("wordInput2").value;
  let concatenatedString = concatenateStrings(userInput, userInput2);
  document.getElementById("output").innerText = `Your concatenated string is: ${concatenatedString}.`;
})