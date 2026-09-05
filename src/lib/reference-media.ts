import type { Crop } from "./data";

// Exact photographic regions of the retained reference; controls and copy are separate HTML.
export const coverChoices: { id: string; label: string; crop: Crop }[] = [
  ["ocean", "Ocean waves", 419,334,483,274],
  ["color", "Color spectrum", 33,628,413,273],
  ["trail", "Trail runners", 458,628,411,273],
  ["stairs", "Stair workout", 33,922,413,273],
  ["running", "Running together", 458,922,411,273],
  ["beach", "Tropical beach", 33,1216,413,273],
  ["desert", "Desert mesas", 458,1216,411,273],
  ["forest", "Forest path", 33,1510,413,273],
  ["mountains", "Mountain lake", 458,1510,411,273],
].map(([id,label,x,y,w,h]) => ({ id: String(id), label: String(label), crop: { src:"screens/cf555b20934717e7.webp", sw:902, sh:2048, x:Number(x),y:Number(y),w:Number(w),h:Number(h) } }));

// The recorded source deliberately displays black frames; this is not a missing image placeholder.
export const blackReferenceFrame = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cpath fill='black' d='M0 0h300v300H0z'/%3E%3C/svg%3E";
