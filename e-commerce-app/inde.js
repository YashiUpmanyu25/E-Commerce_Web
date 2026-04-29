import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ecommerce")
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

  const userSchema = new mongoose.Schema({
    name:{type:String,required:true,}});

    const productSchema = new mongoose.Schema({
        name:String,price:Number,stock:Number,});

        const cartSchema = new mongoose.Schema({
            userId:{type:mongoose.Schema.Types.ObjectId,
            items:[{productId:{type:mongoose.Schema.Types.ObjectId,quantity:Number}}]}});
        
const orderSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,items:Array,totalAmount:Number,status:String}});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);

//routes
app.post('/user', async (req, res) => {
        const user = await User.create(req.body);
        res.json(user);
    });

app.post('/product', async (req, res) => {
    const product = await Product.create(req.body);
    res.json(product);
});

app.post('/add-to-cart', async (req, res) => {
    const 
    {userId,productId,quantity} = req.body;
    let cart = await Cart.findOne({userId});
    if(!cart){
        cart = await Cart.create({userId,items:[{productId,quantity}]});

    }else{
        cart.items.push({productId,quantity});
        await cart.save();
    }
    res.send('Product added to cart');
}); 

app.post('/place-order', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const {userId}=req.body;
        const cart=await cart.findOne({userId}).session(session);
        if(!cart) throw new Error("cart empty");

      let total=0;
      for(let item of cart.items){
        const product =await Product.findById(item.productId).session(session);
        if(!product || product.stock<item.quantity){
            throw new Error("Product out of stock");
        }
        product.stock -=item.quantity;
        await product.save({session});
        total +=product.price * item.quantity;
      }
      const order =await Order.create(
      [
        {
            userId,
            items:cart.item,
            totalAmount:total,
            status:"Placed"
        },
      ],
      {session},
    );
    await Cart.deleteOne({userId}).session(session);
    await session.commitTransaction();
    res.json(order);


    }catch(err){
    await session.shortTransaction();
    res.status(500).send(err.message);
    }
    finally{
        session.endSession();
    }

  
});
app.get('/orders/:userId', async (req, res) => {
    const orders = await Order.find({userId:req.params.userId});
    res.json(orders);
});




app.listen(9000, () => console.log('Server running on port 9000'));