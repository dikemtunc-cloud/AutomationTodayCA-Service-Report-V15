/* =========================================================
   GOOGLE AUTHENTICATION LOCK
   ========================================================= */

const $=s=>document.querySelector(s);

(function lockPageUntilGoogleLogin(){
  const style=document.createElement("style");
  style.id="atd-auth-lock-style";
  style.textContent=`
    body.atd-auth-locked > *:not(#googleLoginOverlay){
      visibility:hidden !important;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("atd-auth-locked");
})();

// Google Apps Script Web App endpoint. Paste the deployed /exec URL here after deployment.
const DELIVERY_CONFIG={
  webAppUrl:"https://script.google.com/macros/s/AKfycbxpI-rtRWmhjlhEEewXu68LFzN4xEhPiyfzbQED4wCG0_qyhBJaoQTzbeTpActu7JH9/exec"
};
let currentReportNo="";
let reportNoReady=false;
const reportNo=()=>currentReportNo;
$("#reportNo").textContent="AUTHENTICATION REQUIRED"; $("#reportInput").value="";

const now=new Date(), localDate=new Date(now-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
document.querySelector('[name="serviceDate"]').value=localDate;

function reserveReportNumber(serviceDate){
  if(!googleAuthenticated || !googleCredential || !window.__ATD_AUTH_PROOF || !serviceDate) return Promise.resolve(false);
  return new Promise(function(resolve){
    const callbackName="atdReportNumberCallback_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const script=document.createElement("script");
    let finished=false;
    function cleanup(){try{delete window[callbackName];}catch(_){window[callbackName]=undefined;} if(script.parentNode)script.parentNode.removeChild(script);}
    function finish(ok){if(finished)return;finished=true;cleanup();resolve(ok);}
    window[callbackName]=function(result){
      if(result && result.ok===true && result.reportNo){
        currentReportNo=String(result.reportNo);
        reportNoReady=true;
        $("#reportNo").textContent=currentReportNo;
        $("#reportInput").value=currentReportNo;
        updateFormStatus();
        finish(true);
      }else{
        reportNoReady=false;
        $("#reportNo").textContent="REPORT NUMBER UNAVAILABLE";
        $("#reportInput").value="";
        finish(false);
      }
    };
    script.onerror=function(){finish(false);};
    const params=new URLSearchParams();
    params.set("mode","reserveReport");
    params.set("callback",callbackName);
    params.set("serviceDate",serviceDate);
    params.set("googleCredential",googleCredential);
    params.set("authorizationProof",window.__ATD_AUTH_PROOF);
    script.src=DELIVERY_CONFIG.webAppUrl+"?"+params.toString();
    document.head.appendChild(script);
    setTimeout(function(){finish(false);},20000);
  });
}

let reportReservationTimer=null;
function refreshReportNumber(){
  clearTimeout(reportReservationTimer);
  reportReservationTimer=setTimeout(function(){
    const dateEl=document.querySelector('[name="serviceDate"]');
    if(dateEl && dateEl.value) reserveReportNumber(dateEl.value);
  },120);
}

function verificationUrl(reportNumber){
  return DELIVERY_CONFIG.webAppUrl+"?mode=verify&reportNo="+encodeURIComponent(reportNumber||"");
}

function makeQrDataUrl(value){
  return new Promise(function(resolve){
    if(!window.QRCode || !value){resolve(null);return;}
    const host=document.createElement("div");
    host.style.cssText="position:fixed;left:-10000px;top:-10000px;width:180px;height:180px;background:#fff;";
    document.body.appendChild(host);
    try{
      new QRCode(host,{text:verificationUrl(value),width:180,height:180,correctLevel:QRCode.CorrectLevel.M});
      setTimeout(function(){
        const canvas=host.querySelector("canvas"),img=host.querySelector("img");
        const result=canvas?canvas.toDataURL("image/png"):(img?img.src:null);
        host.remove();resolve(result);
      },80);
    }catch(e){host.remove();resolve(null);}
  });
}

function updateApprovalTime(){const n=new Date();$("#approvalTime").textContent=n.toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"});}
updateApprovalTime(); setInterval(updateApprovalTime,30000);
document.querySelector('[name="serviceDate"]').addEventListener("change",refreshReportNumber);

document.querySelectorAll(".type").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".type").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 document.querySelector('[name="serviceType"]').value=b.dataset.value;updateFormStatus();
}));
const statusIcons={"Completed":"✓","Unable to Complete":"×","Follow-up Required":"◷","Completed – Further Work Required":"🔧"};
document.querySelectorAll(".status").forEach(b=>{
 const label=b.textContent.trim();
 b.innerHTML=`<span class="status-icon">${statusIcons[b.dataset.value]||"●"}</span> ${label.replace(/^●\\s*/,"").replace(/^◷\\s*/,"")}`;
 b.addEventListener("click",()=>{document.querySelectorAll(".status").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelector('[name="result"]').value=b.dataset.value;updateFormStatus();});
});
function escapeHtmlAttr(s){return String(s??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function bindFieldEvents(root=document){root.querySelectorAll("input,select,textarea").forEach(el=>{el.addEventListener("input",updateFormStatus);el.addEventListener("change",updateFormStatus);});}
function addCustomerEmail(value=""){
 const list=$("#customerEmailList");if(!list)return;
 const row=document.createElement("div");row.className="contact-row email-row";
 row.innerHTML=`<span class="contact-icon">✉</span><input type="email" name="customerEmail" placeholder="e.g. john@company.com" value="${escapeHtmlAttr(value)}"><button type="button" class="remove-contact" onclick="removeContactRow(this)" aria-label="Remove email">🗑</button>`;
 list.appendChild(row);bindFieldEvents(row);updateFormStatus();
}
function addCustomerPhone(value=""){
 const list=$("#customerPhoneList");if(!list)return;
 const row=document.createElement("div");row.className="contact-row phone-row";
 row.innerHTML=`<span class="contact-icon">☎</span><input name="customerPhone" placeholder="e.g. 416-555-1234" value="${escapeHtmlAttr(value)}"><button type="button" class="remove-contact" onclick="removeContactRow(this)" aria-label="Remove phone">🗑</button>`;
 list.appendChild(row);bindFieldEvents(row);updateFormStatus();
}
function removeContactRow(btn){const row=btn.closest(".contact-row");if(!row)return;const list=row.parentElement;if(list.children.length<=1){row.querySelector("input").value="";}else row.remove();updateFormStatus();}
function addEquipment(){
 const w=document.createElement("div");w.className="repeat equipment";
 w.innerHTML=`<div class="grid six"><label>Equipment / Machine<input name="equipment" placeholder="e.g. Temperature Controller"></label><label>Manufacturer<input name="manufacturer" placeholder="e.g. JUMO"></label><label>Model<input name="model" placeholder="e.g. dTRON 304"></label><label>Serial Number<input name="serial" placeholder="e.g. 12345678"></label><label>Part Number<input name="partNumber" placeholder="e.g. 703044/..."></label><label>Location / Tag<input name="location" placeholder="e.g. Line 2 – Oven #3"></label></div><button type="button" class="remove" onclick="removeRow(this)">🗑</button>`;
 $("#equipmentList").appendChild(w);bindFieldEvents(w);updateFormStatus();
}
function addPart(){
 const r=document.createElement("div");r.className="part-row";
 r.innerHTML=`<input placeholder="Part No." name="partNo"><input placeholder="Description" name="partDesc"><input placeholder="Qty" name="qty" type="number" min="0" step="1"><button type="button" onclick="removeRow(this)">×</button>`;
 $("#partsList").appendChild(r);bindFieldEvents(r);updateFormStatus();
}
function removeRow(btn){const row=btn.closest(".repeat,.part-row");if(row&&row.parentElement.children.length>1){row.remove();updateFormStatus();}}
const canvas=$("#signature"),ctx=canvas.getContext("2d");let drawing=false,hasSig=false;
function pos(e){const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return[(p.clientX-r.left)*canvas.width/r.width,(p.clientY-r.top)*canvas.height/r.height]}
function start(e){e.preventDefault();drawing=true;hasSig=true;const[x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y);updateFormStatus()}
function move(e){if(!drawing)return;e.preventDefault();const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke()}
function end(){drawing=false}
ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";
["mousedown","mousemove","mouseup","mouseleave"].forEach(ev=>canvas.addEventListener(ev,{mousedown:start,mousemove:move,mouseup:end,mouseleave:end}[ev]));
canvas.addEventListener("touchstart",start,{passive:false});canvas.addEventListener("touchmove",move,{passive:false});canvas.addEventListener("touchend",end);
function clearSignature(){ctx.clearRect(0,0,canvas.width,canvas.height);hasSig=false;updateFormStatus()}
function collect(){
 const fd=new FormData($("#serviceForm")),o=Object.fromEntries(fd.entries());o.reportNo=currentReportNo;
 o.customerEmails=[...document.querySelectorAll('[name="customerEmail"]')].map(i=>i.value.trim()).filter(Boolean);
 o.customerPhones=[...document.querySelectorAll('[name="customerPhone"]')].map(i=>i.value.trim()).filter(Boolean);
 o.email=o.customerEmails[0]||"";o.phone=o.customerPhones[0]||"";
 const readInputs=el=>Object.fromEntries([...el.querySelectorAll("input,select,textarea")].filter(i=>i.name).map(i=>[i.name,i.value]));
 o.equipment=[...document.querySelectorAll(".equipment")].map(readInputs);o.parts=[...document.querySelectorAll(".part-row")].map(readInputs).filter(x=>x.partNo||x.partDesc||x.qty);
 o.signature=hasSig?canvas.toDataURL("image/png"):"";o.generatedAt=new Date().toISOString();return o;
}
const requiredSelectors=['[name="company"]','[name="contact"]','[name="serviceDate"]','[name="startTime"]','[name="endTime"]','[name="technician"]','[name="work"]','[name="customerName"]'];
function markRequiredFields(){let missing=false;requiredSelectors.forEach(sel=>{const el=$(sel);if(!el)return;const bad=!String(el.value||"").trim();el.classList.toggle("missing-required",bad);if(bad)missing=true;});const emails=[...document.querySelectorAll('[name="customerEmail"]')];const emailOK=emails.some(i=>String(i.value||"").trim()&&i.checkValidity());emails.forEach(i=>i.classList.toggle("missing-required",!emailOK&&!String(i.value||"").trim()));if(!emailOK)missing=true;const sw=document.querySelector(".signature-wrap");if(sw)sw.classList.toggle("missing-required-wrap",!hasSig);return missing;}
function sectionState(n){
 if(n===6)return $("#review")&&!$("#review").classList.contains("hidden")?"complete":"optional";
 if(n===3){return [...document.querySelectorAll(".equipment input")].some(i=>String(i.value||"").trim())?"complete":"optional";}
 const req={1:['[name="company"]','[name="contact"]'],2:['[name="serviceDate"]','[name="startTime"]','[name="endTime"]','[name="technician"]'],4:['[name="work"]'],5:['[name="customerName"]']}[n]||[];
 let miss=req.some(sel=>{const el=$(sel);return el&&!String(el.value||"").trim()});if(n===1){const es=[...document.querySelectorAll('[name="customerEmail"]')];miss=miss||!es.some(i=>String(i.value||"").trim()&&i.checkValidity());}if(n===5)miss=miss||!hasSig;if(miss)return"required";
 const optional=n===1?['[name="customerPhone"]','[name="address"]','[name="city"]','[name="postal"]']:n===2?['[name="po"]','[name="workOrder"]']:n===4?['[name="techNotes"]','[name="customerComments"]']:[];
 return optional.some(sel=>{const el=$(sel);return el&&!String(el.value||"").trim()})?"optional":"complete";
}
function updateProgress(){
 const states=[1,2,3,4,5,6].map(sectionState);
 document.querySelectorAll(".progress .step").forEach((step,i)=>{step.classList.remove("state-required","state-optional","state-complete");step.classList.add("state-"+states[i]);step.setAttribute("data-status",states[i]);});
 document.querySelectorAll(".section-status").forEach((badge,i)=>{const state=states[i]||"required";badge.dataset.sectionStatus=state;badge.textContent=state==="complete"?"✓":state==="optional"?"!":"!";});
}
function updateFormStatus(){markRequiredFields();updateProgress();}
bindFieldEvents();setTimeout(()=>{if($("#customerEmailList")&&!$("#customerEmailList").children.length)addCustomerEmail();if($("#customerPhoneList")&&!$("#customerPhoneList").children.length)addCustomerPhone();updateFormStatus();},0);

function renderReview(o,finalized=false){
 const eqRows=(o.equipment||[]).map(e=>`<tr><td>${escapeHtml(e.equipment||"—")}</td><td>${escapeHtml(e.manufacturer||"—")}</td><td>${escapeHtml(e.model||"—")}</td><td>${escapeHtml(e.serial||"—")}</td></tr>`).join("");
 const partRows=(o.parts||[]).map(p=>`<tr><td>${escapeHtml(p.partNo||"—")}</td><td>${escapeHtml(p.partDesc||"—")}</td><td>${escapeHtml(p.qty||"—")}</td></tr>`).join("");
 const statusClass={"Completed":"review-completed","Unable to Complete":"review-unable","Follow-up Required":"review-followup","Completed – Further Work Required":"review-further"}[o.result]||"review-completed";
 const acceptance=finalized
   ? `<div class="review-acceptance confirmed">✓ Customer acceptance has been confirmed for this Service Report.</div>`
   : `<div class="review-acceptance pending">Please review all information carefully. Use <strong>EDIT REPORT</strong> if anything needs to be corrected. Final acceptance is completed only after <strong>SUBMIT &amp; CONFIRM</strong>.</div>`;
 const actions=finalized
   ? `<div class="review-actions"><button type="button" id="editReport" class="secondary-btn">EDIT REPORT</button><button type="button" id="generateCustomerPdf" class="primary-btn">GENERATE CUSTOMER PDF</button><button type="button" id="sendCustomerCopy" class="primary-btn">SEND CUSTOMER COPY</button><button type="button" id="printReview" class="secondary-btn">PRINT REVIEW</button></div><div id="deliveryStatus" class="delivery-status"></div>`
   : `<div class="review-actions"><button type="button" id="editReport" class="secondary-btn">EDIT REPORT</button><button type="button" id="submitConfirm" class="primary-btn">SUBMIT &amp; CONFIRM</button></div>`;
 $("#reviewContent").innerHTML=`
 <div class="review-header"><div><div class="review-kicker">CUSTOMER REVIEW</div><h2>${escapeHtml(o.reportNo)}</h2><div class="verification-label">QR verification is embedded in the customer PDF.</div></div><div class="review-status ${statusClass}">${escapeHtml(o.result||"Completed")}</div></div>
 <div class="review-grid">
   <div><span>Customer</span><strong>${escapeHtml(o.company||"—")}</strong></div>
   <div><span>Contact Person</span><strong>${escapeHtml(o.contact||"—")}</strong></div>
   <div><span>Customer Emails</span><strong>${escapeHtml((o.customerEmails||[o.email||""]).join("; ")||"—")}</strong></div>
   <div><span>Customer Phones</span><strong>${escapeHtml((o.customerPhones||[o.phone||""]).join("; ")||"—")}</strong></div>
   <div><span>Service Date</span><strong>${escapeHtml(o.serviceDate||"—")}</strong></div>
   <div><span>Start Time</span><strong>${escapeHtml(o.startTime||"—")}</strong></div>
   <div><span>End Time</span><strong>${escapeHtml(o.endTime||"—")}</strong></div>
   <div><span>Technician</span><strong>${escapeHtml(o.technician||"—")}</strong></div>
   <div><span>PO Number</span><strong>${escapeHtml(o.po||"—")}</strong></div>
   <div><span>Customer Work Order</span><strong>${escapeHtml(o.workOrder||"—")}</strong></div>
 </div>
 <div class="review-section"><h3>Equipment</h3><table><thead><tr><th>Equipment / Machine</th><th>Manufacturer</th><th>Model</th><th>Serial Number</th></tr></thead><tbody>${eqRows||'<tr><td colspan="4">No equipment recorded.</td></tr>'}</tbody></table></div>
 <div class="review-section"><h3>Work Performed</h3><div class="review-text">${escapeHtml(o.work||"—")}</div></div>
 <div class="review-section"><h3>Parts / Materials Used</h3><table><thead><tr><th>Part Number</th><th>Description</th><th>Qty</th></tr></thead><tbody>${partRows||'<tr><td colspan="3">No parts or materials recorded.</td></tr>'}</tbody></table></div>
 <div class="review-grid">
   <div><span>Technician Notes</span><strong>${escapeHtml(o.techNotes||"—")}</strong></div>
   <div><span>Customer Comments</span><strong>${escapeHtml(o.customerComments||"—")}</strong></div>
   <div><span>Customer Name</span><strong>${escapeHtml(o.customerName||"—")}</strong></div>
   <div><span>Signature</span><strong class="signed">✓ Signature captured</strong></div>
 </div>
 ${acceptance}
 ${actions}
 <p class="next-report">Next Service Report: <strong>${escapeHtml(reportNo())}</strong></p>`;

 $("#editReport").addEventListener("click",()=>{
   $("#review").classList.add("hidden");
   $("#serviceForm").style.display="";
   const legacyActions=document.querySelector(".footer-actions");
   if(legacyActions) legacyActions.style.display="flex";
   window.scrollTo({top:0,behavior:"smooth"});
 });
 if(finalized){
   $("#generateCustomerPdf").addEventListener("click",()=>generatePDF(true));
   $("#printReview").addEventListener("click",()=>window.print());
   $("#sendCustomerCopy").addEventListener("click",()=>deliverReport(o));
 }else{
   $("#submitConfirm").addEventListener("click",async()=>{
     const latest=collect();
     latest.finalizedAt=new Date().toISOString();
     localStorage.setItem("atd_last_report",JSON.stringify(latest));
     renderReview(latest,true);
     window.scrollTo({top:0,behavior:"smooth"});
     await deliverReport(latest);
   });
 }
}

$("#serviceForm").addEventListener("submit",e=>{
 e.preventDefault();
 const form=$("#serviceForm");
 if(!reportNoReady || !currentReportNo){alert("Service Report Number is not ready. Please wait a moment and try again.");return}
 if(!form.checkValidity() || markRequiredFields()){form.reportValidity();updateFormStatus();return}
 if(!hasSig){markRequiredFields();alert("Customer signature is required.");return}
 const o=collect();
 // This is a review/draft stage. Do not increment the report number or record final acceptance yet.
 localStorage.setItem("atd_pending_report",JSON.stringify(o));
 form.style.display="none";
 const legacyActions=document.querySelector(".footer-actions");
 if(legacyActions) legacyActions.style.display="none";
 $("#review").classList.remove("hidden");
 renderReview(o,false);
 window.scrollTo({top:0,behavior:"smooth"});
});
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function generatePDF(saveFile=true){
 try{
  const o=JSON.parse(localStorage.getItem("atd_last_report")||"null");
  if(!o){alert("No completed service report is available.");return}
  if(!window.jspdf || !window.jspdf.jsPDF){
    alert("PDF engine is not loaded. Please refresh the page and try again.");return;
  }
  const {jsPDF}=window.jspdf;
  const qrDataUrl=await makeQrDataUrl(o.reportNo);
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"letter"});
  const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight(), M=14;
  const navy=[15,43,91], yellow=[255,223,34];
  const logo=new Image(); logo.src="atd-logo.png";
  await new Promise(resolve=>{logo.onload=resolve;logo.onerror=resolve});

  function textLines(text,w,size=8){doc.setFontSize(size);return doc.splitTextToSize(String(text||"—"),w)}
  function ensure(y,need=18){if(y+need>H-18){doc.addPage();return 16}return y}
  function section(title,y){
    y=ensure(y,14); doc.setFillColor(...yellow);doc.setDrawColor(229,207,28);doc.roundedRect(M,y,W-2*M,8,1.5,1.5,"FD");
    doc.setTextColor(25,35,50);doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text(title,M+4,y+5.3);return y+12;
  }
  function field(x,y,w,label,value,fill=false,h=13){
    doc.setFillColor(fill?255:255,fill?248:255,fill?191:255);doc.setDrawColor(205,213,222);doc.roundedRect(x,y,w,h,1,1,fill?"FD":"S");
    doc.setFont("helvetica","bold");doc.setFontSize(6.8);doc.setTextColor(65,76,90);doc.text(label.toUpperCase(),x+3,y+4);
    doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(25,35,50);doc.text(textLines(value,w-6,8.5).slice(0,2),x+3,y+9);
  }
  function table(headers,rows,widths,y){
    const total=widths.reduce((a,b)=>a+b,0), rowH=7;
    y=ensure(y,20);
    doc.setFillColor(244,247,250);doc.setDrawColor(205,213,222);doc.rect(M,y,total,rowH,"FD");
    let x=M;doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.setTextColor(45,60,80);
    headers.forEach((h,i)=>{doc.text(String(h),x+2,y+4.6);x+=widths[i]});
    y+=rowH;doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.setTextColor(30,40,55);
    const safeRows=rows.length?rows:[["—"]];
    safeRows.forEach(row=>{
      const lineCounts=row.map((v,i)=>textLines(v,widths[i]-4,7.2).length);
      const rh=Math.max(7,Math.min(22,Math.max(...lineCounts)*3.8+3));
      if(y+rh>H-18){doc.addPage();y=16;doc.setFillColor(244,247,250);doc.rect(M,y,total,rowH,"FD");doc.setFont("helvetica","bold");doc.setFontSize(6.5);x=M;headers.forEach((h,i)=>{doc.text(String(h),x+2,y+4.6);x+=widths[i]});y+=rowH;doc.setFont("helvetica","normal");doc.setFontSize(7.2)}
      doc.setDrawColor(205,213,222);doc.rect(M,y,total,rh,"S");x=M;
      row.forEach((v,i)=>{doc.rect(x,y,widths[i],rh,"S");doc.text(textLines(v,widths[i]-4,7.2).slice(0,5),x+2,y+4);x+=widths[i]});
      y+=rh;
    });
    return y;
  }

  if(logo.complete && logo.naturalWidth){const ratio=logo.naturalHeight/logo.naturalWidth,lw=48,lh=Math.min(lw*ratio,18);doc.addImage(logo,"PNG",M,7,lw,lh)}
  doc.setFont("helvetica","bold");doc.setFontSize(19);doc.setTextColor(...navy);doc.text("SERVICE REPORT",W/2,15,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(80,94,112);doc.text("Field Service Report & Customer Acceptance",W/2,20,{align:"center"});
  doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("CUSTOMER COPY",W/2,24,{align:"center"});
  doc.setFillColor(255,248,191);doc.setDrawColor(229,207,28);doc.roundedRect(W-72,7,58,16,2,2,"FD");doc.setTextColor(50,58,68);doc.setFontSize(6.5);doc.text("SERVICE REPORT NO.",W-69,12.5);doc.setFont("courier","bold");doc.setFontSize(8);doc.text(o.reportNo,W-69,19);
  if(qrDataUrl){try{doc.addImage(qrDataUrl,"PNG",W-47,26,33,33);doc.setFont("helvetica","bold");doc.setFontSize(6);doc.setTextColor(70,82,98);doc.text("SCAN TO VERIFY",W-30.5,61,{align:"center"});}catch(e){}}

  let y=29;
  y=section("1. CUSTOMER INFORMATION",y);
  field(M,y,58,"Company Name",o.company,true);field(M+61,y,58,"Contact Person",o.contact);field(M+122,y,62,"Email",(o.customerEmails||[o.email||""]).join("; "));y+=16;
  field(M,y,58,"Phone",(o.customerPhones||[o.phone||""]).join("; "));field(M+61,y,88,"Service Address",o.address);field(M+152,y,32,"City",o.city);y+=16;
  field(M,y,58,"Province",o.province);field(M+61,y,58,"Postal Code",o.postal);y+=19;

  y=section("2. SERVICE INFORMATION",y);
  field(M,y,38,"Service Date",o.serviceDate,true);field(M+41,y,38,"Start Time",o.startTime);field(M+82,y,38,"End Time",o.endTime);field(M+123,y,31,"Technician",o.technician);field(M+157,y,27,"PO Number",o.po);y+=16;field(M,y,184,"Customer Work Order",o.workOrder);y+=16;
  field(M,y,184,"Service Type",o.serviceType);y+=19;

  y=section("3. EQUIPMENT INFORMATION",y);
  const eqRows=(o.equipment||[]).map(e=>[e.equipment||"—",e.manufacturer||"—",e.model||"—",e.serial||"—",e.partNumber||"—",e.location||"—"]);
  y=table(["Equipment / Machine","Manufacturer","Model","Serial Number","Part Number","Location / Tag"],eqRows,[38,29,28,30,30,29],y)+7;

  y=section("4. WORK PERFORMED & MATERIALS",y);
  doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("WORK PERFORMED",M,y+3);
  const workLines=textLines(o.work||"—",W-2*M-6,8.5),workH=Math.max(20,Math.min(48,workLines.length*4+8));
  doc.setDrawColor(205,213,222);doc.roundedRect(M,y+6,W-2*M,workH,1,1,"S");doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(25,35,50);doc.text(workLines.slice(0,10),M+3,y+11);y+=workH+8;
  doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("PARTS / MATERIALS USED",M,y+3);
  const partRows=(o.parts||[]).map(p=>[p.partNo||"—",p.partDesc||"—",p.qty||"—"]);y=table(["Part Number","Description","Qty"],partRows,[48,111,25],y+6)+8;

  y=ensure(y,42);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("SERVICE RESULT / STATUS",M,y+3);
  const status=o.result||"Completed";let bg=[233,248,239],edge=[0,166,81],fg=[17,107,58];
  if(status==="Unable to Complete"){bg=[255,240,241];edge=[237,28,36];fg=[163,22,28]}
  else if(status==="Follow-up Required"){bg=[234,244,255];edge=[0,114,206];fg=[7,84,154]}
  else if(status==="Completed – Further Work Required"){bg=[240,249,223];edge=[164,210,51];fg=[79,110,11]}
  doc.setFillColor(...bg);doc.setDrawColor(...edge);doc.roundedRect(M,y+6,W-2*M,13,2,2,"FD");doc.setTextColor(...fg);doc.setFontSize(10);doc.text(status,M+5,y+14);y+=25;
  field(M,y,89,"Technician Notes",o.techNotes);field(M+95,y,89,"Customer Comments",o.customerComments);y+=29;

  y=section("5. CUSTOMER APPROVAL",y);field(M,y,62,"Customer Name",o.customerName,true);field(M+67,y,117,"Approval / Record","Customer acceptance confirmed");y+=18;
  doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("CUSTOMER SIGNATURE",M,y+3);doc.setDrawColor(140,155,170);doc.roundedRect(M,y+6,90,38,1.5,1.5,"S");
  if(o.signature){try{doc.addImage(o.signature,"PNG",M+3,y+9,84,31)}catch(e){}}
  doc.setFillColor(242,246,249);doc.setDrawColor(210,218,226);doc.roundedRect(M+96,y+6,88,38,1.5,1.5,"FD");doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(65,78,95);doc.text(textLines("I acknowledge that the services described above have been performed and that this Service Report accurately records the work completed.",80,7.5),M+100,y+12);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("Approval recorded:",M+100,y+38);doc.setFont("helvetica","normal");doc.text(new Date(o.generatedAt||Date.now()).toLocaleString("en-CA"),M+123,y+38);
  doc.setDrawColor(...navy);doc.line(M,H-14,W-M,H-14);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...navy);doc.text("AUTOMATIONTODAYCA",M,H-9);doc.setFont("helvetica","normal");doc.setTextColor(100,112,128);doc.text("Customer Copy • Field Service Report",W-M,H-9,{align:"right"});
  const dataUri=doc.output("datauristring");
  if(saveFile) doc.save(`${o.reportNo}.pdf`);
  return dataUri;
 }catch(err){console.error("Customer PDF generation failed:",err);alert("Customer PDF could not be generated. Please refresh the page and try again.");return null;}
}
async function deliverReport(o){
 const status=$("#deliveryStatus");
 const button=$("#sendCustomerCopy");
 if(status) status.textContent="";
 if(!DELIVERY_CONFIG.webAppUrl || DELIVERY_CONFIG.webAppUrl.includes("PASTE_GOOGLE_APPS_SCRIPT")){
   if(status) status.textContent="Delivery is not configured yet. Add the Google Apps Script Web App URL first.";
   return false;
 }
 try{
   if(button){button.disabled=true;button.textContent="SENDING...";}
   const dataUri=await generatePDF(false);
   if(!dataUri) throw new Error("PDF generation failed");
   const pdfBase64=dataUri.split(",")[1];
   const payload={
     googleCredential,
     authorizationProof:window.__ATD_AUTH_PROOF||"",
     reportNo:o.reportNo,
     customerEmail:o.email,
     customerEmails:o.customerEmails||[o.email].filter(Boolean),
     company:o.company,
     customerName:o.customerName,
     pdfBase64,
     filename:`${o.reportNo}.pdf`
   };
   // text/plain avoids a browser CORS preflight when calling Google Apps Script.
   await fetch(DELIVERY_CONFIG.webAppUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
   if(status) status.innerHTML="✓ Customer copy delivery request sent. The PDF is being saved to Google Drive and emailed.";
   localStorage.setItem("atd_last_delivery",new Date().toISOString());
   return true;
 }catch(err){
   console.error("Delivery failed:",err);
   if(status) status.textContent="Delivery could not be submitted. Use SEND CUSTOMER COPY to try again.";
   return false;
 }finally{
   if(button){button.disabled=false;button.textContent="SEND CUSTOMER COPY";}
 }
}
function downloadData(){generatePDF(true);}


/* =========================================================
   GOOGLE SIGN-IN — V13
   SERVER-AUTHORIZED / NO FRONTEND USER IDENTITY
   ========================================================= */

/*
 * SECURITY PURPOSE:
 * - The Google Client ID is public configuration.
 * - The Google ID token is sent to Apps Script.
 * - Code.gs verifies the token and makes the authorization decision.
 * - Code.gs returns a short-lived authorization proof.
 * - Private server configuration is never embedded here.
 * - The frontend does not decode, store, or log the user's Google
 *   email/name.
 *
 * TRANSPORT:
 * V13 uses the matching callback-script transport.
 * No iframe and no window.postMessage() authentication bridge.
 */

const GOOGLE_CLIENT_ID =
  "246009211153-kqkpn2d35ebrgu5osa1l12i8tt4rhd21.apps.googleusercontent.com";

let googleAuthenticated = false;
let googleCredential = null;

window.__ATD_AUTH_PROOF = "";


function loadGoogleIdentityServices(){

  return new Promise((resolve,reject)=>{

    if(
      window.google &&
      window.google.accounts
    ){

      resolve();
      return;

    }

    const existing =
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

    if(existing){

      existing.addEventListener(
        "load",
        resolve,
        {once:true}
      );

      existing.addEventListener(
        "error",
        reject,
        {once:true}
      );

      return;

    }

    const script =
      document.createElement("script");

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async=true;
    script.defer=true;
    script.onload=resolve;
    script.onerror=reject;

    document.head.appendChild(script);

  });

}


function authorizeThroughBackend(credential){

  return new Promise(function(resolve,reject){

    if(!credential){

      reject(
        new Error(
          "Google authentication credential is missing."
        )
      );

      return;

    }

    const callbackName =
      "atdAuthCallback_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2);

    const script =
      document.createElement("script");

    let finished=false;

    function cleanup(){

      if(
        script &&
        script.parentNode
      ){

        script.parentNode.removeChild(
          script
        );

      }

      try{
        delete window[callbackName];
      }catch(_){
        window[callbackName]=undefined;
      }

    }

    function finish(result){

      if(finished) return;

      finished=true;
      cleanup();
      resolve(result);

    }

    function fail(error){

      if(finished) return;

      finished=true;
      cleanup();
      reject(error);

    }

    window[callbackName]=function(result){
      finish(result);
    };

    script.onerror=function(){

      fail(
        new Error(
          "Authorization server could not be reached."
        )
      );

    };

    const params =
      new URLSearchParams();

    params.set(
      "mode",
      "auth"
    );

    params.set(
      "callback",
      callbackName
    );

    params.set(
      "googleCredential",
      credential
    );

    script.src =
      DELIVERY_CONFIG.webAppUrl +
      "?" +
      params.toString();

    document.head.appendChild(
      script
    );

    setTimeout(function(){

      if(!finished){

        fail(
          new Error(
            "Authorization server timed out."
          )
        );

      }

    },20000);

  });

}


async function handleGoogleCredential(response){

  /*
   * Do not decode the Google JWT in the frontend.
   * The backend is the authority for access control.
   */

  const credential =
    String(
      response &&
      response.credential ||
      ""
    ).trim();

  if(!credential){

    showGoogleLoginError(
      "Google sign-in failed. Please try again."
    );

    return;

  }

  try{

    const proof =
      await authorizeThroughBackend(
        credential
      );

    if(
      !proof ||
      proof.ok!==true ||
      proof.authorized!==true ||
      !proof.proof
    ){

      throw new Error(
        "Access denied."
      );

    }

    googleAuthenticated=true;
    googleCredential=credential;
    window.__ATD_AUTH_PROOF=proof.proof;

    unlockServiceReport();

  }catch(err){

    console.error(
      "AutomationTodayCA authorization failed:",
      err
    );

    googleAuthenticated=false;
    googleCredential=null;
    window.__ATD_AUTH_PROOF="";

    showGoogleLoginError(
      "Access denied. This Google account is not authorized."
    );

  }

}


function showGoogleLoginError(message){

  const el =
    document.getElementById(
      "googleLoginError"
    );

  if(el){
    el.textContent=message;
  }

}


function createGoogleLoginScreen(){

  if(
    document.getElementById(
      "googleLoginOverlay"
    )
  ){
    return;
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "googleLoginOverlay";

  overlay.innerHTML=`
    <div class="atd-login-overlay">
      <div class="atd-login-card">
        <div class="atd-login-logo">
          <img src="atd-logo.png"
               alt="AutomationTodayCA"
               onerror="this.style.display='none'">
        </div>

        <div class="atd-login-title">
          AutomationTodayCA Service Report
        </div>

        <div class="atd-login-subtitle">
          Authorized access required
        </div>

        <div id="googleLoginButton"></div>

        <div id="googleLoginError"
             role="alert"
             aria-live="polite"></div>

        <div class="atd-login-note">
          Sign in with your authorized Google account to continue.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(
    overlay
  );

}


function addGoogleLoginStyles(){

  if(
    document.getElementById(
      "atdGoogleLoginStyles"
    )
  ){
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "atdGoogleLoginStyles";

  style.textContent=`
    .atd-login-overlay{
      position:fixed;
      inset:0;
      z-index:999999;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(15,23,42,.96);
    }

    .atd-login-card{
      width:min(440px,calc(100vw - 40px));
      padding:34px;
      border-radius:16px;
      background:#fff;
      box-shadow:0 20px 60px rgba(0,0,0,.28);
      text-align:center;
    }

    .atd-login-logo{
      min-height:48px;
      margin-bottom:12px;
    }

    .atd-login-logo img{
      max-width:220px;
      max-height:58px;
    }

    .atd-login-title{
      color:#1f2937;
      font-size:21px;
      font-weight:700;
      margin-bottom:8px;
    }

    .atd-login-subtitle{
      color:#718096;
      font-size:14px;
      margin-bottom:28px;
    }

    #googleLoginButton{
      min-height:44px;
      display:flex;
      align-items:center;
      justify-content:center;
      margin:0 auto;
    }

    .atd-login-note{
      margin-top:20px;
      color:#8a95a5;
      font-size:12px;
      line-height:1.5;
    }

    #googleLoginError{
      color:#b42318;
      font-size:13px;
      line-height:1.45;
      margin-top:14px;
      min-height:18px;
    }
  `;

  document.head.appendChild(
    style
  );

}


function lockServiceReport(){

  googleAuthenticated=false;

  document.body.classList.add(
    "atd-auth-locked"
  );

}


function unlockServiceReport(){

  googleAuthenticated=true;

  document.body.classList.remove(
    "atd-auth-locked"
  );

  const overlay =
    document.getElementById(
      "googleLoginOverlay"
    );

  if(overlay){
    overlay.remove();
  }

  const dateEl=document.querySelector('[name="serviceDate"]');
  if(dateEl && dateEl.value){
    reserveReportNumber(dateEl.value);
  }

}


function checkGoogleSession(){

  /*
   * SECURITY:
   * Never trust browser storage as authorization.
   * Every page load starts locked.
   */

  googleAuthenticated=false;
  googleCredential=null;
  window.__ATD_AUTH_PROOF="";

  sessionStorage.removeItem(
    "atd_google_authenticated"
  );

  sessionStorage.removeItem(
    "atd_google_email"
  );

  sessionStorage.removeItem(
    "atd_google_name"
  );

  return false;

}


async function startGoogleAuthentication(){

  createGoogleLoginScreen();
  addGoogleLoginStyles();

  try{

    await loadGoogleIdentityServices();

    google.accounts.id.initialize({

      client_id:GOOGLE_CLIENT_ID,
      callback:handleGoogleCredential,
      auto_select:false,
      cancel_on_tap_outside:false

    });

    google.accounts.id.renderButton(

      document.getElementById(
        "googleLoginButton"
      ),

      {
        type:"standard",
        theme:"outline",
        size:"large",
        text:"signin_with",
        shape:"rectangular",
        logo_alignment:"left",
        width:320
      }

    );

  }catch(err){

    console.error(
      "Google authentication initialization failed:",
      err
    );

    showGoogleLoginError(
      "Google Sign-In could not be initialized. Please refresh the page."
    );

  }

}


function googleLogout(){

  googleAuthenticated=false;
  googleCredential=null;
  window.__ATD_AUTH_PROOF="";

  sessionStorage.removeItem(
    "atd_google_authenticated"
  );

  sessionStorage.removeItem(
    "atd_google_email"
  );

  sessionStorage.removeItem(
    "atd_google_name"
  );

  location.reload();

}


/* Start authentication after the Service Report code has loaded. */
if(!checkGoogleSession()){
  startGoogleAuthentication();
}
