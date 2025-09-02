// //synchronous code
// console.log("Task 1: Order Coffee");

// function brewCoffee() {
//   const start = Date.now();
//   while (Date.now() - start < 3000);
//   //simulate brewing time


// console.log("Task2: The Coffee is Brewed");

// }
// brewCoffee();


//Asynchronous code
// console.log("Task 1: Order Coffee");

// setTimeout(() => {   //setTimeout is an asynchronous function that executes callback function when done
//   console.log("Task 2: The Coffee is Brewed");
// }, 3000); //simulate brewing time

// console.log("Task 3: Enjoy your Coffee");

document.getElementById("btnCoffee").addEventListener("click", function(){
  document.getElementById("outputCoffee").innerText= "Brewing Coffee...";
  brewCoffee();
  document.getElementById("outputCoffee").innerText= "Coffee is Ready! Enjoy your Coffee! :3";
});

function brewCoffee() {
  console.log("Task 1: Order Coffee");

  setTimeout(() => {
    console.log("Task 2: The Coffee is Brewed");
  }, 3000); 

  
}

document.getElementById("btnToast").addEventListener("click", function(){
  document.getElementById("outputToast").innerText= "Toasting Bread...";
  toastBread();
  document.getElementById("outputToast").innerText= "Toast is Ready! Yay Toast! :3";
});

function toastBread() {

  setTimeout(() => {
  }, 2000); 

 
}

document.getElementById("btnJuice").addEventListener("click", function(){
  document.getElementById("outputJuice").innerText= "Juice is Being Made...";
  makeJuice();
  document.getElementById("outputJuice").innerText= "The Juice is Loose!";
});

function makeJuice() {
  console.log("Task 1: Order Juice");
  
  setTimeout(() => {
    console.log("Task 2: Juice is Ready");
  }, 1000);

  
}