export type CurbSpec={widthIn:number;heightIn:number;lengthFt:number;slopePct?:number};
export function volume(spec:CurbSpec){
  const Lft=spec.lengthFt, w=spec.widthIn, h0=spec.heightIn;
  const h1=h0+((spec.slopePct??0)/100)*(Lft*12);
  const avg=(h0+h1)/2, in3=w*avg*(Lft*12), ft3=in3/1728, yd3=ft3/27, m3=ft3*0.028316846592;
  return { in3, ft3, yd3, m3 };
}
export function buildCurbGeometry(s:CurbSpec){
  const w=s.widthIn, h0=s.heightIn, L=s.lengthFt*12, h1=h0+((s.slopePct??0)/100)*L;
  const vertices=[[0,0,0],[w,0,0],[w,h0,0],[0,h0,0],[0,0,L],[w,0,L],[w,h1,L],[0,h1,L]];
  const faces=[[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,2,6],[3,6,7],[1,2,6],[1,6,5],[0,3,7],[0,7,4]];
  return { vertices, faces };
}