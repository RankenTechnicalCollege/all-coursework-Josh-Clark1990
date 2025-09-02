const arr = ["gundam", "evangelion", "cowboy bebop", "ghost in the shell"];

document.getElementById("btnSubmit").addEventListener("click", function(){
let userInput = document.getElementById("txtUserInput").value;


for (let i = 0; i < arr.length; i++) {
  if (arr[i].toLowerCase() == userInput.toLowerCase()) {
    document.getElementById("output").innerHTML = `${userInput} is in the array`;
    break;
  } else {
    document.getElementById("output").innerHTML = `${userInput} is not in the array`;
  }

  
}
});