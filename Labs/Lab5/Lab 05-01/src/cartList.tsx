import { useState } from 'react';
import { nanoid } from 'nanoid'; 

export default function CartList(){
  
  const [items, setItems] = useState([
      {id:nanoid(), name:'Hat', quantity: 2},
      {id:nanoid(), name:"Tie", quantity: 2},
      {id:nanoid(), name:'Belt', quantity: 1}
    ]);
  
  return(   //59 minutes into code along
  <>
      <h1>Shopping Cart</h1>
        {items.map(item => 
         <div>
          <p key={item.id}>{item.name}
          <p>{item.quantity}</p>
        </p>
        </div>
      )}
          </>
  )
};