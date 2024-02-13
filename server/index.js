const express=require ('express');
const app=express();
const cors=require('cors');
const mongoose =require('mongoose');
const User=require('./models/user.model');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');

app.use(cors());
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/userAuth') 

function verifyToken(req, res, next){
    const token = req.headers['authorization'];
    if(!token){
        return res.staus(401).json({message: 'Unauthorized: Token not found'})
    }

    jwt.verify(token, 'somethingsecure', (err, decoded)=>{
        if(err){
            return res.status(401).json({message:'Unauthorized: Couldnt decode token'})
        }
        req.user=decoded;
        next();
    })
}

app.get('/api/quote',verifyToken, (req,res)=>{
    res.json({quote:req.user.name});
})

app.post('/api/register', async (req, res)=>{
    console.log(req.body)
    const hashedPass=await bcrypt.hash(req.body.password, 10);

    try{
    const user = await User.create({
        name:req.body.name,
        email:req.body.email,
        password:hashedPass,
        role: req.body.role || 'user',
    })
    res.json({status:'ok'})
    }catch (err){
        res.json({status:'error', error:'Duplicate email'})
    }
})

app.post('/api/login', async (req, res)=>{
    const user= await User.findOne({
        email:req.body.email,
    })

    if(!user){
        return res.json({status:'Error: email not found', user: false});
    }

    const match=await bcrypt.compare(req.body.password, user.password);
  
    if(match){
        const token=jwt.sign({
            name: user.name,
            email:user.email,
            role:user.role
        },'somethingsecure')


        return res.json({status:'ok', user:true, token, role:user.role});
    }else{
        return res.json({status:'error', user:false});
    }

})

app.get('/api/admin', verifyToken, (req,res)=>{
    res.json({quote:req.user.name});
})


app.listen(1337, ()=>{
    console.log('Server started at port 1337');
})