import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const navigate=useNavigate();

  async function login(){
    const res=await fetch("http://localhost:5000/api/login",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,password})
    });

    const data=await res.json();

    if(res.ok){
      localStorage.setItem("user",JSON.stringify(data.user));
      navigate("/admin");
    }
  }

  return(
    <div>
      <h2>Login</h2>
      <input onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
      <input type="password" onChange={e=>setPassword(e.target.value)}/>
      <button onClick={login}>Login</button>
      <Link to="/signup">Create Account</Link>
    </div>
  )
}


