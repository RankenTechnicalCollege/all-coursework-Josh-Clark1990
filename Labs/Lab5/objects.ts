// const user = {
//   name: "Goku",
//   email: "email@email.com",
//   isActive: true
// }




// let newUser = {name:"Goku", isPaid: false}, email: "email@email.com}"

// function createCourse():{name: string, price: number}{
//   return {name: "George", price: 9999}
// }


// type User = {
//     name: string;
//     email: string;
//     isActive: boolean

// }


// function createUser(user: User){
//   return {name: "", email: "", isActive: true}
// }

// createUser({name: "", email: "", isActive: true})


type User = {
  readonly _id: string
  name: string
  email: string
  isActive: boolean
  creditCardDetails?: number
}

let myUser: User = {
  _id: "1234",
  name: "Kramer",
  email: "email@email.com",
  isActive: false
}

type cardNumber = {
    cardNumber: string
}

type cardDate = {
    cardDate: string
}

type cardDetails = cardNumber & cardDate & {
    cvv: number
}

myUser.email = "hello@hotmail.com"

export {}