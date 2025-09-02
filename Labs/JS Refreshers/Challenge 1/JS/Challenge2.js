
const SECRET_VALUE = 42; //constant variable within the file

document.getElementById("button") .addEventListener("click", function() {
  let userInput;
  let outputString;

  userInput = document.getElementById("txtUserInput").value; //local scope variable- only accessible within this function

  if (userInput.trim() === "") {
    outputString = "You did not enter anything. Please try again!";
  }
  else if (!isNaN(Number(userInput)) && userInput == SECRET_VALUE) {
    userInput = Number(userInput);
    outputString = `You found the secret: ${SECRET_VALUE}! Conglaturations`;
  }
  else if (!isNaN(Number(userInput))) {
    userInput = Number(userInput);
    outputString = `You entered: ${userInput}, but that is not the secret. Try again!`;
  }
  else if (userInput.toLowerCase() === "true") {
    userInput = (userInput.toLowerCase() === "true");
    outputString = `You entered: ${userInput}, but that is not the secret. Try again!`;
  }
  else if (userInput.toLowerCase() === "false") {
    userInput = (userInput.toLowerCase() === "true");
    outputString = `You entered: ${userInput}, but that is not the secret. Try again!`;
  } 
  else {userInput = String(userInput);
    outputString = `You entered: ${userInput}, but that is not the secret. Try again!`;
  }
  document.getElementById("text").innerText = `${outputString} \n It's JavaScript Data Type is: ${typeof userInput}`;
});