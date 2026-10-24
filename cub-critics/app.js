/* Cub Critics — demonstration-only directory. No live backend or user reviews. */
const sampleVenues = [
  {id:1,name:"Campus Kitchen",category:"American",emoji:"🍔",rating:4.7,reviews:43,open:true,menu:["Burgers","Chicken sandwich","Fries"],summary:"A sample campus-style spot for comfort-food favorites."},
  {id:2,name:"Golden Wok",category:"Asian",emoji:"🍜",rating:4.5,reviews:35,open:true,menu:["Rice bowls","Noodles","Vegetables"],summary:"Illustrative bowls and quick lunch options."},
  {id:3,name:"The Green Table",category:"Healthy",emoji:"🥗",rating:4.4,reviews:27,open:false,menu:["Salad","Grain bowl","Wrap"],summary:"A made-up fresh-food option to demonstrate filtering."},
  {id:4,name:"Tiger Pizza",category:"Pizza",emoji:"🍕",rating:4.3,reviews:52,open:true,menu:["Cheese pizza","Pepperoni pizza","Breadsticks"],summary:"Fictional pizza counter for the interface preview."},
  {id:5,name:"Morning Mug",category:"Cafe",emoji:"☕",rating:4.6,reviews:30,open:false,menu:["Coffee","Bagels","Muffins"],summary:"A conceptual coffee stop with light bites."},
  {id:6,name:"Spice Street",category:"International",emoji:"🌮",rating:4.2,reviews:21,open:true,menu:["Tacos","Rice plates","Vegetarian plate"],summary:"Sample international-inspired casual meals."}
];
const $ = id => document.getElementById(id);
const state = {query:"",category:"All",sort:"rating",openOnly:false};
const categories = ["All",...new Set(sampleVenues.map(x=>x.category))];
const safe = str=>String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function filtered(){
  let a=sampleVenues.filter(v=>(state.category==="All"||state.category===v.category)
   &&(!state.openOnly||v.open)
   &&[v.name,v.category,...v.menu].join(" ").toLowerCase().includes(state.query.trim().toLowerCase()));
  return a.sort((a,b)=>state.sort==="name"?a.name.localeCompare(b.name):state.sort==="reviews"?b.reviews-a.reviews:b.rating-a.rating);
}
function render(){
  $("categories").innerHTML=categories.map(c=>'<button type="button" class="filter-chip '+(state.category===c?"selected":"")+'" data-category="'+safe(c)+'" aria-pressed="'+(state.category===c)+'">'+safe(c)+'</button>').join("");
  const a=filtered();$("result-count").textContent=a.length+" sample venue"+(a.length===1?"":"s")+" found";
  $("venue-grid").hidden=!a.length;$("empty-state").hidden=!!a.length;
  $("venue-grid").innerHTML=a.map(v=>'<article class="venue-card"><div class="venue-image" aria-hidden="true"><span>'+v.emoji+'</span><span class="venue-badge">'+(v.open?"Sample · Open":"Sample · Closed")+'</span></div><div class="venue-content"><span class="venue-category">'+safe(v.category)+'</span><h3>'+safe(v.name)+'</h3><p>'+safe(v.summary)+'</p><div class="venue-stats"><span class="venue-rating">★ '+v.rating.toFixed(1)+'</span><span>'+v.reviews+' fictional reviews</span></div><button class="venue-button" type="button" data-venue="'+v.id+'">Explore sample menu <span aria-hidden="true">↗</span></button></div></article>').join("");
}
function reset(){state.query="";state.category="All";state.sort="rating";state.openOnly=false;$("search").value="";$("sort").value="rating";$("open-only").checked=false;render();}
$("search").addEventListener("input",e=>{state.query=e.target.value;render()});
$("sort").addEventListener("change",e=>{state.sort=e.target.value;render()});
$("open-only").addEventListener("change",e=>{state.openOnly=e.target.checked;render()});
$("categories").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;state.category=b.dataset.category;render()});
$("reset-filters").addEventListener("click",reset);$("empty-reset").addEventListener("click",reset);
$("venue-grid").addEventListener("click",e=>{const b=e.target.closest("[data-venue]");if(!b)return;const v=sampleVenues.find(x=>x.id===Number(b.dataset.venue));if(!v)return;
$("dialog-content").innerHTML='<span class="section-kicker">ILLUSTRATIVE VENUE</span><h2 id="dialog-title">'+safe(v.name)+'</h2><p>'+safe(v.summary)+'</p><p><strong>Example menu items</strong></p><ul>'+v.menu.map(m=>"<li>"+safe(m)+"</li>").join("")+'</ul><p><small>Sample details only. Real menus, hours, pricing, user accounts and ratings are not yet connected.</small></p>';
$("venue-dialog").showModal()});
$("dialog-close").addEventListener("click",()=>$("venue-dialog").close());
$("venue-dialog").addEventListener("click",e=>{if(e.target===$("venue-dialog"))$("venue-dialog").close()});
render();
