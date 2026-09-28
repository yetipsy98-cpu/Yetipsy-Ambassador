const SHEETS={USERS:'Users',PASSES:'QR_Passes',CHECKINS:'Checkins',REDEEMS:'Redeem_Log',WALLET:'Wallet',PRICING:'Daily_Pricing',SESSIONS:'Sessions',AUDIT:'Audit_Log'};

function doPost(e){
  try{
    const p=e.parameter||{}, action=p.action;
    if(!action) throw new Error('Missing action');
    const publicActions=['login'];
    let user=null;
    if(!publicActions.includes(action)) user=requireSession_(p.session_token);
    const map={
      login:()=>login_(p), ambassadorDashboard:()=>ambassadorDashboard_(user), createPass:()=>createPass_(user,p),
      updatePass:()=>updatePass_(user,p), lookupPass:()=>lookupPass_(user,p), partialRedeem:()=>partialRedeem_(user,p),
      checkout:()=>checkout_(user,p), staffRecent:()=>staffRecent_(user), adminDashboard:()=>adminDashboard_(user),
      createAmbassador:()=>createAmbassador_(user,p), saveDailyPrice:()=>saveDailyPrice_(user,p),
      listDailyPrices:()=>listDailyPrices_(user), getPriceForDate:()=>getPriceForDateAction_(user,p)
    };
    if(!map[action]) throw new Error('Unknown action');
    return json_({ok:true,data:map[action]()});
  }catch(err){return json_({ok:false,error:String(err.message||err)})}
}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function ss_(){return SpreadsheetApp.getActive()}
function sh_(name){const s=ss_().getSheetByName(name);if(!s)throw new Error('Missing sheet '+name+'. Run setupSheets() first.');return s}
function rows_(name){const s=sh_(name),v=s.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).filter(r=>r.some(x=>x!=='' )).map(r=>Object.fromEntries(h.map((k,j)=>[k,r[j]])))}
function append_(name,obj){const s=sh_(name),h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];s.appendRow(h.map(k=>obj[k]??''))}
function updateById_(name,idField,idValue,patch){const s=sh_(name),v=s.getDataRange().getValues(),h=v[0],idx=h.indexOf(idField);for(let i=1;i<v.length;i++){if(String(v[i][idx])===String(idValue)){Object.entries(patch).forEach(([k,val])=>{const c=h.indexOf(k);if(c>=0)s.getRange(i+1,c+1).setValue(val)});return true}}return false}
function uuid_(prefix){return prefix+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase()}
function now_(){return new Date()}
function hash_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8).map(b=>(b+256)%256).map(b=>b.toString(16).padStart(2,'0')).join('')}
function dateKey_(x){if(!x)return'';if(Object.prototype.toString.call(x)==='[object Date]')return Utilities.formatDate(x,Session.getScriptTimeZone()||'Asia/Kuala_Lumpur','yyyy-MM-dd');return String(x).slice(0,10)}
function num_(x){const n=Number(x);return Number.isFinite(n)?n:0}

function login_(p){
  const role=String(p.role||'').toLowerCase();
  const u=rows_(SHEETS.USERS).find(x=>String(x.username)===String(p.username)&&String(x.role).toLowerCase()===role&&String(x.status||'ACTIVE')==='ACTIVE');
  if(!u||String(u.password_hash)!==hash_(p.password||''))throw new Error('Invalid login');
  const token=uuid_('SES');
  append_(SHEETS.SESSIONS,{session_token:token,user_id:u.user_id,role:u.role,created_at:now_(),expires_at:new Date(Date.now()+1000*60*60*24*7)});
  return{token,role:u.role,name:u.name,username:u.username,user_id:u.user_id};
}
function requireSession_(token){const s=rows_(SHEETS.SESSIONS).find(x=>String(x.session_token)===String(token));if(!s||new Date(s.expires_at)<new Date())throw new Error('Session expired');const u=rows_(SHEETS.USERS).find(x=>String(x.user_id)===String(s.user_id)&&String(x.status||'ACTIVE')==='ACTIVE');if(!u)throw new Error('User not found');return u}
function requireRole_(u,roles){if(!roles.includes(String(u.role)))throw new Error('Permission denied')}

function setupSheets(){
  const defs={
    Users:['user_id','role','name','username','password_hash','commission_rate','status','created_at'],
    QR_Passes:['pass_id','pass_ref','qr_token','ambassador_id','type','label','reservation_date','planned_pax','remark','status','actual_pax','actual_male','actual_female','sales','created_at','updated_at','closed_at'],
    Checkins:['checkin_ref','pass_id','ambassador_id','staff_id','pax','male','female','table_no','remark','created_at'],
    Redeem_Log:['redeem_ref','pass_id','pass_ref','ambassador_id','staff_id','reservation_date','table_no','pax_charged','price_per_pax','sales_amount','commission_rate','commission_amount','final_payment','created_at','status'],
    Wallet:['wallet_txn_id','ambassador_id','redeem_ref','type','amount','created_at'],
    Daily_Pricing:['price_id','price_date','price_per_pax','note','status','updated_by','updated_at'],
    Sessions:['session_token','user_id','role','created_at','expires_at'],
    Audit_Log:['audit_id','user_id','action','entity','entity_id','detail','created_at']
  };
  Object.entries(defs).forEach(([n,h])=>{let s=ss_().getSheetByName(n);if(!s)s=ss_().insertSheet(n);if(s.getLastRow()===0){s.appendRow(h)}else{const old=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];h.forEach(col=>{if(!old.includes(col)){s.getRange(1,s.getLastColumn()+1).setValue(col);old.push(col)}})}});
}
function seedDemoUsers(){setupSheets();const s=rows_(SHEETS.USERS);if(!s.find(x=>x.username==='owner'))append_(SHEETS.USERS,{user_id:'USR-ADMIN',role:'admin',name:'Owner',username:'owner',password_hash:hash_('ChangeMe123!'),commission_rate:0,status:'ACTIVE',created_at:now_()});if(!s.find(x=>x.username==='staff1'))append_(SHEETS.USERS,{user_id:'USR-STAFF1',role:'staff',name:'Staff 1',username:'staff1',password_hash:hash_('ChangeMe123!'),commission_rate:0,status:'ACTIVE',created_at:now_()})}

function createAmbassador_(u,p){requireRole_(u,['admin']);if(!p.name||!p.username||!p.password)throw new Error('Missing fields');if(rows_(SHEETS.USERS).some(x=>String(x.username)===String(p.username)))throw new Error('Username exists');const rate=num_(p.commission_rate);if(rate<0||rate>100)throw new Error('Invalid commission rate');append_(SHEETS.USERS,{user_id:uuid_('AMB'),role:'ambassador',name:p.name,username:p.username,password_hash:hash_(p.password),commission_rate:rate,status:'ACTIVE',created_at:now_()});audit_(u,'CREATE_AMBASSADOR','user',p.username,p.name);return true}

function createPass_(u,p){
  requireRole_(u,['ambassador']);
  const type=String(p.type||'GROUP').toUpperCase();if(!['INDIVIDUAL','GROUP'].includes(type))throw new Error('Invalid type');
  const pax=Math.floor(num_(p.planned_pax));if(!(pax>0))throw new Error('人数必须大于 0');
  const reservationDate=dateKey_(p.reservation_date);if(!/^\d{4}-\d{2}-\d{2}$/.test(reservationDate))throw new Error('请选择预定日期');
  const pass_id=uuid_('PASS'),pass_ref='YT-'+(type==='GROUP'?'G':'I')+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,6).toUpperCase(),qr_token=Utilities.getUuid().replace(/-/g,'');
  append_(SHEETS.PASSES,{pass_id,pass_ref,qr_token,ambassador_id:u.user_id,type,label:p.label||'',reservation_date:reservationDate,planned_pax:pax,remark:p.remark||'',status:'ISSUED',actual_pax:0,actual_male:0,actual_female:0,sales:0,created_at:now_(),updated_at:now_()});
  audit_(u,'CREATE_PASS','pass',pass_id,`${reservationDate} / ${pax} pax`);return{pass_id,pass_ref,qr_token};
}
function updatePass_(u,p){
  requireRole_(u,['ambassador']);
  const pass=rows_(SHEETS.PASSES).find(x=>String(x.pass_id)===String(p.pass_id)&&String(x.ambassador_id)===String(u.user_id));if(!pass)throw new Error('Pass not found');
  if(String(pass.status)!=='ISSUED'||num_(pass.actual_pax)>0)throw new Error('Staff 已开始 Check-in，预定内容已锁定');
  const pax=Math.floor(num_(p.planned_pax));if(!(pax>0))throw new Error('人数必须大于 0');
  const reservationDate=dateKey_(p.reservation_date);if(!/^\d{4}-\d{2}-\d{2}$/.test(reservationDate))throw new Error('请选择预定日期');
  const type=String(p.type||pass.type).toUpperCase();if(!['INDIVIDUAL','GROUP'].includes(type))throw new Error('Invalid type');
  updateById_(SHEETS.PASSES,'pass_id',pass.pass_id,{type,label:p.label||'',reservation_date:reservationDate,planned_pax:pax,remark:p.remark||'',updated_at:now_()});
  audit_(u,'UPDATE_PASS','pass',pass.pass_id,`${reservationDate} / ${pax} pax`);return passView_(rows_(SHEETS.PASSES).find(x=>String(x.pass_id)===String(pass.pass_id)));
}
function passView_(p){const amb=rows_(SHEETS.USERS).find(x=>String(x.user_id)===String(p.ambassador_id));const price=getPriceForDate_(dateKey_(p.reservation_date));return{...p,reservation_date:dateKey_(p.reservation_date),ambassador_name:amb?.name||p.ambassador_id,price_per_pax:price?num_(price.price_per_pax):null,price_note:price?.note||'',can_edit:String(p.status)==='ISSUED'&&num_(p.actual_pax)===0}}
function lookupPass_(u,p){requireRole_(u,['staff','admin']);const q=String(p.token_or_ref||'').trim();const pass=rows_(SHEETS.PASSES).find(x=>String(x.qr_token)===q||String(x.pass_ref)===q);if(!pass)throw new Error('Pass not found');if(String(pass.status)==='VOID')throw new Error('Pass is void');return passView_(pass)}

function partialRedeem_(u,p){requireRole_(u,['staff','admin']);const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw new Error('System busy, retry');try{return partialLocked_(u,p)}finally{lock.releaseLock()}}
function partialLocked_(u,p){
  const pass=rows_(SHEETS.PASSES).find(x=>String(x.pass_id)===String(p.pass_id));if(!pass)throw new Error('Pass not found');if(['PAID','VOID'].includes(String(pass.status)))throw new Error('Pass closed');
  const pax=Math.floor(num_(p.pax)),m=Math.floor(num_(p.male)),f=Math.floor(num_(p.female));if(!(pax>0)||m<0||f<0||m+f!==pax)throw new Error('男 + 女必须等于实际人数');
  const nr={pax:num_(pass.actual_pax)+pax,m:num_(pass.actual_male)+m,f:num_(pass.actual_female)+f};
  append_(SHEETS.CHECKINS,{checkin_ref:uuid_('CI'),pass_id:pass.pass_id,ambassador_id:pass.ambassador_id,staff_id:u.user_id,pax,male:m,female:f,table_no:p.table_no||'',remark:p.remark||'',created_at:now_()});
  updateById_(SHEETS.PASSES,'pass_id',pass.pass_id,{actual_pax:nr.pax,actual_male:nr.m,actual_female:nr.f,status:'PARTIAL',updated_at:now_()});
  audit_(u,'PARTIAL_REDEEM','pass',pass.pass_id,`${pax} pax (${m}M/${f}F)`);
  return{pass:passView_(rows_(SHEETS.PASSES).find(x=>String(x.pass_id)===String(pass.pass_id)))};
}

function checkout_(u,p){
  requireRole_(u,['staff','admin']);const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw new Error('System busy, retry');
  try{
    const pass=rows_(SHEETS.PASSES).find(x=>String(x.pass_id)===String(p.pass_id));if(!pass)throw new Error('Pass not found');if(['PAID','VOID'].includes(String(pass.status)))throw new Error('Pass closed');if(num_(pass.actual_pax)<=0)throw new Error('请先登记实际到场人数');
    const price=getPriceForDate_(dateKey_(pass.reservation_date));if(!price)throw new Error('Admin 尚未设置 '+dateKey_(pass.reservation_date)+' 的价格');
    const unit=num_(price.price_per_pax),totalDue=Math.round(num_(pass.actual_pax)*unit*100)/100,already=Math.round(num_(pass.sales)*100)/100,sales=Math.round((totalDue-already)*100)/100;
    if(!(sales>0))throw new Error('目前没有新的应收金额');
    const amb=rows_(SHEETS.USERS).find(x=>String(x.user_id)===String(pass.ambassador_id));if(!amb)throw new Error('Ambassador not found');
    const rate=num_(amb.commission_rate),commission=Math.round(sales*rate)/100;
    const paxCharged=unit>0?Math.round((sales/unit)*100)/100:0;
    const redeem_ref='YT-RD-'+Utilities.formatDate(now_(),Session.getScriptTimeZone()||'Asia/Kuala_Lumpur','yyMMdd')+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,5).toUpperCase();
    append_(SHEETS.REDEEMS,{redeem_ref,pass_id:pass.pass_id,pass_ref:pass.pass_ref,ambassador_id:pass.ambassador_id,staff_id:u.user_id,reservation_date:dateKey_(pass.reservation_date),table_no:p.table_no||'',pax_charged:paxCharged,price_per_pax:unit,sales_amount:sales,commission_rate:rate,commission_amount:commission,final_payment:String(p.final_payment)==='1'?'YES':'NO',created_at:now_(),status:'CONFIRMED'});
    append_(SHEETS.WALLET,{wallet_txn_id:uuid_('WLT'),ambassador_id:pass.ambassador_id,redeem_ref,type:'COMMISSION',amount:commission,created_at:now_()});
    const newSales=Math.round((already+sales)*100)/100,newStatus=String(p.final_payment)==='1'?'PAID':'PARTIALLY_PAID';
    updateById_(SHEETS.PASSES,'pass_id',pass.pass_id,{sales:newSales,status:newStatus,updated_at:now_(),closed_at:newStatus==='PAID'?now_():''});
    audit_(u,'CHECKOUT','pass',pass.pass_id,`${sales} @ ${unit} / commission ${commission}`);
    return{redeem_ref,commission,sales_amount:sales,price_per_pax:unit,pass:passView_(rows_(SHEETS.PASSES).find(x=>String(x.pass_id)===String(pass.pass_id)))};
  }finally{lock.releaseLock()}
}

function saveDailyPrice_(u,p){
  requireRole_(u,['admin']);const d=dateKey_(p.price_date),price=num_(p.price_per_pax);if(!/^\d{4}-\d{2}-\d{2}$/.test(d))throw new Error('请选择日期');if(!(price>=0))throw new Error('Invalid price');
  const existing=rows_(SHEETS.PRICING).find(x=>dateKey_(x.price_date)===d);
  if(existing) updateById_(SHEETS.PRICING,'price_id',existing.price_id,{price_date:d,price_per_pax:price,note:p.note||'',status:'ACTIVE',updated_by:u.user_id,updated_at:now_()});
  else append_(SHEETS.PRICING,{price_id:uuid_('PRICE'),price_date:d,price_per_pax:price,note:p.note||'',status:'ACTIVE',updated_by:u.user_id,updated_at:now_()});
  audit_(u,'SAVE_DAILY_PRICE','pricing',d,`${price}`);return true;
}
function getPriceForDate_(d){return rows_(SHEETS.PRICING).find(x=>dateKey_(x.price_date)===dateKey_(d)&&String(x.status||'ACTIVE')==='ACTIVE')||null}
function getPriceForDateAction_(u,p){requireRole_(u,['staff','admin']);const x=getPriceForDate_(p.price_date);return x?{price_date:dateKey_(x.price_date),price_per_pax:num_(x.price_per_pax),note:x.note||''}:null}
function listDailyPrices_(u){requireRole_(u,['admin']);return rows_(SHEETS.PRICING).filter(x=>String(x.status||'ACTIVE')==='ACTIVE').map(x=>({...x,price_date:dateKey_(x.price_date)})).sort((a,b)=>String(b.price_date).localeCompare(String(a.price_date))).slice(0,180)}

function ambassadorDashboard_(u){requireRole_(u,['ambassador']);const passes=rows_(SHEETS.PASSES).filter(x=>String(x.ambassador_id)===String(u.user_id)).map(passView_).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));const wallet=rows_(SHEETS.WALLET).filter(x=>String(x.ambassador_id)===String(u.user_id));return{sales:passes.reduce((a,x)=>a+num_(x.sales),0),wallet:wallet.reduce((a,x)=>a+num_(x.amount),0),issued_count:passes.length,redeemed_count:passes.filter(x=>num_(x.sales)>0).length,passes,wallet_history:wallet.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,100)}}
function staffRecent_(u){requireRole_(u,['staff','admin']);return rows_(SHEETS.REDEEMS).filter(x=>String(u.role)==='admin'||String(x.staff_id)===String(u.user_id)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,50)}
function adminDashboard_(u){requireRole_(u,['admin']);const users=rows_(SHEETS.USERS),wallet=rows_(SHEETS.WALLET),redeems=rows_(SHEETS.REDEEMS),checkins=rows_(SHEETS.CHECKINS);const ambassadors=users.filter(x=>String(x.role)==='ambassador').map(a=>({...a,wallet:wallet.filter(w=>String(w.ambassador_id)===String(a.user_id)).reduce((s,w)=>s+num_(w.amount),0)}));return{total_sales:redeems.reduce((s,r)=>s+num_(r.sales_amount),0),total_commission:redeems.reduce((s,r)=>s+num_(r.commission_amount),0),total_pax:checkins.reduce((s,c)=>s+num_(c.pax),0),ambassadors,redeems:redeems.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,100).map(r=>({...r,ambassador_name:users.find(x=>String(x.user_id)===String(r.ambassador_id))?.name||r.ambassador_id}))}}
function audit_(u,action,entity,entity_id,detail){append_(SHEETS.AUDIT,{audit_id:uuid_('AUD'),user_id:u.user_id,action,entity,entity_id,detail,created_at:now_()})}
