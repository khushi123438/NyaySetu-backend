const express=require("express")
const app=express()
const path=require("path")
const hbs =require("hbs")

const templatepath=path.join(__dirname,'../templates')

app.use(express.json())
app.set("view engine","hbs")
app.set("views",templatepath)
app.get("/",(req,res)=>{
  res.render("login")
})
app.get("/signup",(req,res)=>{
  res.render("signup")
})


app.listen(5000,()=>{
console.log("port connected");
})
