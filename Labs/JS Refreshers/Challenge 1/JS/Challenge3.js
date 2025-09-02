const values = [false, 0, null, undefined, "hello", 1, [], {}, "0"];

document.button.addEventListener("click", function() {
  document.getElementById("text").innerHTML = "";
  checkTruthyFalsy(values, "text");
}

values.forEach(val => {
  if (val == input) {
    document.getElementById("text").innerHTML = `${val} is truthy`;
  } else (val != input) {
    document.getElementById("text").innerHTML = `${val} is falsy`;
  }
}
));