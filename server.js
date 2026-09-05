import express from "express";
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import path from "path";
import {fileURLToPath} from "url";

const app=express();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const client=process.env.OPENAI_API_KEY?new OpenAI({apiKey:process.env.OPENAI_API_KEY}):null;

app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname,"public")));

app.post("/api/ai",async(req,res)=>{
  try{
    if(!client) return res.status(503).json({error:"AI backend is not configured. Add OPENAI_API_KEY to the server environment."});
    const question=String(req.body?.question||"").trim();
    const context=String(req.body?.context||"").slice(0,12000);
    if(!question) return res.status(400).json({error:"Question is required."});
    const response=await client.responses.create({
      model:"gpt-5.6-luna",
      input:[
        {role:"system",content:[{type:"input_text",text:"You are AXIOM Lab Ops, a concise lab-operations assistant. Use the user's supplied lab context when useful. Do not invent lab resources, budgets, workflows, crises, dates, or measurements. If information is missing, say so and ask for it."}]},
        {role:"user",content:[{type:"input_text",text:`LAB CONTEXT:\n${context}\n\nQUESTION:\n${question}`}]}
      ]
    });
    res.json({answer:response.output_text||"No answer returned."});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"AI request failed. Check the server/API configuration."});
  }
});

app.use((req, res) => { res.sendFile(path.join(__dirname, "public", "index.html")); });
app.listen(process.env.PORT||3000,()=>console.log(`AXIOM Lab Ops running on http://localhost:${process.env.PORT||3000}`));