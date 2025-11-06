let score: number | string = 33

score = 44

score = "55"

type User= {
  name: string
  id: number
}

type Admin = {
  username: string;
  id: number
}

let goku: User | {username: "gku", id: 345}

function getDb(id:number | string){
  //making api call
  console.log(`Db id is $w`)
}