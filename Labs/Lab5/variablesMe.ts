function addTwo(num: number){
  return num + 2
}

function getUpper(val: string){
  return val.toUpperCase()
}

function signUpUser(name: string, email: string, isPaid: boolean){}

addTwo(5)
getUpper("luke skywalker")
signUpUser("Han Solo", "solo@mail.com", false)

function getValue(myVal: number){
  if (myVal > 5){
    return true
  }
  return "200 OK"
}

const getHello = (s:string):string => {
    return ""

}

const heros = ["Goku", "Vegeta", "Kramer"]

heros.map( hero => {
  return `hero is ${hero}`
})

function consoleError(errmsg: string): void{
  console.log(errmsg);
}

// function handleError(errmsq: string): neverr{
// }
export {}