import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { slh_dsa_sha2_128f } from '@noble/post-quantum/slh-dsa.js'
import { x25519 } from '@noble/curves/ed25519.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'

const random = (length:number) => crypto.getRandomValues(new Uint8Array(length))
export function toHex(bytes: Uint8Array, max=18) { return [...bytes.slice(0,max)].map(x=>x.toString(16).padStart(2,'0')).join('') + (bytes.length>max?'…':'') }
export async function runHybridDemo(message:string) {
  const aliceX = x25519.keygen(), bobX = x25519.keygen()
  const classicalAlice = x25519.getSharedSecret(aliceX.secretKey, bobX.publicKey)
  const classicalBob = x25519.getSharedSecret(bobX.secretKey, aliceX.publicKey)
  const kemKeys = ml_kem768.keygen(random(ml_kem768.lengths.seed!))
  const {cipherText, sharedSecret: alicePq} = ml_kem768.encapsulate(kemKeys.publicKey, random(ml_kem768.lengths.msgRand!))
  const bobPq = ml_kem768.decapsulate(cipherText, kemKeys.secretKey)
  const aliceKey = hkdf(sha256, new Uint8Array([...classicalAlice,...alicePq]), undefined, new TextEncoder().encode('quantum-guard-hybrid-v1'), 32)
  const bobKey = hkdf(sha256, new Uint8Array([...classicalBob,...bobPq]), undefined, new TextEncoder().encode('quantum-guard-hybrid-v1'), 32)
  const iv = random(12), aesKey = await crypto.subtle.importKey('raw',aliceKey,'AES-GCM',false,['encrypt'])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},aesKey,new TextEncoder().encode(message)))
  const checkKey = await crypto.subtle.importKey('raw',bobKey,'AES-GCM',false,['decrypt'])
  const decrypted = new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},checkKey,ciphertext))
  return { classical: toHex(classicalAlice), pq: toHex(alicePq), ciphertext: toHex(ciphertext,28), same: aliceKey.every((v,i)=>v===bobKey[i]), decrypted, kemBytes:cipherText.length }
}
export async function runBenchmarks() {
  const rows:{name:string;operation:string;ms:number;publicKey:string;signature:string;ciphertext:string}[]=[]
  const measure = (fn:()=>void) => { const t=performance.now(); fn(); return Number((performance.now()-t).toFixed(2)) }
  const kemSeed=random(ml_kem768.lengths.seed!), kem=ml_kem768.keygen(kemSeed), enc=ml_kem768.encapsulate(kem.publicKey,random(ml_kem768.lengths.msgRand!))
  rows.push({name:'ML-KEM-768',operation:'Keygen + encapsulate / decapsulate',ms:measure(()=>{const k=ml_kem768.keygen(random(ml_kem768.lengths.seed!));const e=ml_kem768.encapsulate(k.publicKey,random(ml_kem768.lengths.msgRand!));ml_kem768.decapsulate(e.cipherText,k.secretKey)}),publicKey:String(kem.publicKey.length),signature:'—',ciphertext:String(enc.cipherText.length)})
  const signers=[['ML-DSA-65',ml_dsa65],['SLH-DSA-128f',slh_dsa_sha2_128f]] as const
  for(const [name,alg] of signers){const k=alg.keygen(random(alg.lengths.seed!));const msg=new TextEncoder().encode('Quantum Guard benchmark');const sig=alg.sign(msg,k.secretKey);rows.push({name,operation:'Keygen + sign / verify',ms:measure(()=>{const p=alg.keygen(random(alg.lengths.seed!));const s=alg.sign(msg,p.secretKey);alg.verify(s,msg,p.publicKey)}),publicKey:String(k.publicKey.length),signature:String(sig.length),ciphertext:'—'})}
  const xc=x25519.keygen(); rows.push({name:'X25519',operation:'Keygen + shared secret',ms:measure(()=>{const a=x25519.keygen(),b=x25519.keygen();x25519.getSharedSecret(a.secretKey,b.publicKey)}),publicKey:String(xc.publicKey.length),signature:'—',ciphertext:'—'})
  const rsaStart=performance.now(); const rsa=await crypto.subtle.generateKey({name:'RSA-PSS',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']); const rsaMsg=new TextEncoder().encode('Quantum Guard benchmark'); const rsaSig=await crypto.subtle.sign({name:'RSA-PSS',saltLength:32},rsa.privateKey,rsaMsg); await crypto.subtle.verify({name:'RSA-PSS',saltLength:32},rsa.publicKey,rsaSig,rsaMsg); rows.push({name:'RSA-2048',operation:'Keygen + sign / verify (WebCrypto)',ms:Number((performance.now()-rsaStart).toFixed(2)),publicKey:'256',signature:String(rsaSig.byteLength),ciphertext:'—'})
  const ecStart=performance.now(); const ec=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']); const msg=new TextEncoder().encode('Quantum Guard benchmark');const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},ec.privateKey,msg); await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},ec.publicKey,sig,msg);rows.push({name:'ECDSA P-256',operation:'Keygen + sign / verify (WebCrypto)',ms:Number((performance.now()-ecStart).toFixed(2)),publicKey:'65',signature:String(sig.byteLength),ciphertext:'—'})
  return rows
}
export async function signCertificatePayload(payload: string) {
 const keys=ml_dsa65.keygen(random(ml_dsa65.lengths.seed!)); const bytes=new TextEncoder().encode(payload); const signature=ml_dsa65.sign(bytes,keys.secretKey); return {publicKey:toHex(keys.publicKey,keys.publicKey.length),signature:toHex(signature,ml_dsa65.lengths.signature!),valid:ml_dsa65.verify(signature,bytes,keys.publicKey)}
}
