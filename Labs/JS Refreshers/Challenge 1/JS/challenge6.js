// const person = {
//   name: ["Courtney", "Clark"],
//   age: 34,
//   occupation: "Web Developer",
//   bio:function() {
//     return (`Hello, my name is ${this.name[0]} ${this.name[1]}. I am ${this.age} years old and I work as a ${this.occupation}.`);
//   }
// }

// document.getElementById("btnSubmit").addEventListener("click", function(){
//   document.getElementById("output").innerText = person.bio();
// } );

// document.getElementById("textUserInput").addEventListener("change", function(e){
//   const newName = e.target.value.split(" ");
//   person.name = newName;
//     document.getElementById("output").innerText = person.bio();

// });

const user = {
  name: ["Courtney", "Clark"],
  email: "courtneymclark1990@gmail.com",
  isOnline: false,
  bio:function () {
    return (`Username: ${this.name[0]} ${this.name[1]} \nEmail: ${this.email}`);
  }
}
 addEventListener("load", user.bio) ;{
  document.getElementById("output").innerText = user.bio();
 };

//  document.getElementById("btnSubmit").addEventListener("click", function(){
//   document.getElementById("output").innerText = user.bio();
//  } );

 document.getElementById("txtUserInput").addEventListener("change", function(e){
  const newName = e.target.value.split(" ");
  user.name = newName;
    document.getElementById("output").innerText = user.bio()});

  document.getElementById("txtUserInput2").addEventListener("change", function(e){
    const newEmail = e.target.value;
    user.email = newEmail;
      document.getElementById("output").innerText = user.bio()});  
