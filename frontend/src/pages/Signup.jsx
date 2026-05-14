import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup(){
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const navigate=useNavigate();

  async function signup(){
    const res=await fetch("http://localhost:5000/api/signup",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name,email,password})
    });

    if(res.ok) navigate("/login");
  }

  return(
    <div>
      <h2>Signup</h2>
      <input onChange={e=>setName(e.target.value)} placeholder="Name"/>
      <input onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
      <input type="password" onChange={e=>setPassword(e.target.value)}/>
      <button onClick={signup}>Register</button>
    </div>
  )
}


