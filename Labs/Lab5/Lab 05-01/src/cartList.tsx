import { useState } from 'react';
import { nanoid } from 'nanoid'; 
import { CartItem } from './cartItem';

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

    function onNameChange(evt, item){
      const newItems = [...items];
      const index = items.indexOf(item);
      newItems[index].name = evt.target.value;
      setItems(newItems);
    }

    function onAddQuantity(item){
      const newQuantity = item.quantity + 1;
      if(newQuantity <= 10){}
        const newItems = [...items];
        const index = items.indexOf(item);
        newItems[index].quantity ++;
        setItems(newItems);
      }
    }

    function onSubtractQuantity(item){
      const newQuantity = item.quantity -1;
        if(newQuantity > 0){
          const newItems = [...items];
          const index = items.indexOf(item)
          newItems[index].quantity --;
          setItems(newItems);
      } else{
        setItems(items.filter(i => i.id !== item.id));
      }
    }  
  
  return(
  <>
    <div className ='container'>
      <span className ='fs-1 text-primary margin-4'>Shopping Cart</span>
      <span className ='fs-3 badge rounded-circle text-bg-primary '>{itemCount > 0 ? itemCount : "Please Add Items To Cart"} </span>
      <br />
      <button type='button' className'btn btn primary mb4' onClick={() => setItems([...items, {id:nanoid(), name:'', quantity:1}])}>Add Item</button>
        {items.map(item =>
        <CartItem item={item} key={item.id} 
        onNameChange = {(evt) => onNameChange(evt, item)}
        onAddQuantity = {() => onAddQuantity(item)}
        onSubtractQuantity = {() => onSubtractQuantity(item)}/>
      )}
    
  )
  </div>
  </>
)};