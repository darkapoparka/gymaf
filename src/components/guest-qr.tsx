"use client";
import QRCode from "qrcode";
export function GuestQR({url,label="QR code for the local guest pass preview"}:{url:string;label?:string}){
 const {modules}=QRCode.create(url,{errorCorrectionLevel:"M"});
 return <svg viewBox={`0 0 ${modules.size+8} ${modules.size+8}`} role="img" aria-label={label} className="guest-qr" shapeRendering="crispEdges"><rect width="100%" height="100%" fill="white"/>{Array.from(modules.data).map((filled,i)=>filled?<rect key={i} x={i%modules.size+4} y={Math.floor(i/modules.size)+4} width="1" height="1" fill="#161616"/>:null)}</svg>;
}
