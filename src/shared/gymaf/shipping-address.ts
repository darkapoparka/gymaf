export type ShippingFields={street:string;apartment:string;city:string;region:string;postalCode:string;country:string;shirtSize:string};
export const emptyShipping=():ShippingFields=>({street:'',apartment:'',city:'',region:'',postalCode:'',country:'United States',shirtSize:''});
export const isUSAddress=(country:string)=>['united states','united states of america','us','usa'].includes(country.trim().toLowerCase());
