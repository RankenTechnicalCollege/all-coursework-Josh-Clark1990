import { useState } from 'react';
import { nanoid } from 'nanoid'; 

export default function CartList(){
  
  const [items, setItems] = useState([
      {id:nanoid(), name:'Hat', quantity: 2},
      {id:nanoid(), name:"Tie", quantity: 2},
      {id:nanoid(), name:'Belt', quantity: 1}
    ]);

    let itemCount = 0;
    for(const item of items){
      if(item && item.quantity){
        itemCount += item.quantity;
      }
    }
  
  return(   //59 minutes into code along
  <>
    <div className ='container'>
      <span className ='fs-1 text-primary margin-4'>Shopping Cart</span>
      <span className ='fs-3 badge rounded-circle text-bg-primary margin-3'>Item Count</span>
        {items.map(item =>
        <div className='row' key={item.id}>
          <div className ='col-4'>
            <input type='text' className='form-control' value = {item.name}/>
          </div>
          <div className ='col-1'>
              <span>{item.quantity}</span>
          </div>
          <div className ='col-4'>
            <button className='btn btn-danger rounder-circle margin-3'>-</button>
            <button className= 'btn btnSuccess rounder-circle'>+</button>
          </div>
          </div>
      )}
          </>
  )
};